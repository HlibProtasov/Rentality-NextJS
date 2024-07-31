import React, { MutableRefObject, memo, useState } from "react";
import { TripInfo } from "@/model/TripInfo";
import RntButton from "../common/rntButton";
import { TripStatus } from "@/model/blockchain/schemas";
import { useRntDialogs } from "@/contexts/rntDialogsContext";
import { isEmpty } from "@/utils/string";
import { TFunction } from "@/utils/i18n";
import AllowedActionsHostFinishingByHost from "./forms/AllowedActionsHostFinishingByHost";
import AllowedActionsGuestStarted from "./forms/AllowedActionsGuestStarted";
import AllowedActionsGuest from "./forms/AllowedActionsGuest";
import AllowedActionsHostConfirmed from "./forms/AllowedActionsHostConfirmed";
import AllowedActionsHost from "./forms/AllowedActionsHost";
import ChangeStatusHostConfirmed from "./forms/changeStatusHostConfirmed";

function TripAdditionalActions({
  tripInfo,
  changeStatusCallback,
  disableButton,
  refForScrool,
  isHost,
  t,
}: {
  tripInfo: TripInfo;
  changeStatusCallback: (changeStatus: () => Promise<boolean>) => Promise<void>;
  disableButton: boolean;
  refForScrool?: MutableRefObject<HTMLDivElement>;
  isHost: boolean;
  t: TFunction;
}) {
  const defaultValues =
    tripInfo?.allowedActions?.length > 0
      ? tripInfo?.allowedActions[0].params.map((i) => {
          return i.value;
        })
      : [];
  const [inputParams, setInputParams] = useState<string[]>(defaultValues);
  const [confirmParams, setConfirmParams] = useState<boolean[]>([]);
  const { showDialog } = useRntDialogs();

  const handleButtonClick = () => {
    if (tripInfo == null || tripInfo.allowedActions == null || tripInfo.allowedActions.length == 0) {
      return;
    }

    if (
      tripInfo.allowedActions[0].readonly &&
      (confirmParams.length != defaultValues.length || !confirmParams.every((i) => i === true))
    ) {
      showDialog(t("booked.confirm_full"));
      return;
    }

    if (
      inputParams.length > 0 &&
      inputParams.some((i, index) => tripInfo?.allowedActions[0]?.params[index]?.required === true && isEmpty(i))
    ) {
      showDialog(t("booked.input_full_odom"));
      return;
    }

    changeStatusCallback(() => {
      return tripInfo.allowedActions[0].action(BigInt(tripInfo.tripId), inputParams);
    });
  };

  if (isHost && tripInfo.status === TripStatus.Confirmed)
    return (
      <ChangeStatusHostConfirmed
        tripInfo={tripInfo}
        changeStatusCallback={changeStatusCallback}
        disableButton={disableButton}
        t={t}
        ref={refForScrool}
      />
    );

  return (
    <div className="flex flex-col px-8 pt-2 pb-4" ref={refForScrool}>
      <hr />
      <div id="trip-allowed-actions">
        <strong className="text-xl">
          {t("booked.confirm_data_to_change_status", {
            type: tripInfo.allowedActions[0].readonly ? "confirm" : "enter",
          })}
        </strong>
      </div>

      {isHost ? (
        tripInfo.status === TripStatus.Confirmed ? (
          <AllowedActionsHostConfirmed
            params={tripInfo.allowedActions[0].params}
            inputParams={inputParams}
            setInputParams={setInputParams}
          />
        ) : tripInfo.status === TripStatus.Started || tripInfo.status === TripStatus.CheckedInByHost ? (
          <AllowedActionsHostFinishingByHost
            tripInfo={tripInfo}
            params={tripInfo.allowedActions[0].params}
            inputParams={inputParams}
            setInputParams={setInputParams}
            isFinishingByHost={true}
          />
        ) : (
          <AllowedActionsHost
            tripInfo={tripInfo}
            inputParams={inputParams}
            setInputParams={setInputParams}
            confirmParams={confirmParams}
            setConfirmParams={setConfirmParams}
            t={t}
          />
        )
      ) : tripInfo.status === TripStatus.Started ? (
        <AllowedActionsGuestStarted
          tripInfo={tripInfo}
          params={tripInfo.allowedActions[0].params}
          inputParams={inputParams}
          setInputParams={setInputParams}
        />
      ) : (
        <AllowedActionsGuest
          tripInfo={tripInfo}
          inputParams={inputParams}
          setInputParams={setInputParams}
          confirmParams={confirmParams}
          setConfirmParams={setConfirmParams}
        />
      )}

      <div className="flex flex-row gap-4">
        {tripInfo.allowedActions.map((action) => {
          return (
            <RntButton
              key={action.text}
              className="max-md:w-full h-16 px-4"
              disabled={disableButton}
              onClick={() => {
                if (action.params == null || action.params.length == 0) {
                  changeStatusCallback(() => {
                    return action.action(BigInt(tripInfo.tripId), []);
                  });
                } else {
                  handleButtonClick();
                }
              }}
            >
              {action.text}
            </RntButton>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TripAdditionalActions);
