import { TripInfo } from "@/model/TripInfo";
import { getIpfsURI, getMetaDataFromIpfs, parseMetaData } from "@/utils/ipfsUtils";
import { formatPhoneNumber, getDateFromBlockchainTimeWithTZ } from "@/utils/formInput";
import { isEmpty } from "@/utils/string";
import { UTC_TIME_ZONE_ID } from "@/utils/date";
import { ContractTripDTO, EngineType, TripStatus } from "@/model/blockchain/schemas";
import { calculateDays } from "@/utils/date";

export const mapTripDTOtoTripInfo = async (tripDTO: ContractTripDTO, isCarDetailsConfirmed?: boolean) => {
  const metaData = parseMetaData(await getMetaDataFromIpfs(tripDTO.metadataURI));
  const timeZoneId = !isEmpty(tripDTO.timeZoneId) ? tripDTO.timeZoneId : UTC_TIME_ZONE_ID;

  const startOdometr = Number(tripDTO.trip.startParamLevels[1]);
  const endOdometr = Number(tripDTO.trip.endParamLevels[1]);
  const milesIncludedPerDay = Number(tripDTO.trip.milesIncludedPerDay);

  const tripDays = calculateDays(
    getDateFromBlockchainTimeWithTZ(tripDTO.trip.startDateTime, timeZoneId),
    getDateFromBlockchainTimeWithTZ(tripDTO.trip.endDateTime, timeZoneId)
  );
  var overmileValue = endOdometr - startOdometr - milesIncludedPerDay * tripDays;
  overmileValue = overmileValue > 0 ? overmileValue : 0;
  const overmilePrice =
    Math.ceil(Number(tripDTO.trip.pricePerDayInUsdCents) / Number(tripDTO.trip.milesIncludedPerDay)) / 100;
  const tankVolumeInGal = Number(metaData.tankVolumeInGal);

  let item: TripInfo = {
    tripId: Number(tripDTO.trip.tripId),

    carId: Number(tripDTO.trip.carId),
    carVinNumber: metaData.vinNumber,
    image: getIpfsURI(metaData.mainImage),
    carDescription: metaData.description,
    carDoorsNumber: metaData.doorsNumber,
    carSeatsNumber: metaData.seatsNumber,
    carTransmission: metaData.transmission,
    carColor: metaData.color,
    brand: tripDTO.brand ?? metaData.brand,
    model: tripDTO.model ?? metaData.model,
    year: tripDTO.yearOfProduction?.toString() ?? metaData.yearOfProduction,
    licensePlate: metaData.licensePlate,
    licenseState: metaData.licenseState,
    tankVolumeInGal: tankVolumeInGal,
    engineType: tripDTO.trip.engineType,
    pricePer10PercentFuel:
      tripDTO.trip.engineType === EngineType.PETROL
        ? (Number(tripDTO.trip.fuelPrice) * tankVolumeInGal) / 1000
        : Number(tripDTO.trip.fuelPrice) / 1000,
    milesIncludedPerDay: milesIncludedPerDay,
    milesIncludedPerTrip: milesIncludedPerDay * tripDays,
    timeZoneId: timeZoneId,
    overmilePrice: overmilePrice,
    overmileValue: overmileValue,
    status:
      tripDTO.trip.status === TripStatus.Finished &&
      tripDTO.trip.tripFinishedBy.toLowerCase() === tripDTO.trip.host.toLowerCase()
        ? TripStatus.CompletedWithoutGuestComfirmation
        : tripDTO.trip.status,
    tripStart: getDateFromBlockchainTimeWithTZ(tripDTO.trip.startDateTime, timeZoneId),
    tripEnd: getDateFromBlockchainTimeWithTZ(tripDTO.trip.endDateTime, timeZoneId),
    tripDays: tripDays,
    locationStart: tripDTO.pickUpLocation.userAddress,
    locationEnd: tripDTO.returnLocation.userAddress,
    allowedActions: [],
    startFuelLevelInPercents: Number(tripDTO.trip.startParamLevels[0]),
    endFuelLevelInPercents: Number(tripDTO.trip.endParamLevels[0]),
    startOdometr: startOdometr,
    endOdometr: endOdometr,

    rejectedBy: tripDTO.trip.rejectedBy,
    tripStartedBy: tripDTO.trip.tripStartedBy,
    tripFinishedBy: tripDTO.trip.tripFinishedBy,
    rejectedDate:
      tripDTO.trip.rejectedDateTime > 0
        ? getDateFromBlockchainTimeWithTZ(tripDTO.trip.rejectedDateTime, timeZoneId)
        : undefined,
    isTripRejected: tripDTO.trip.rejectedDateTime > 0 && tripDTO.trip.approvedDateTime === BigInt(0),
    isTripCanceled: tripDTO.trip.rejectedDateTime > 0 && tripDTO.trip.approvedDateTime > 0,
    createdDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.createdDateTime, timeZoneId),
    approvedDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.approvedDateTime, timeZoneId),
    checkedInByHostDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.checkedInByHostDateTime, timeZoneId),
    checkedInByGuestDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.checkedInByGuestDateTime, timeZoneId),
    checkedOutByGuestDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.checkedOutByGuestDateTime, timeZoneId),
    checkedOutByHostDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.checkedOutByHostDateTime, timeZoneId),
    finishedDateTime: getDateFromBlockchainTimeWithTZ(tripDTO.trip.finishDateTime, timeZoneId),

    host: {
      walletAddress: tripDTO.trip.host,
      name: tripDTO.trip.hostName,
      phoneNumber: formatPhoneNumber(tripDTO.hostPhoneNumber),
      photoUrl: tripDTO.hostPhotoUrl,
      drivingLicenseNumber: tripDTO.hostDrivingLicenseNumber,
      drivingLicenseExpirationDate: getDateFromBlockchainTimeWithTZ(
        tripDTO.hostDrivingLicenseExpirationDate,
        UTC_TIME_ZONE_ID
      ),
    },

    guest: {
      walletAddress: tripDTO.trip.guest,
      name: tripDTO.trip.guestName,
      phoneNumber: formatPhoneNumber(tripDTO.guestPhoneNumber),
      photoUrl: tripDTO.guestPhotoUrl,
      drivingLicenseNumber: tripDTO.guestDrivingLicenseNumber,
      drivingLicenseExpirationDate: getDateFromBlockchainTimeWithTZ(
        tripDTO.guestDrivingLicenseExpirationDate,
        UTC_TIME_ZONE_ID
      ),
    },
    guestInsuranceCompanyName: tripDTO.trip.guestInsuranceCompanyName,
    guestInsurancePolicyNumber: tripDTO.trip.guestInsurancePolicyNumber,

    pricePerDayInUsd: Number(tripDTO.trip.pricePerDayInUsdCents) / 100.0,
    totalDayPriceInUsd: Number(tripDTO.trip.paymentInfo.totalDayPriceInUsdCents) / 100.0,
    totalPriceWithDiscountInUsd: Number(tripDTO.trip.paymentInfo.priceWithDiscount) / 100.0,
    pickUpDeliveryFeeInUsd: Number(tripDTO.trip.paymentInfo.pickUpFee) / 100.0,
    dropOffDeliveryFeeInUsd: Number(tripDTO.trip.paymentInfo.dropOfFee) / 100.0,
    salesTaxInUsd: Number(tripDTO.trip.paymentInfo.salesTax) / 100.0,
    governmentTaxInUsd: Number(tripDTO.trip.paymentInfo.governmentTax) / 100.0,
    depositInUsd: Number(tripDTO.trip.paymentInfo.depositInUsdCents) / 100.0,
    totalPriceInUsd:
      Number(
        tripDTO.trip.paymentInfo.priceWithDiscount +
          tripDTO.trip.paymentInfo.governmentTax +
          tripDTO.trip.paymentInfo.salesTax +
          tripDTO.trip.paymentInfo.pickUpFee +
          tripDTO.trip.paymentInfo.dropOfFee
      ) / 100.0,

    resolveAmountInUsd: Number(tripDTO.trip.paymentInfo.resolveAmountInUsdCents) / 100.0,
    resolveFuelAmountInUsd: Number(tripDTO.trip.paymentInfo.resolveFuelAmountInUsdCents) / 100.0,
    resolveMilesAmountInUsd: Number(tripDTO.trip.paymentInfo.resolveMilesAmountInUsdCents) / 100.0,
    depositReturnedInUsd:
      tripDTO.trip.status === TripStatus.Closed || tripDTO.trip.status === TripStatus.Rejected
        ? Number(tripDTO.trip.paymentInfo.depositInUsdCents - tripDTO.trip.paymentInfo.resolveAmountInUsdCents) / 100.0
        : 0,

    currencyRate:
      Number(tripDTO.trip.paymentInfo.currencyRate) / 10 ** Number(tripDTO.trip.paymentInfo.currencyDecimals),
    isCarDetailsConfirmed: isCarDetailsConfirmed ?? false,
  };
  return item;
};
