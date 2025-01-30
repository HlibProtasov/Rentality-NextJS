import { useRentality } from "@/contexts/rentalityContext";
import { InsuranceType } from "@/model/blockchain/schemas";
import { validateContractInsuranceDTO } from "@/model/blockchain/schemas_utils";
import { Err, Ok, Result } from "@/model/utils/result";
import { UTC_TIME_ZONE_ID } from "@/utils/date";
import { dateRangeFormatShortMonthDateYear } from "@/utils/datetimeFormatters";
import { getDateFromBlockchainTime, getDateFromBlockchainTimeWithTZ } from "@/utils/formInput";
import { bigIntReplacer } from "@/utils/json";
import moment from "moment";
import { useCallback, useState } from "react";
import { TripInsurance } from "../models";

export type InsuranceFiltersType = {};

export default function useInsurances(isHost: boolean) {
  const { rentalityContracts } = useRentality();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TripInsurance[]>([]);
  const [allData, setAllData] = useState<TripInsurance[] | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPageCount, setTotalPageCount] = useState<number>(0);

  const filterData = useCallback(
    (data: TripInsurance[], filters?: InsuranceFiltersType, page: number = 1, itemsPerPage: number = 10) => {
      const filteredData = !filters
        ? data
        : data.filter(
            (i) => i !== undefined
            // (filters.dateFrom === undefined || i.startDateTime >= filters.dateFrom) &&
            // (filters.dateTo === undefined || i.endDateTime <= filters.dateTo) &&
            // (filters.status === undefined || i.status === filters.status)
          );
      const slicedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
      setCurrentPage(page);
      setData(slicedData);
      console.log(`slicedData.length: ${slicedData.length} | itemsPerPage: ${itemsPerPage}`);

      setTotalPageCount(Math.ceil(filteredData.length / itemsPerPage));
    },
    []
  );

  const fetchData = useCallback(
    async (
      filters?: InsuranceFiltersType,
      page: number = 1,
      itemsPerPage: number = 10,
      refetch: boolean = false
    ): Promise<Result<boolean, string>> => {
      if (allData !== undefined && !refetch) {
        filterData(allData, filters, page, itemsPerPage);
        return Ok(true);
      }

      if (!rentalityContracts) {
        console.error("fetchData error: rentalityContract is null");
        return Err("Contract is not initialized");
      }

      setIsLoading(true);
      setCurrentPage(page);
      setTotalPageCount(0);

      const result = await rentalityContracts.gatewayProxy.getInsurancesBy(isHost);

      if (!result.ok) {
        setIsLoading(false);
        return Err("Get data error. See logs for more details");
      }

      if (result.value && result.value.length > 0) {
        validateContractInsuranceDTO(result.value[0]);
      }
      console.debug("insuranceData", JSON.stringify(result.value, bigIntReplacer, 2));

      const data: TripInsurance[] = result.value.map((i) => {
        const timeZoneId = UTC_TIME_ZONE_ID;
        const startDateTime = getDateFromBlockchainTimeWithTZ(i.startDateTime, timeZoneId);

        return {
          tripId: Number(i.tripId),
          insuranceType: i.insuranceInfo.insuranceType,
          tripInfo:
            i.insuranceInfo.insuranceType === InsuranceType.General
              ? "For all trips"
              : `#${i.tripId} ${i.carBrand} ${i.carModel} ${i.carYear} ${dateRangeFormatShortMonthDateYear(startDateTime, getDateFromBlockchainTimeWithTZ(i.endDateTime, timeZoneId))}`,
          startDateTime: startDateTime,
          insurance: {
            type: i.insuranceInfo.insuranceType,
            photos: [i.insuranceInfo.photo],
            companyName: i.insuranceInfo.companyName,
            policyNumber: i.insuranceInfo.policyNumber,
            comment: i.insuranceInfo.comment,
            uploadedBy: `${i.createdByHost ? "Host" : "Guest"} ${i.creatorFullName} uploaded ${moment(getDateFromBlockchainTime(i.insuranceInfo.createdTime)).format("DD.MM.YY hh:mm A")}`,
            isActual: i.isActual,
          },
          hostPhoneNumber: i.creatorPhoneNumber,
          guestPhoneNumber: i.creatorPhoneNumber,
        };
      });
      data.sort((a, b) => {
        const timeDiff = b.startDateTime.getTime() - a.startDateTime.getTime();
        if (timeDiff !== 0) return timeDiff;
        return Number(a.insuranceType - b.insuranceType);
      });

      setAllData(data);
      filterData(data, filters, page, itemsPerPage);

      setIsLoading(false);
      return Ok(true);
    },
    [rentalityContracts, allData, filterData, isHost]
  );

  return {
    isLoading,
    data: { data: data, currentPage: currentPage, totalPageCount: totalPageCount },
    fetchData,
  } as const;
}
