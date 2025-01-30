import { useEffect, useMemo, useState } from "react";
import { IRentalityContracts, useRentality } from "@/contexts/rentalityContext";
import { formatPhoneNumber, getDateFromBlockchainTime, getDateFromBlockchainTimeWithTZ } from "@/utils/formInput";
import { getIpfsURI } from "@/utils/ipfsUtils";
import { dateRangeFormatShortMonthDateYear } from "@/utils/datetimeFormatters";
import { Claim, getClaimTypeTextFromClaimType, getClaimStatusTextFromStatus } from "@/model/Claim";
import { CreateClaimRequest, TripInfoForClaimCreation } from "@/model/CreateClaimRequest";
import {
  ContractCreateClaimRequest,
  ContractFullClaimInfo,
  ContractTripDTO,
  TripStatus,
} from "@/model/blockchain/schemas";
import { validateContractFullClaimInfo, validateContractTripDTO } from "@/model/blockchain/schemas_utils";
import { uploadFileToIPFS } from "@/utils/pinata";
import { SMARTCONTRACT_VERSION } from "@/abis";
import { EthereumInfo, useEthereum } from "@/contexts/web3/ethereumContext";
import { Err, Ok, Result, TransactionErrorCode } from "@/model/utils/result";
import { isUserHasEnoughFunds } from "@/utils/wallet";
import { formatEther } from "viem";
import { FileToUpload } from "@/model/FileToUpload";
import { useTranslation } from "react-i18next";

