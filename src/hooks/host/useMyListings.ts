import { useEffect, useState } from "react";
import { BaseCarInfo } from "@/model/BaseCarInfo";
import { getIpfsURI, getMetaDataFromIpfs, parseMetaData } from "@/utils/ipfsUtils";
import { IRentalityContracts, useRentality } from "@/contexts/rentalityContext";
import { validateContractCarInfoDTO } from "@/model/blockchain/schemas_utils";
import { ContractCarInfoDTO } from "@/model/blockchain/schemas";

const useMyListings = () => {
  const { rentalityContracts } = useRentality();
  const [isLoadingMyListings, setIsLoadingMyListings] = useState<boolean>(true);
  const [myListings, setMyListings] = useState<BaseCarInfo[]>([]);

  const getMyListings = async (rentalityContracts: IRentalityContracts) => {
    try {
      if (!rentalityContracts) {
        console.error("getMyListings error: contract is null");
        return;
      }
      const myListingsView: ContractCarInfoDTO[] = await rentalityContracts.gateway.getMyCars();

      const myListingsData =
        myListingsView.length === 0
          ? []
          : await Promise.all(
              myListingsView.map(async (i: ContractCarInfoDTO, index) => {
                if (index === 0) {
                  validateContractCarInfoDTO(i);
                }
                const metaData = parseMetaData(await getMetaDataFromIpfs(i.metadataURI));

                const pricePerDay = Number(i.carInfo.pricePerDayInUsdCents) / 100;
                const securityDeposit = Number(i.carInfo.securityDepositPerTripInUsdCents) / 100;
                const milesIncludedPerDay = Number(i.carInfo.milesIncludedPerDay);

                let item: BaseCarInfo = {
                  carId: Number(i.carInfo.carId),
                  ownerAddress: i.carInfo.createdBy.toString(),
                  image: getIpfsURI(metaData.mainImage),
                  brand: i.carInfo.brand,
                  model: i.carInfo.model,
                  year: i.carInfo.yearOfProduction.toString(),
                  licensePlate: metaData.licensePlate,
                  pricePerDay: pricePerDay,
                  securityDeposit: securityDeposit,
                  milesIncludedPerDay: milesIncludedPerDay,
                  currentlyListed: i.carInfo.currentlyListed,
                  isEditable: i.isEditable,
                };
                return item;
              })
            );

      return myListingsData;
    } catch (e) {
      console.error("getMyListings error:" + e);
    }
  };

  useEffect(() => {
    if (!rentalityContracts) return;

    getMyListings(rentalityContracts)
      .then((data) => {
        setMyListings(data ?? []);
        setIsLoadingMyListings(false);
      })
      .catch(() => setIsLoadingMyListings(false));
  }, [rentalityContracts]);

  return [isLoadingMyListings, myListings] as const;
};

export default useMyListings;
