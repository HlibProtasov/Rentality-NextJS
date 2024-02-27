import { BrowserProvider, ethers, formatEther } from "ethers";
import { useEffect, useState } from "react";
import { IRentalityAdminGateway, IRentalityContract } from "@/model/blockchain/IRentalityContract";
import { useRentality } from "@/contexts/rentalityContext";
import { getEtherContractWithSigner } from "@/abis";
import { useEthereum } from "@/contexts/web3/ethereumContext";

export type AdminContractInfo = {
  contractAddress: string;
  contractOwnerAddress: string;
  contractBalance: bigint;
  contractBalanceString: string;
  rentalityCommission: number;
  currencyConverterContractAddress: string;
  userServiceContractAddress: string;
  tripServiceContractAddress: string;
  carServiceContractAddress: string;
  platformContractAddress: string;
};

const emptyAdminContractInfo = {
  contractAddress: "",
  contractOwnerAddress: "",
  contractBalance: BigInt(0),
  contractBalanceString: "0",
  rentalityCommission: 0,
  currencyConverterContractAddress: "",
  userServiceContractAddress: "",
  tripServiceContractAddress: "",
  carServiceContractAddress: "",
  platformContractAddress: "",
};

const useContractInfo = () => {
  const ethereumInfo = useEthereum();
  const rentalityContract = useRentality();
  const [adminContractInfo, setAdminContractInfo] = useState<AdminContractInfo>(emptyAdminContractInfo);
  const [dataUpdated, setDataUpdated] = useState(false);

  const getAdminContractInfo = async (contract: IRentalityContract, provider: BrowserProvider) => {
    const contractAddress = await contract.address;
    const ownerAddress = await contract.owner();
    const platformContractAddress = await contract.getRentalityPlatformAddress();
    const balance = (await provider.getBalance(platformContractAddress)) ?? 0;
    const rentalityCommission = Number(await contract.getPlatformFeeInPPM()) / 10_000.0 ?? 0;
    const currencyConverterContractAddress = await contract.getCurrencyConverterServiceAddress();
    const userServiceContractAddress = await contract.getUserServiceAddress();
    const tripServiceContractAddress = await contract.getTripServiceAddress();
    const carServiceContractAddress = await contract.getCarServiceAddress();

    const result: AdminContractInfo = {
      contractAddress: contractAddress,
      contractOwnerAddress: ownerAddress,
      contractBalance: balance,
      contractBalanceString: formatEther(balance),
      rentalityCommission: rentalityCommission,
      currencyConverterContractAddress: currencyConverterContractAddress,
      userServiceContractAddress: userServiceContractAddress,
      tripServiceContractAddress: tripServiceContractAddress,
      carServiceContractAddress: carServiceContractAddress,
      platformContractAddress: platformContractAddress,
    };
    return result;
  };

  const withdrawFromPlatform = async (value: bigint) => {
    if (!ethereumInfo) {
      console.error("updateUserService error: ethereumInfo is null");
      return false;
    }

    const rentalityAdminGateway = (await getEtherContractWithSigner(
      "admin",
      ethereumInfo.signer
    )) as unknown as IRentalityAdminGateway;

    if (!rentalityAdminGateway) {
      console.error("withdrawFromPlatform error: rentalityAdminGateway is null");
      return false;
    }

    try {
      let transaction = await rentalityAdminGateway.withdrawFromPlatform(value);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("withdrawFromPlatform error" + e);
      return false;
    }
  };

  const setPlatformFeeInPPM = async (value: bigint) => {
    if (!ethereumInfo) {
      console.error("updateUserService error: ethereumInfo is null");
      return false;
    }

    const rentalityAdminGateway = (await getEtherContractWithSigner(
      "admin",
      ethereumInfo.signer
    )) as unknown as IRentalityAdminGateway;

    if (!rentalityAdminGateway) {
      console.error("setPlatformFeeInPPM error: rentalityAdminGateway is null");
      return false;
    }

    try {
      let transaction = await rentalityAdminGateway.setPlatformFeeInPPM(value);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("setPlatformFeeInPPM error" + e);
      return false;
    }
  };

  const updateUserService = async (address: string) => {
    if (!rentalityContract) {
      console.error("updateUserService error: rentalityContract is null");
      return false;
    }

    try {
      let transaction = await rentalityContract.updateUserService(address);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("updateUserService error" + e);
      return false;
    }
  };

  const updateCarService = async (address: string) => {
    if (!rentalityContract) {
      console.error("updateCarService error: rentalityContract is null");
      return false;
    }

    try {
      let transaction = await rentalityContract.updateCarService(address);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("updateCarService error" + e);
      return false;
    }
  };

  const updateTripService = async (address: string) => {
    if (!rentalityContract) {
      console.error("updateTripService error: rentalityContract is null");
      return false;
    }

    try {
      let transaction = await rentalityContract.updateTripService(address);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("updateTripService error" + e);
      return false;
    }
  };

  const updateCurrencyConverterService = async (address: string) => {
    if (!rentalityContract) {
      console.error("updateCurrencyConverterService error: rentalityContract is null");
      return false;
    }

    try {
      let transaction = await rentalityContract.updateCurrencyConverterService(address);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("updateCurrencyConverterService error" + e);
      return false;
    }
  };

  const updatePlatformService = async (address: string) => {
    if (!rentalityContract) {
      console.error("updatePlatformService error: rentalityContract is null");
      return false;
    }

    try {
      let transaction = await rentalityContract.updateRentalityPlatform(address);
      const result = await transaction.wait();
      setDataUpdated(false);
      return true;
    } catch (e) {
      console.error("updatePlatformService error" + e);
      return false;
    }
  };

  useEffect(() => {
    if (dataUpdated) return;
    if (!rentalityContract) return;
    if (!ethereumInfo) return;

    getAdminContractInfo(rentalityContract, ethereumInfo.provider).then((data) => {
      if (data != null) {
        setAdminContractInfo(data);
        setDataUpdated(true);
      }
    });
  }, [dataUpdated, rentalityContract, ethereumInfo]);

  return [
    adminContractInfo,
    withdrawFromPlatform,
    setPlatformFeeInPPM,
    updateUserService,
    updateCarService,
    updateTripService,
    updateCurrencyConverterService,
    updatePlatformService,
  ] as const;
};

export default useContractInfo;
