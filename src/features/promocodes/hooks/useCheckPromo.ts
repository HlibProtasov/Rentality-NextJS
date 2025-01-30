import { useRentality } from "@/contexts/rentalityContext";
import { validateContractCheckPromoDTO } from "@/model/blockchain/schemas_utils";
import { Err, Ok, Result } from "@/model/utils/result";
import { UTC_TIME_ZONE_ID } from "@/utils/date";
import { getBlockchainTimeFromDate } from "@/utils/formInput";
import { bigIntReplacer } from "@/utils/json";
import { isEmpty } from "@/utils/string";
import moment from "moment";
import { useCallback } from "react";

function useCheckPromo() {
  const { rentalityContracts } = useRentality();

  const checkPromo = useCallback(
    async (
      code: string,
      startDateTimeStringFormat: string,
      endDateTimeStringFormat: string,
      timeZoneId: string
    ): Promise<Result<{ value: number }, Error>> => {
      if (!rentalityContracts) {
        console.error("fetchData error: rentalityContract is null");
        return Err(new Error("Contract is not initialized"));
      }

      const notEmtpyTimeZoneId = !isEmpty(timeZoneId) ? timeZoneId : UTC_TIME_ZONE_ID;
      const dateFrom = moment.tz(startDateTimeStringFormat, notEmtpyTimeZoneId).toDate();
      const dateTo = moment.tz(endDateTimeStringFormat, notEmtpyTimeZoneId).toDate();

      const startUnixTime = getBlockchainTimeFromDate(dateFrom);
      const endUnixTime = getBlockchainTimeFromDate(dateTo);

      console.debug(
        "checkPromoDto call",
        JSON.stringify({ code, notEmtpyTimeZoneId, dateFrom, startUnixTime, dateTo, endUnixTime }, bigIntReplacer, 2)
      );
      const result = await rentalityContracts.gatewayProxy.checkPromo(code, startUnixTime, endUnixTime);
      if (!result.ok) return result;

      validateContractCheckPromoDTO(result.value);

      console.log("checkPromoDto", JSON.stringify(result.value, bigIntReplacer, 2));

      if (!result.value.isFound) {
        return Err(new Error("Promo is not found"));
      }
      if (!result.value.isValid || !result.value.isDiscount) {
        return Err(new Error("Promo is not valid"));
      }

      return Ok({ value: Number(result.value.value) });
    },
    [rentalityContracts]
  );

  return { checkPromo } as const;
}

export default useCheckPromo;
