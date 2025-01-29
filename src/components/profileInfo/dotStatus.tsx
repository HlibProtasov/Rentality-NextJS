import { cn } from "@/utils";
import { getDotStatusColor } from "@/utils/tailwind";
import { memo } from "react";

function DotStatus({
  containerClassName,
  color,
  text,
}: {
  containerClassName?: string;
  color: `#${string}` | "success" | "error" | "warning";
  text: string;
}) {
  const containerClassNameMerged = cn("flex gap-2 items-center", containerClassName);
  const dotClassName = cn("w-4 h-4 rounded-full inline-block pr-4", getDotStatusColor(color));

  return (
    <div className={containerClassNameMerged}>
      <span className={dotClassName}></span>
      <span>{text}</span>
    </div>
  );
}

export default memo(DotStatus);
