import { dateFormatLongMonthDateTime } from "@/utils/datetimeFormatters";
import { Avatar } from "@mui/material";

export default function ChatMessage({
  photoUrl,
  name,
  datetime,
  message,
  isMyMessage,
}: {
  photoUrl: string;
  name: string;
  datetime: Date;
  message: string;
  isMyMessage: boolean;
}) {
  return !isMyMessage ? (
    <div className="bg-[#484874] rnt-card-selected w-5/6 grid grid-cols-[auto_1fr_auto] gap-2 rounded-xl rounded-ss-none  overflow-hidden p-4">
      <div className="w-12 h-12">
        <Avatar src={photoUrl} sx={{ width: "3rem", height: "3rem" }}></Avatar>
      </div>
      <div className="max-sm:leading-5 font-bold text-lg self-center">{name}</div>
      <div className="text-base self-center text-rentality-secondary">{dateFormatLongMonthDateTime(datetime)}</div>
      <div className="col-span-3 text-lg whitespace-pre-line">{message}</div>
    </div>
  ) : (
    <div className="bg-[#7856FF] rnt-card w-5/6 grid grid-cols-[auto_1fr_auto] gap-2 rounded-xl rounded-se-none overflow-hidden p-4 self-end">
      <div className="text-base self-center text-rentality-secondary">{dateFormatLongMonthDateTime(datetime)}</div>
      <div className="max-sm:leading-5 font-bold text-lg self-center text-end">{name}</div>
      <div className="w-12 h-12">
        <Avatar src={photoUrl} sx={{ width: "3rem", height: "3rem" }}></Avatar>
      </div>
      <div className="col-span-3 text-lg whitespace-pre-line">{message}</div>
    </div>
  );
}
function ChatMessageHeader({
  photoUrl,
  name,
  datetime,
  isMyMessage,
}: {
  photoUrl: string;
  name: string;
  datetime: Date;
  isMyMessage: boolean;
}) {
  return !isMyMessage ? (
    <div className="col-span-3 flex flex-row justify-between">
      <div className="flex flex-row gap-2">
        <div className="w-12 h-12">
          <Avatar src={photoUrl} sx={{ width: "3rem", height: "3rem" }}></Avatar>
        </div>
        <div className="font-bold text-lg self-center">{name}</div>
      </div>
      <div className="text-sm self-center text-gray-600">{dateFormatLongMonthDateTime(datetime)}</div>
    </div>
  ) : (
    <div className="col-span-3 flex flex-row justify-between">
      <div className="text-sm self-center text-gray-600">{dateFormatLongMonthDateTime(datetime)}</div>
      <div className="flex flex-row gap-2">
        <div className="font-bold text-lg self-center">{name}</div>
        <div className="w-12 h-12">
          <Avatar src={photoUrl} sx={{ width: "3rem", height: "3rem" }}></Avatar>
        </div>
      </div>
    </div>
  );
}
