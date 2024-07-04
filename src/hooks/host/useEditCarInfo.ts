import { ContractTransactionResponse, Signer } from "ethers";
import { useEffect, useState } from "react";
import { IRentalityContract } from "@/model/blockchain/IRentalityContract";
import { ENGINE_TYPE_ELECTRIC_STRING, ENGINE_TYPE_PETROL_STRING, getEngineTypeString } from "@/model/EngineType";
import { getIpfsURIfromPinata, getMetaDataFromIpfs } from "@/utils/ipfsUtils";
import {
  HostCarInfo,
  UNLIMITED_MILES_VALUE,
  UNLIMITED_MILES_VALUE_TEXT,
  getMilesIncludedPerDayText,
} from "@/model/HostCarInfo";
import { useRentality } from "@/contexts/rentalityContext";
import { getMoneyInCentsFromString } from "@/utils/formInput";
import { useEthereum } from "@/contexts/web3/ethereumContext";
import {
  ContractCarDetails,
  ContractCarInfo,
  ContractSignedLocationInfo,
  ContractUpdateCarInfoRequest,
} from "@/model/blockchain/schemas";
import { displayMoneyFromCentsWith2Digits } from "@/utils/numericFormatters";
import { emptyLocationInfo } from "@/model/LocationInfo";
import { bigIntReplacer } from "@/utils/json";
import { mapLocationInfoToContractLocationInfo } from "@/utils/location";

const emptyHostCarInfo: HostCarInfo = {
  carId: -1,
  ownerAddress: "",
  vinNumber: "",
  brand: "",
  model: "",
  releaseYear: "",
  image: "",
  name: "",
  licensePlate: "",
  licenseState: "",
  seatsNumber: "",
  doorsNumber: "",
  tankVolumeInGal: "",
  wheelDrive: "",
  transmission: "",
  trunkSize: "",
  color: "",
  bodyType: "",
  description: "",
  pricePerDay: "",
  milesIncludedPerDay: "",
  securityDeposit: "",
  fuelPricePerGal: "",
  locationInfo: emptyLocationInfo,
  isLocationEdited: false,
  currentlyListed: true,
  engineTypeText: "",
  fullBatteryChargePrice: "",
  timeBufferBetweenTripsInMin: 0,
  isInsuranceIncluded: false,
};

