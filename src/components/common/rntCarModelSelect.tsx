import { RntSelectProps } from "./rntSelect";
import React, { useEffect, useState } from "react";
import useCarAPI, { CarModelsListElement } from "@/hooks/useCarAPI";
import { cn } from "@/utils";
import RntFilterSelect from "./RntFilterSelect";

interface RntCarModelSelectProps extends RntSelectProps {
  id: string;
  label?: string;
  className?: string;
  selectClassName?: string;
  promptText?: string;
  make_id: string;
  value: string;
  readOnly?: boolean;
  onModelSelect?: (newID: string, newMake: string) => void;
}

export default function RntCarModelSelect({
  id,
  label,
  className,
  promptText = "Please select",
  readOnly,
  make_id,
  value,
  onModelSelect,
  validationError,
  isTransparentStyle,
  containerClassName,
}: RntCarModelSelectProps) {
  const { getCarModelByMake } = useCarAPI();

  const [modelsList, setModelsList] = useState<CarModelsListElement[]>([]);

  useEffect(() => {
    if (make_id == "") {
      setModelsList([]);
    } else {
      getCarModelByMake(make_id).then(function (response) {
        setModelsList(response);
      });
    }
  }, [make_id]);

  const isReadOnly = readOnly || modelsList.length <= 0;

  return (
    <RntFilterSelect
      id={id}
      className={cn(className, isTransparentStyle && !isReadOnly && "border-gradient border-0")}
      label={label}
      validationError={validationError}
      containerClassName={containerClassName}
      value={value}
      disabled={isReadOnly}
      placeholder={promptText}
      onChange={function (e) {
        const newValue: string = e.target.value;
        const newID: string = modelsList[e.target.selectedIndex]?.id || "";
        if (onModelSelect) onModelSelect(newID, newValue);
      }}
    >
      {modelsList.map((carModelsListElement, index) => (
        <RntFilterSelect.Option
          key={"car-make-" + index}
          data-id={carModelsListElement.id}
          value={carModelsListElement.name}
        />
      ))}
    </RntFilterSelect>
  );
}
