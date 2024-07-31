import React, { forwardRef, useEffect, useState } from "react";
import { getRefuelCharge, TripInfo } from "@/model/TripInfo";
import { TFunction } from "@/utils/i18n";
import RntButton from "@/components/common/rntButton";
import RntInput from "@/components/common/rntInput";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RntFuelLevelSelect from "@/components/common/RntFuelLevelSelect";
import {
  changeStatusGuestStartedFormSchema,
  ChangeStatusGuestStartedFormValues,
} from "./changeStatusGuestStartedFormSchema";
import { calculateDays } from "@/utils/date";
import { displayMoneyWith2Digits } from "@/utils/numericFormatters";
import { getMilesIncludedPerDayText } from "@/model/HostCarInfo";

interface ChangeStatusGuestStartedFormProps {
  tripInfo: TripInfo;
  changeStatusCallback: (changeStatus: () => Promise<boolean>) => Promise<void>;
  disableButton: boolean;
  t: TFunction;
}

const ChangeStatusGuestStartedForm = forwardRef<HTMLDivElement, ChangeStatusGuestStartedFormProps>(
  ({ tripInfo, changeStatusCallback, disableButton, t }, ref) => {
    const { register, control, handleSubmit, formState, watch } = useForm<ChangeStatusGuestStartedFormValues>({
      defaultValues: {
        fuelOrBatteryLevelStart: `${tripInfo.startFuelLevelInPercents}%`,
        odotemerStart: Number(tripInfo.startOdometr),
      },
      resolver: zodResolver(changeStatusGuestStartedFormSchema),
    });
    const { errors, isSubmitting } = formState;

    const [endLevelInPercents, setEndLevelInPercents] = useState<number>(0);
    const [overmileValue, setOvermileValue] = useState<number>(0);
    const odometer = watch("odotemer");

    const depositPaid = tripInfo.depositInUsd;
    const refuelCharge = odometer !== undefined ? getRefuelCharge(tripInfo, endLevelInPercents) : 0;
    const overmilesCharge = overmileValue * tripInfo.overmilePrice;
    let depositToBeReturned = depositPaid - refuelCharge - overmilesCharge;
    depositToBeReturned = depositToBeReturned > 0 ? depositToBeReturned : 0;

    useEffect(() => {
      const endOdometr = odometer ?? 0;
      const tripDays = calculateDays(tripInfo.tripStart, tripInfo.tripEnd);
      let overMiles = endOdometr - tripInfo.startOdometr - tripInfo.milesIncludedPerDay * tripDays;
      overMiles = overMiles > 0 ? overMiles : 0;
      setOvermileValue(overMiles);
    }, [tripInfo, odometer]);

    async function onFormSubmit(formData: ChangeStatusGuestStartedFormValues) {
      changeStatusCallback(() => {
        return tripInfo.allowedActions[0].action(BigInt(tripInfo.tripId), [
          formData.fuelOrBatteryLevel.toString(),
          formData.odotemer.toString(),
        ]);
      });
    }

    return (
      <div ref={ref}>
        <form
          className="flex flex-col px-8 pt-2 pb-4"
          onSubmit={handleSubmit(async (data) => await onFormSubmit(data))}
        >
          <hr />
          <div id="trip-allowed-actions">
            <strong className="text-xl">
              {t("booked.confirm_data_to_change_status", {
                type: "enter",
              })}
            </strong>
          </div>

          <div className="flex flex-col md:flex-row md:gap-8 mb-4">
            <div className="flex flex-col flex-1">
              <div className="flex flex-col">
                <div className="font-bold mt-2">Fuel or Battery level, %</div>
                <div className="flex flex-row gap-8">
                  <RntInput
                    className="w-1/2 py-2"
                    id="fuelAtStartTrip"
                    label="At start trip"
                    readOnly={true}
                    {...register("fuelOrBatteryLevelStart")}
                    validationError={errors.fuelOrBatteryLevelStart?.message?.toString()}
                  />
                  <Controller
                    name="fuelOrBatteryLevel"
                    control={control}
                    render={({ field }) => (
                      <RntFuelLevelSelect
                        className="w-1/2 py-2"
                        id="fuelAtEndTrip"
                        label="At end trip"
                        value={field.value}
                        onLevelChange={(newValue) => {
                          field.onChange(newValue);
                          setEndLevelInPercents(newValue * 100 ?? 0);
                        }}
                        validationError={errors.fuelOrBatteryLevel?.message?.toString()}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="font-bold mt-2">Odometer</div>
                <div className="flex flex-row gap-8">
                  <RntInput
                    className="w-1/2 py-2"
                    id="fuelAtStartTrip"
                    label="At start trip"
                    readOnly={true}
                    {...register("odotemerStart")}
                    validationError={errors.odotemerStart?.message?.toString()}
                  />
                  <RntInput
                    className="w-1/2 py-2"
                    id="fuelAtEndTrip"
                    label="At end trip"
                    {...register("odotemer", { valueAsNumber: true })}
                    validationError={errors.odotemer?.message?.toString()}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <div className="font-bold mt-2">Reimbursement charge:</div>
              <div className="grid grid-cols-2 mt-2 md:mt-4 text-sm">
                <span className="col-span-1">Pick up Fuel:</span>
                <span className="col-span-1 text-right">{tripInfo.startFuelLevelInPercents}%</span>
                <span className="col-span-1">Drop off Fuel:</span>
                <span className="col-span-1 text-right">{endLevelInPercents}%</span>
                <span className="col-span-1">Price per 10% charge/tank:</span>
                <span className="col-span-1 text-right">
                  ${displayMoneyWith2Digits(tripInfo.pricePer10PercentFuel)}
                </span>
                <span className="col-span-1">Total refuel charge:</span>
                <span className="col-span-1 text-right">${displayMoneyWith2Digits(refuelCharge)}</span>
              </div>
              <div className="grid grid-cols-2 mt-2 md:mt-4 text-sm">
                <span className="col-span-1">Miles included:</span>
                <span className="col-span-1 text-right">
                  {getMilesIncludedPerDayText(
                    tripInfo.milesIncludedPerDay * calculateDays(tripInfo.tripStart, tripInfo.tripEnd)
                  )}{" "}
                  mi per trip
                </span>
                <span className="col-span-1">Overmiles:</span>
                <span className="col-span-1 text-right">{overmileValue} mi per trip</span>
                <span className="col-span-1">Overmile price:</span>
                <span className="col-span-1 text-right">${displayMoneyWith2Digits(tripInfo.overmilePrice)}</span>
                <span className="col-span-1">Overmile charge:</span>
                <span className="col-span-1 text-right">${displayMoneyWith2Digits(overmilesCharge)}</span>
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <div className="font-bold mt-4 md:mt-2">Security deposit info:</div>
              <div className="grid grid-cols-2 gap-x-2 mt-2 md:mt-4 text-sm">
                <span className="col-span-1">Received deposit:</span>
                <span className="col-span-1 text-right">${displayMoneyWith2Digits(depositPaid)}</span>
                <span className="col-span-1">Refuel or battery charge:</span>
                <div className="col-span-1 text-right flex items-end">
                  <span className="w-full">${displayMoneyWith2Digits(refuelCharge)}</span>
                </div>
                <span className="col-span-1">Overmiles reimbursement:</span>
                <div className="col-span-1 text-right flex items-end">
                  <span className="w-full">${displayMoneyWith2Digits(overmilesCharge)}</span>
                </div>
                <span className="col-span-1">Deposit to be returned:</span>
                <div className="col-span-1 text-right flex items-end">
                  <span className="w-full">${displayMoneyWith2Digits(depositToBeReturned)}</span>
                </div>
              </div>
              <div className="mt-2 md:mt-4">Deposit returned after the Host Completed the trip</div>
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <RntButton type="submit" className="max-md:w-full h-16 px-4" disabled={disableButton || isSubmitting}>
              Finish
            </RntButton>
          </div>
        </form>
      </div>
    );
  }
);
ChangeStatusGuestStartedForm.displayName = "ChangeStatusGuestStartedForm";

export default ChangeStatusGuestStartedForm;
