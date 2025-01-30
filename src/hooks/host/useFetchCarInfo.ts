import { Signer } from "ethers";
import { useEffect, useState } from "react";
import { HostCarInfo, emptyHostCarInfo } from "@/model/HostCarInfo";
import { IRentalityContracts, useRentality } from "@/contexts/rentalityContext";
import { useEthereum } from "@/contexts/web3/ethereumContext";
import { ContractCarDetails, ContractCarInfoWithInsurance } from "@/model/blockchain/schemas";
import { mapContractCarToCarDetails } from "@/model/mappers/contractCarToCarDetails";

const useFetchCarInfo = (carId: number) => {
  const ethereumInfo = useEthereum();
  const { rentalityContracts } = useRentality();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hostCarInfo, setHostCarInfo] = useState<HostCarInfo>(emptyHostCarInfo);

  useEffect(() => {
    const getCarInfo = async (rentalityContracts: IRentalityContracts, signer: Signer) => {
      if (!rentalityContracts) {
        console.error("getCarInfo error: contract is null");
        return;
      }

      try {
        const carInfo: ContractCarInfoWithInsurance = await rentalityContracts.gateway.getCarInfoById(BigInt(carId));
        const carInfoDetails: ContractCarDetails = await rentalityContracts.gateway.getCarDetails(BigInt(carId));

        const signerAddress = await signer.getAddress();
        if (carInfoDetails.host !== signerAddress) {
          return emptyHostCarInfo;
        }

        return mapContractCarToCarDetails(
          carInfo.carInfo,
          carInfo.insuranceInfo,
          carInfoDetails,
          carInfo.carMetadataURI
        );
      } catch (e) {
        console.error("getCarInfo error:" + e);
      }
    };

    if (isNaN(carId) || carId == -1) return;
    if (!ethereumInfo) return;
    if (!rentalityContracts) return;

    getCarInfo(rentalityContracts, ethereumInfo.signer)
      .then((data) => {
        setHostCarInfo(data ?? emptyHostCarInfo);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [carId, rentalityContracts, ethereumInfo]);

  return { isLoading, hostCarInfo } as const;
};

export default useFetchCarInfo;
