import { createContext, useContext, useEffect, useState } from "react";
import { useRentality } from "./rentalityContext";
import { ContractKYCInfo } from "@/model/blockchain/IRentalityContract";
import { getIpfsURIfromPinata } from "@/utils/ipfsUtils";

export type UserInfo = {
  address: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  drivingLicense: string;
};

const EmptyUserInfo: UserInfo = {
  address: "0x",
  firstName: "",
  lastName: "",
  profilePhotoUrl: "",
  drivingLicense: "",
};

export type UserInfoUpdate = {
  updateUserInfo: (c: UserInfo) => void;
};

export type UserProfileContext = {
  userProfile: UserInfo | undefined;
  setUserProfile: (value: UserInfo) => void;
};

const UserInfoContext = createContext<UserInfo>(EmptyUserInfo);
const UserInfoUpdateContext = createContext((value: UserInfo) => {});

export function useUserInfo() {
  return useContext(UserInfoContext);
}

export function useUserInfoUpdate() {
  return useContext(UserInfoUpdateContext);
}

export const UserInfoProvider = ({ children }: { children?: React.ReactNode }) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>(EmptyUserInfo);
  const rentalityInfo = useRentality();

  useEffect(() => {
    const loadUserInfo = async () => {
      if (rentalityInfo === null) {
        return;
      }
      try {
        const myKYCInfo: ContractKYCInfo = await rentalityInfo.rentalityContract.getMyKYCInfo();

        if (myKYCInfo == null) return;

        setCurrentUserInfo({
          address: rentalityInfo.walletAddress,
          firstName: myKYCInfo.name,
          lastName: myKYCInfo.surname,
          profilePhotoUrl: getIpfsURIfromPinata(myKYCInfo.profilePhoto),
          drivingLicense: myKYCInfo.licenseNumber,
        });
      } catch (e) {
        console.error("UserInfoProvider error:" + e);
      }
    };
    loadUserInfo();
  }, [rentalityInfo]);

  return (
    <UserInfoContext.Provider value={currentUserInfo}>
      <UserInfoUpdateContext.Provider value={setCurrentUserInfo}>{children}</UserInfoUpdateContext.Provider>
    </UserInfoContext.Provider>
  );
};
