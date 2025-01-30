import {
  ContractAdminKYCInfoDTO,
  ContractAllCarsDTO,
  ContractAllRefferalInfoDTO,
  ContractAllTripsDTO,
  ContractTripFilter,
  RefferalAccrualType,
  RefferalProgram,
  Role,
  Tear,
} from "@/model/blockchain/schemas";
import { ContractTransactionResponse } from "ethers";
import { IEthersContract } from "./IEtherContract";
import { ContractResultWrapper } from "../types";

export interface IRentalityAdminGateway extends ContractResultWrapper<IRentalityAdminGatewayContract> {}

export interface IRentalityAdminGatewayContract extends IEthersContract {
  owner(): Promise<string>;
  getCarServiceAddress(): Promise<string>;
  updateCarService(contractAddress: string): Promise<ContractTransactionResponse>;
  getPaymentService(): Promise<string>;
  updatePaymentService(contractAddress: string): Promise<ContractTransactionResponse>;
  getClaimServiceAddress(): Promise<string>;
  updateClaimService(contractAddress: string): Promise<ContractTransactionResponse>;
  getRentalityPlatformAddress(): Promise<string>;
  updateRentalityPlatform(contractAddress: string): Promise<ContractTransactionResponse>;
  getCurrencyConverterServiceAddress(): Promise<string>;
  updateCurrencyConverterService(contractAddress: string): Promise<ContractTransactionResponse>;
  getTripServiceAddress(): Promise<string>;
  updateTripService(contractAddress: string): Promise<ContractTransactionResponse>;
  getUserServiceAddress(): Promise<string>;
  updateUserService(contractAddress: string): Promise<ContractTransactionResponse>;
  withdrawFromPlatform(amount: bigint, currencyType: string): Promise<ContractTransactionResponse>;
  withdrawAllFromPlatform(currencyType: string): Promise<ContractTransactionResponse>;
  setPlatformFeeInPPM(valueInPPM: bigint): Promise<ContractTransactionResponse>;
  updateGeoServiceAddress(newGeoServiceAddress: string): Promise<ContractTransactionResponse>;
  setClaimsWaitingTime(timeInSec: bigint): Promise<ContractTransactionResponse>;
  getClaimWaitingTime(): Promise<bigint>;
  getPlatformFeeInPPM(): Promise<bigint>;
  setCivicData(_civicVerifier: string, _civicGatekeeperNetwork: bigint): Promise<ContractTransactionResponse>;
  setNewTCMessage(message: string): Promise<ContractTransactionResponse>;

  manageRole(role: Role, user: string, grant: boolean): Promise<ContractTransactionResponse>;
  getAllTrips(filter: ContractTripFilter, page: bigint, itemsPerPage: bigint): Promise<ContractAllTripsDTO>;
  getAllCars(page: bigint, itemsPerPage: bigint): Promise<ContractAllCarsDTO>;
  payToHost(tripId: bigint): Promise<ContractTransactionResponse>;
  refundToGuest(tripId: bigint): Promise<ContractTransactionResponse>;

  getKycCommission(): Promise<bigint>;
  setKycCommission(valueInUsdCents: bigint): Promise<ContractTransactionResponse>;

  manageRefferalBonusAccrual(
    accrualType: RefferalAccrualType,
    program: RefferalProgram,
    points: number,
    pointsWithReffHash: number
  ): Promise<ContractTransactionResponse>;

  manageRefferalDiscount(
    program: RefferalProgram,
    tear: Tear,
    points: number,
    percents: number
  ): Promise<ContractTransactionResponse>;

  manageTearInfo(tear: Tear, from: number, to: number): Promise<ContractTransactionResponse>;

  getRefferalPointsInfo(): Promise<ContractAllRefferalInfoDTO>;
  getPlatformUsersInfo(): Promise<ContractAdminKYCInfoDTO[]>;
}