const useEditCarInfo = (carId: number) => {
  const ethereumInfo = useEthereum();
  const rentalityContract = useRentality();
  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [carInfoFormParams, setCarInfoFormParams] = useState<HostCarInfo>(emptyHostCarInfo);
  const [dataSaved, setDataSaved] = useState<Boolean>(true);

  const saveCar = async () => {
    if (!rentalityContract) {
      console.error("saveCar error: rentalityContract is null");
      return false;
    }

    try {
      setDataSaved(false);

      const pricePerDayInUsdCents = BigInt(getMoneyInCentsFromString(carInfoFormParams.pricePerDay));
      const securityDepositPerTripInUsdCents = BigInt(getMoneyInCentsFromString(carInfoFormParams.securityDeposit));

      const engineParams: bigint[] = [];
      if (carInfoFormParams.engineTypeText === ENGINE_TYPE_PETROL_STRING) {
        engineParams.push(BigInt(getMoneyInCentsFromString(carInfoFormParams.fuelPricePerGal)));
      } else if (carInfoFormParams.engineTypeText === ENGINE_TYPE_ELECTRIC_STRING) {
        engineParams.push(BigInt(getMoneyInCentsFromString(carInfoFormParams.fullBatteryChargePrice)));
      }

      const milesIncludedPerDay =
        carInfoFormParams.milesIncludedPerDay === UNLIMITED_MILES_VALUE_TEXT
          ? BigInt(UNLIMITED_MILES_VALUE)
          : BigInt(carInfoFormParams.milesIncludedPerDay);

      const updateCarRequest: ContractUpdateCarInfoRequest = {
        carId: BigInt(carId),
        currentlyListed: carInfoFormParams.currentlyListed,
        engineParams: engineParams,
        pricePerDayInUsdCents: pricePerDayInUsdCents,
        milesIncludedPerDay: milesIncludedPerDay,
        timeBufferBetweenTripsInSec: BigInt(carInfoFormParams.timeBufferBetweenTripsInMin * 60),
        securityDepositPerTripInUsdCents: securityDepositPerTripInUsdCents,
      };

      const location: ContractSignedLocationInfo = {
        locationInfo: mapLocationInfoToContractLocationInfo(carInfoFormParams.locationInfo),
        signature: "",
      };
      let transaction: ContractTransactionResponse;

      if (carInfoFormParams.isLocationEdited) {
        console.log(`location: ${JSON.stringify(location, bigIntReplacer)}`);

        transaction = await rentalityContract.updateCarInfoWithLocation(
          updateCarRequest,
          location,
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
        );
      } else {
        transaction = await rentalityContract.updateCarInfo(updateCarRequest);
      }

      await transaction.wait();
      setDataSaved(true);
      return true;
    } catch (e) {
      console.error("Upload error" + e);
      setDataSaved(true);
      return false;
    }
  };

  useEffect(() => {
    const getCarInfo = async (rentalityContract: IRentalityContract, signer: Signer) => {
      if (rentalityContract == null) {
        console.error("getCarInfo error: contract is null");
        return;
      }

      try {
        const carInfo: ContractCarInfo = await rentalityContract.getCarInfoById(BigInt(carId));
        const carInfoDetails: ContractCarDetails = await rentalityContract.getCarDetails(BigInt(carId));

        const signerAddress = await signer.getAddress();
        if (carInfoDetails.host !== signerAddress) {
          return emptyHostCarInfo;
        }

        const tokenURI = await rentalityContract.getCarMetadataURI(carInfoDetails.carId);
        const meta = await getMetaDataFromIpfs(tokenURI);

        const price = Number(carInfoDetails.pricePerDayInUsdCents) / 100;
        const securityDeposit = Number(carInfoDetails.securityDepositPerTripInUsdCents) / 100;
        const engineTypeString = getEngineTypeString(carInfoDetails.engineType);

        const fuelPricePerGal =
          engineTypeString === ENGINE_TYPE_PETROL_STRING
            ? displayMoneyFromCentsWith2Digits(carInfoDetails.engineParams[1])
            : "";
        const fullBatteryChargePrice =
          engineTypeString === ENGINE_TYPE_ELECTRIC_STRING
            ? displayMoneyFromCentsWith2Digits(carInfoDetails.engineParams[0])
            : "";

        let item: HostCarInfo = {
          carId: Number(carInfoDetails.carId),
          ownerAddress: carInfoDetails.host.toString(),
          image: getIpfsURIfromPinata(meta.image),
          vinNumber: carInfo.carVinNumber,
          brand: carInfoDetails.brand,
          model: carInfoDetails.model,
          releaseYear: Number(carInfoDetails.yearOfProduction).toString(),
          name: meta.name ?? "",
          licensePlate: meta.attributes?.find((x: any) => x.trait_type === "License plate")?.value ?? "",
          licenseState: meta.attributes?.find((x: any) => x.trait_type === "License state")?.value ?? "",
          seatsNumber: meta.attributes?.find((x: any) => x.trait_type === "Seats number")?.value ?? "",
          doorsNumber: meta.attributes?.find((x: any) => x.trait_type === "Doors number")?.value ?? "",
          tankVolumeInGal: meta.attributes?.find((x: any) => x.trait_type === "Tank volume(gal)")?.value ?? "",
          wheelDrive: meta.attributes?.find((x: any) => x.trait_type === "Wheel drive")?.value ?? "",
          transmission: meta.attributes?.find((x: any) => x.trait_type === "Transmission")?.value ?? "",
          trunkSize: meta.attributes?.find((x: any) => x.trait_type === "Trunk size")?.value ?? "",
          color: meta.attributes?.find((x: any) => x.trait_type === "Color")?.value ?? "",
          bodyType: meta.attributes?.find((x: any) => x.trait_type === "Body type")?.value ?? "",
          description: meta.description ?? "",
          pricePerDay: price.toString(),
          milesIncludedPerDay: getMilesIncludedPerDayText(carInfoDetails.milesIncludedPerDay),
          securityDeposit: securityDeposit.toString(),
          locationInfo: {
            address: carInfoDetails.locationInfo.userAddress
              .split(",")
              .map((i) => i.trim())
              .join(", "),
            country: carInfoDetails.locationInfo.country,
            state: carInfoDetails.locationInfo.state,
            city: carInfoDetails.locationInfo.city,
            latitude: Number(carInfoDetails.locationInfo.latitude),
            longitude: Number(carInfoDetails.locationInfo.longitude),
            timeZoneId: carInfoDetails.locationInfo.timeZoneId,
          },
          isLocationEdited: false,
          currentlyListed: carInfo.currentlyListed,
          engineTypeText: engineTypeString,
          fuelPricePerGal: fuelPricePerGal,
          fullBatteryChargePrice: fullBatteryChargePrice,
          timeBufferBetweenTripsInMin: Number(carInfo.timeBufferBetweenTripsInSec) / 60,
          isInsuranceIncluded: carInfo.insuranceIncluded,
        };
        return item;
      } catch (e) {
        console.error("getCarInfo error:" + e);
      }
    };

    if (isNaN(carId) || carId == -1) return;
    if (!ethereumInfo) return;
    if (!rentalityContract) return;

    getCarInfo(rentalityContract, ethereumInfo.signer)
      .then((data) => {
        setCarInfoFormParams(data ?? emptyHostCarInfo);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [carId, rentalityContract, ethereumInfo]);

  return [isLoading, carInfoFormParams, setCarInfoFormParams, dataSaved, saveCar] as const;
};

export default useEditCarInfo;
