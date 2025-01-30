import { createContext, useContext, useEffect, useState } from "react";
import { useRentality } from "./rentalityContext";
import { getIpfsURI } from "@/utils/ipfsUtils";
import { useEthereum } from "./web3/ethereumContext";
import { tryGetEnsName } from "@/utils/ether";

export type UserInfo = {
  address: string;
  ensName: string | null;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  drivingLicense: string;
};

const UserInfoContext = createContext<UserInfo | undefined>(undefined);

export const UserInfoProvider = ({ children }: { children?: React.ReactNode }) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | undefined>(undefined);
  const { rentalityContracts } = useRentality();
  const ethereumInfo = useEthereum();

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!rentalityContracts) return;
      if (!ethereumInfo) return;

      const result = await rentalityContracts.gatewayProxy.getMyFullKYCInfo();
      if (!result.ok) return;

      setCurrentUserInfo({
        address: ethereumInfo.walletAddress,
        ensName: await tryGetEnsName(ethereumInfo.provider, ethereumInfo.walletAddress),
        firstName: result.value.kyc.name,
        lastName: result.value.kyc.name,
        profilePhotoUrl: getIpfsURI(result.value.kyc.profilePhoto),
        drivingLicense: result.value.kyc.licenseNumber,
      });
    };
    loadUserInfo();
  }, [rentalityContracts, ethereumInfo]);

  return <UserInfoContext.Provider value={currentUserInfo}>{children}</UserInfoContext.Provider>;
};

export function useUserInfo() {
  const context = useContext(UserInfoContext);
  // if (!context) {
  //   throw new Error("useUserInfo must be used within a UserInfoProvider");
  // }
  return context;
}
