import { ContractTransactionResponse} from "ethers";
import { ContractCarInfo } from "./ContractCarInfo";
import { ContractCreateTripRequest } from "./ContractCreateTripRequest";
import { ContractTrip } from "./ContractTrip";

export interface IRentalityContract {

  getAddress(): Promise<string>;
  
  ///admin functions
  owner(): Promise<string>;
  getCarServiceAddress(): Promise<string>;
  updateCarService(contractAddress: string): Promise<ContractTransactionResponse>;
  getCurrencyConverterServiceAddress(): Promise<string>;
  updateCurrencyConverterService(contractAddress: string): Promise<ContractTransactionResponse>;
  getTripServiceAddress(): Promise<string>;
  updateTripService(contractAddress: string): Promise<ContractTransactionResponse>;
  getUserServiceAddress(): Promise<string>;
  updateUserService(contractAddress: string): Promise<ContractTransactionResponse>;
  withdrawFromPlatform(amount: bigint): Promise<ContractTransactionResponse>;
  withdrawAllFromPlatform(): Promise<ContractTransactionResponse>;
  getPlatformFeeInPPM(): Promise<bigint>;
  setPlatformFeeInPPM(valueInPPM:bigint): Promise<ContractTransactionResponse>;  
  getDepositePriceInUsdCents(): Promise<bigint>;
  setDepositePriceInUsdCents(valueInUsdCents:bigint): Promise<ContractTransactionResponse>;
  getFuelPricePerGalInUsdCents(): Promise<bigint>;
  setFuelPricePerGalInUsdCents(valueInUsdCents:bigint): Promise<ContractTransactionResponse>;

  ///host functions
  addCar(
    tokenUri: string,
    carVinNumber: string,
    pricePerDayInUsdCents: bigint,
    tankVolumeInGal: bigint,
    distanceIncludedInMi: bigint
  ): Promise<ContractTransactionResponse>;
  getCarMetadataURI(carId: bigint): Promise<string>;
  getMyCars(): Promise<ContractCarInfo[]>;
  getTripsAsHost(): Promise<ContractTrip[]>;
  approveTripRequest(tripId: bigint): Promise<ContractTransactionResponse>;
  rejectTripRequest(tripId: bigint): Promise<ContractTransactionResponse>;
  checkInByHost(tripId: bigint,startFuelLevel: bigint,startOdometr: bigint): Promise<ContractTransactionResponse>;
  checkOutByHost(tripId: bigint,endFuelLevel: bigint,endOdometr: bigint): Promise<ContractTransactionResponse>;
  finishTrip(tripId: bigint): Promise<ContractTransactionResponse>;

  ///guest functions
  getAvailableCars(): ContractCarInfo[];
  createTripRequest(request: ContractCreateTripRequest, value: object): Promise<ContractTransactionResponse>;
  getTripsAsGuest(): Promise<ContractTrip[]>;
  getCarsRentedByMe(): Promise<ContractCarInfo[]>;
  checkInByGuest(tripId: bigint,startFuelLevel: bigint,startOdometr: bigint): Promise<ContractTransactionResponse>;
  checkOutByGuest(tripId: bigint,endFuelLevel: bigint,endOdometr: bigint): Promise<ContractTransactionResponse>;

  getTrip(tripId: bigint): Promise<ContractTrip>;
};
