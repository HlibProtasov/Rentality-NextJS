import { TripInfo } from "@/model/TripInfo";
import RntInput from "../common/rntInput";
import { SetStateAction } from "react";
import RntCheckbox from "../common/rntCheckbox";
import RntSelect from "../common/rntSelect";

export default function AllowedActions({
  tripInfo,
  inputParams,
  setInputParams,
  confirmParams,
  setConfirmParams,
}: {
  tripInfo: TripInfo;
  inputParams: string[];
  setInputParams: (value: SetStateAction<string[]>) => void;
  confirmParams: boolean[];
  setConfirmParams: (value: SetStateAction<boolean[]>) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {tripInfo.allowedActions[0].params.map((param, index) => {
        return (
          <div className="flex flex-row items-end" key={param.text}>
            {param.type === "fuel" ? (
              <RntSelect
                className="w-1/3"
                id={param.text}
                label={param.text}
                readOnly={tripInfo.allowedActions[0].readonly}
                value={inputParams[index]}
                onChange={(e) => {
                  const newValue = e.target.value;

                  setInputParams((prev) => {
                    const copy = [...prev];
                    copy[index] = newValue;
                    return copy;
                  });
                }}
              >
                <option className="hidden" disabled></option>
                <option value="0">0%</option>
                <option value="0.1">10%</option>
                <option value="0.2">20%</option>
                <option value="0.3">30%</option>
                <option value="0.4">40%</option>
                <option value="0.5">50%</option>
                <option value="0.6">60%</option>
                <option value="0.7">70%</option>
                <option value="0.8">80%</option>
                <option value="0.9">90%</option>
                <option value="1">100%</option>
              </RntSelect>
            ) : (
              <RntInput
                className="w-1/3"
                id={param.text}
                label={param.text}
                readOnly={tripInfo.allowedActions[0].readonly}
                value={inputParams[index]}
                onChange={(e) => {
                  const newValue = e.target.value;

                  setInputParams((prev) => {
                    const copy = [...prev];
                    copy[index] = newValue;
                    return copy;
                  });
                }}
              />
            )}

            {tripInfo.allowedActions[0].readonly ? (
              <RntCheckbox
                className="ml-4"
                title="Confirm"
                value={confirmParams[index]}
                onChange={(e) => {
                  setConfirmParams((prev) => {
                    const copy = [...prev];
                    copy[index] = e.target.checked;
                    return copy;
                  });
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