const useHostClaims = () => {
  const { rentalityContracts } = useRentality();
  const ethereumInfo = useEthereum();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updateRequired, setUpdateRequired] = useState<boolean>(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const { t } = useTranslation();
  const [tripInfos, setTripInfos] = useState<TripInfoForClaimCreation[]>([
    { tripId: 0, guestAddress: "", tripDescription: t("common.info.loading"), tripStart: new Date() },
  ]);

  function updateData() {
    setUpdateRequired(true);
  }

  async function createClaim(createClaimRequest: CreateClaimRequest): Promise<Result<boolean, TransactionErrorCode>> {
    if (!ethereumInfo) {
      console.error("createClaim error: ethereumInfo is null");
      return Err("ERROR");
    }

    if (!rentalityContracts) {
      console.error("createClaim error: rentalityContract is null");
      return Err("ERROR");
    }

    if (!(await isUserHasEnoughFunds(ethereumInfo.signer))) {
      console.error("createClaim error: user don't have enough funds");
      return Err("NOT_ENOUGH_FUNDS");
    }

    try {
      const savedFiles = await saveClaimFiles(createClaimRequest.localFileUrls, ethereumInfo);

      const claimRequest: ContractCreateClaimRequest = {
        tripId: BigInt(createClaimRequest.tripId),
        claimType: createClaimRequest.claimType,
        description: createClaimRequest.description,
        amountInUsdCents: BigInt(createClaimRequest.amountInUsdCents),
        photosUrl: savedFiles.join("|"),
      };

      const transaction = await rentalityContracts.gateway.createClaim(claimRequest);
      await transaction.wait();

      // const message = encodeClaimChatMessage(createClaimRequest);
      // chatContextInfo.sendMessage(
      //   createClaimRequest.guestAddress,
      //   createClaimRequest.tripId,
      //   message,
      //   "SYSTEM|CLAIM_REQUEST"
      // );
      return Ok(true);
    } catch (e) {
      console.error("createClaim error:" + e);
      return Err("ERROR");
    }
  }

  async function payClaim(claimId: number): Promise<Result<boolean, TransactionErrorCode>> {
    if (!ethereumInfo) {
      console.error("payClaim error: ethereumInfo is null");
      return Err("ERROR");
    }

    if (!rentalityContracts) {
      console.error("payClaim error: rentalityContract is null");
      return Err("ERROR");
    }

    try {
      const claimAmountInWeth = await rentalityContracts.gateway.calculateClaimValue(BigInt(claimId));
      const claimAmountInEth = Number(formatEther(claimAmountInWeth));

      if (!(await isUserHasEnoughFunds(ethereumInfo.signer, claimAmountInEth))) {
        console.error("payClaim error: user don't have enough funds");
        return Err("NOT_ENOUGH_FUNDS");
      }

      const transaction = await rentalityContracts.gateway.payClaim(BigInt(claimId), {
        value: claimAmountInWeth,
      });

      await transaction.wait();
      return Ok(true);
    } catch (e) {
      console.error("payClaim error:" + e);
      return Err("ERROR");
    }
  }

  async function cancelClaim(claimId: number): Promise<Result<boolean, TransactionErrorCode>> {
    if (!ethereumInfo) {
      console.error("cancelClaim error: ethereumInfo is null");
      return Err("ERROR");
    }

    if (!rentalityContracts) {
      console.error("cancelClaim error: rentalityContract is null");
      return Err("ERROR");
    }

    if (!(await isUserHasEnoughFunds(ethereumInfo.signer))) {
      console.error("cancelClaim error: user don't have enough funds");
      return Err("NOT_ENOUGH_FUNDS");
    }

    try {
      const transaction = await rentalityContracts.gateway.rejectClaim(BigInt(claimId));
      await transaction.wait();
      return Ok(true);
    } catch (e) {
      console.error("cancelClaim error:" + e);
      return Err("ERROR");
    }
  }

  useEffect(() => {
    const getClaims = async (rentalityContracts: IRentalityContracts) => {
      try {
        if (!rentalityContracts) {
          console.error("getClaims error: contract is null");
          return;
        }
        const claimsView: ContractFullClaimInfo[] = await rentalityContracts.gateway.getMyClaimsAs(true);

        const claimsData =
          claimsView.length === 0
            ? []
            : await Promise.all(
                claimsView.map(async (i: ContractFullClaimInfo, index) => {
                  if (index === 0) {
                    validateContractFullClaimInfo(i);
                  }

                  let item: Claim = {
                    claimId: Number(i.claim.claimId),
                    tripId: Number(i.claim.tripId),
                    deadlineDate: getDateFromBlockchainTime(i.claim.deadlineDateInSec),
                    claimType: i.claim.claimType,
                    claimTypeText: getClaimTypeTextFromClaimType(i.claim.claimType),
                    status: i.claim.status,
                    statusText: getClaimStatusTextFromStatus(i.claim.status),
                    carInfo: `${i.carInfo.brand} ${i.carInfo.model} ${i.carInfo.yearOfProduction}`,
                    description: i.claim.description,
                    amountInUsdCents: Number(i.claim.amountInUsdCents),
                    amountInEth: i.amountInEth,
                    payDateInSec: Number(i.claim.payDateInSec),
                    rejectedBy: i.claim.rejectedBy,
                    rejectedDateInSec: Number(i.claim.rejectedDateInSec),
                    hostPhoneNumber: formatPhoneNumber(i.hostPhoneNumber),
                    guestPhoneNumber: formatPhoneNumber(i.guestPhoneNumber),
                    isIncomingClaim: !i.claim.isHostClaims,
                    fileUrls: i.claim.photosUrl.split("|").map((url) => getIpfsURI(url)),
                    timeZoneId: i.timeZoneId,
                  };
                  return item;
                })
              );

        const hostTripsView: ContractTripDTO[] = (await rentalityContracts.gateway.getTripsAs(true)).filter(
          (i) => i.trip.status !== TripStatus.Pending && i.trip.status !== TripStatus.Rejected
        );

        const hostTripsData =
          hostTripsView.length === 0
            ? []
            : await Promise.all(
                hostTripsView.map(async (i: ContractTripDTO, index) => {
                  if (index === 0) {
                    validateContractTripDTO(i);
                  }

                  const tripStart = getDateFromBlockchainTimeWithTZ(i.trip.startDateTime, i.timeZoneId);
                  const tripEnd = getDateFromBlockchainTimeWithTZ(i.trip.endDateTime, i.timeZoneId);

                  let item: TripInfoForClaimCreation = {
                    tripId: Number(i.trip.tripId),
                    guestAddress: i.trip.guest,
                    tripDescription: `${i.brand} ${i.model} ${i.yearOfProduction} ${i.trip.guestName} trip ${dateRangeFormatShortMonthDateYear(
                      tripStart,
                      tripEnd,
                      i.timeZoneId
                    )}`,
                    tripStart: tripStart,
                  };
                  return item;
                })
              );

        return { hostTripsData, claimsData };
      } catch (e) {
        console.error("getClaims error:" + e);
      }
    };

    if (!updateRequired) return;
    if (!rentalityContracts) return;

    setUpdateRequired(false);
    setIsLoading(true);

    getClaims(rentalityContracts)
      .then((data) => {
        setClaims(data?.claimsData ?? []);
        setTripInfos(data?.hostTripsData ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [updateRequired, rentalityContracts]);

  const sortedClaims = useMemo(() => {
    return [...claims].sort((a, b) => {
      return b.deadlineDate.getTime() - a.deadlineDate.getTime();
    });
  }, [claims]);

  const sortedTripInfos = useMemo(() => {
    return [...tripInfos].sort((a, b) => {
      return b.tripStart.getTime() - a.tripStart.getTime();
    });
  }, [tripInfos]);

  return {
    isLoading,
    claims: sortedClaims,
    tripInfos: sortedTripInfos,
    createClaim,
    payClaim,
    cancelClaim,
    updateData,
  } as const;
};

async function saveClaimFiles(filesToSave: FileToUpload[], ethereumInfo: EthereumInfo): Promise<string[]> {
  filesToSave = filesToSave.filter((i) => i);

  const savedFiles: string[] = [];

  if (filesToSave.length > 0) {
    for (const file of filesToSave) {
      const response = await uploadFileToIPFS(file.file, "RentalityClaimFile", {
        createdAt: new Date().toISOString(),
        createdBy: ethereumInfo?.walletAddress ?? "",
        version: SMARTCONTRACT_VERSION,
        chainId: ethereumInfo?.chainId ?? 0,
      });

      if (!response.success || !response.pinataURL) {
        throw new Error("Uploaded image to Pinata error");
      }
      savedFiles.push(response.pinataURL);
    }
  }
  return savedFiles;
}

export default useHostClaims;
