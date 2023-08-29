import { Contract, BrowserProvider } from "ethers";
import { useEffect, useState } from "react";
import { rentalityJSON } from "../../abis";
import {
  ContractTrip,
  getTripStatusFromContract,
  validateContractTrip,
} from "@/model/blockchain/ContractTrip";
import {
  TripInfo,
  AllowedChangeTripAction,
  TripStatus,
} from "@/model/TripInfo";
import { getIpfsURIfromPinata, getMetaDataFromIpfs } from "@/utils/ipfsUtils";
import { IRentalityContract } from "@/model/blockchain/IRentalityContract";

const useGuestTrips = () => {
  const [dataFetched, setDataFetched] = useState<Boolean>(false);
  const [updateRequired, setUpdateRequired] = useState<Boolean>(true);
  const [tripsBooked, setTripsBooked] = useState<TripInfo[]>([]);
  const [tripsHistory, setTripsHistory] = useState<TripInfo[]>([]);

  const updateData = () => {
    setUpdateRequired(true);
  };

  const getRentalityContract = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.error("Ethereum wallet is not found");
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      return new Contract(
        rentalityJSON.address,
        rentalityJSON.abi,
        signer
      ) as unknown as IRentalityContract;
    } catch (e) {
      console.error("getRentalityContract error:" + e);
    }
  };

  const rejectRequest = async (tripId: bigint, params: string[]) => {
    try {
      const rentalityContract = await getRentalityContract();

      if (!rentalityContract) {
        console.error("rejectRequest error: contract is null");
        return false;
      }

      let transaction = await rentalityContract.rejectTripRequest(tripId);

      const result = await transaction.wait();
      return true;
    } catch (e) {
      console.error("rejectRequest error:" + e);
      return false;
    }
  };

  const checkInTrip = async (tripId: bigint, params: string[]) => {
    try {
      const rentalityContract = await getRentalityContract();

      if (!rentalityContract) {
        console.error("checkInTrip error: contract is null");
        return false;
      }
      const startFuelLevelInPermille = BigInt(Number(params[0]) * 1000);
      const startOdometr = BigInt(params[1]);

      let transaction = await rentalityContract.checkInByGuest(
        tripId,
        startFuelLevelInPermille,
        startOdometr
      );

      const result = await transaction.wait();
      return true;
    } catch (e) {
      console.error("checkInTrip error:" + e);
      return false;
    }
  };

  const checkOutTrip = async (tripId: bigint, params: string[]) => {
    try {
      const rentalityContract = await getRentalityContract();

      if (!rentalityContract) {
        console.error("checkOutTrip error: contract is null");
        return false;
      }

      const endFuelLevelInPermille = BigInt(Number(params[0]) * 1000);
      const endOdometr = BigInt(params[1]);

      let transaction = await rentalityContract.checkOutByGuest(
        tripId,
        endFuelLevelInPermille,
        endOdometr
      );

      const result = await transaction.wait();
      return true;
    } catch (e) {
      console.error("checkOutTrip error:" + e);
      return false;
    }
  };

  const convernFuelInLevel = (fuelLevelInGal: bigint, fuelTank: number) => {
    const levelInPercents =
      Math.ceil((8 * Number(fuelLevelInGal)) / fuelTank) * 0.125;
    return levelInPercents.toString();
  };

  const getAllowedActions = (
    tripStatus: TripStatus,
    trip: ContractTrip,
    tankSize: number
  ) => {
    const result: AllowedChangeTripAction[] = [];

    switch (tripStatus) {
      case TripStatus.Pending:
        result.push({
          text: "Reject",
          readonly: false,
          params: [],
          action: rejectRequest,
        });
        break;
      case TripStatus.Confirmed:
        result.push({
          text: "Reject",
          readonly: false,
          params: [],
          action: rejectRequest,
        });
        break;
      case TripStatus.CheckedInByHost:
        result.push({
          text: "Start",
          readonly: true,
          params: [
            {
              text: "Fuel level",
              value: convernFuelInLevel(trip.startFuelLevelInGal, tankSize),
              type: "fuel",
            },
            {
              text: "Odometr",
              value: trip.startOdometr.toString(),
              type: "text",
            },
          ],
          action: checkInTrip,
        });
        result.push({
          text: "Reject",
          readonly: false,
          params: [],
          action: rejectRequest,
        });
        break;
      case TripStatus.Started:
        result.push({
          text: "Finish",
          readonly: false,
          params: [
            { text: "Fuel level", value: "", type: "fuel" },
            { text: "Odometr", value: "", type: "text" },
          ],
          action: checkOutTrip,
        });
        break;
      case TripStatus.CheckedOutByGuest:
        break;
      case TripStatus.Finished:
        break;
      case TripStatus.Closed:
        break;
      case TripStatus.Rejected:
      default:
        break;
    }
    return result;
  };

  const getTrips = async (rentalityContract: IRentalityContract) => {
    try {
      if (rentalityContract == null) {
        console.error("getTrips error: contract is null");
        return;
      }
      const tripsBookedView: ContractTrip[] =
        await rentalityContract.getTripsAsGuest();

      const tripsBookedData =
        tripsBookedView.length === 0
          ? []
          : await Promise.all(
              tripsBookedView.map(async (i: ContractTrip, index) => {
                if (index === 0) {
                  validateContractTrip(i);
                }
                const tokenURI = await rentalityContract.getCarMetadataURI(
                  i.carId
                );
                const meta = await getMetaDataFromIpfs(tokenURI);
                const tripStatus = getTripStatusFromContract(Number(i.status));
                const tankSize = Number(
                  meta.attributes?.find(
                    (x: any) => x.trait_type === "Tank volume(gal)"
                  )?.value ?? "0"
                );

                let item: TripInfo = {
                  tripId: Number(i.tripId),
                  carId: Number(i.carId),
                  image: getIpfsURIfromPinata(meta.image),
                  brand:
                    meta.attributes?.find((x: any) => x.trait_type === "Brand")
                      ?.value ?? "",
                  model:
                    meta.attributes?.find((x: any) => x.trait_type === "Model")
                      ?.value ?? "",
                  year:
                    meta.attributes?.find(
                      (x: any) => x.trait_type === "Release year"
                    )?.value ?? "",
                  licensePlate:
                    meta.attributes?.find(
                      (x: any) => x.trait_type === "License plate"
                    )?.value ?? "",
                  tripStart: new Date(Number(i.startDateTime) * 1000),
                  tripEnd: new Date(Number(i.endDateTime) * 1000),
                  locationStart: i.startLocation,
                  locationEnd: i.endLocation,
                  status: tripStatus,
                  allowedActions: getAllowedActions(tripStatus, i, tankSize),
                  totalPrice: (
                    Number(i.paymentInfo.totalDayPriceInUsdCents) / 100
                  ).toString(),
                  tankVolumeInGal:tankSize,
                  startFuelLevelInGal: Number(i.startFuelLevelInGal),
                  endFuelLevelInGal: Number(i.endFuelLevelInGal),
                  fuelPricePerGal: Number(i.fuelPricePerGalInUsdCents) / 100,
                  milesIncludedPerDay: Number(i.milesIncludedPerDay),
                  startOdometr: Number(i.startOdometr),
                  endOdometr: Number(i.endOdometr),
                  overmilePrice: Number(i.pricePerDayInUsdCents) / Number(i.milesIncludedPerDay) / 100,
                };
                return item;
              })
            );

      return tripsBookedData;
    } catch (e) {
      console.error("getTrips error:" + e);
    }
  };

  const isTripBooked = (status: TripStatus) => {
    return status !== TripStatus.Rejected && status !== TripStatus.Closed;
  };

  useEffect(() => {
    if (!updateRequired) return;

    setUpdateRequired(false);
    setDataFetched(false);

    getRentalityContract()
      .then((contract) => {
        if (contract !== undefined) {
          return getTrips(contract);
        }
      })
      .then((data) => {
        setTripsBooked(
          data
            ?.filter((i) => {
              return isTripBooked(i.status);
            })
            .reverse() ?? []
        );
        setTripsHistory(
          data
            ?.filter((i) => {
              return !isTripBooked(i.status);
            })
            .reverse() ?? []
        );
        setDataFetched(true);
      })
      .catch(() => setDataFetched(true));
  }, [updateRequired]);

  return [dataFetched, tripsBooked, tripsHistory, updateData] as const;
};

export default useGuestTrips;
