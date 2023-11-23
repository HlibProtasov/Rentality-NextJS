import { ChatInfo } from "@/model/ChatInfo";
import { TripStatus, getTripStatusBgColorClassFromStatus } from "@/model/TripInfo";
import { twMerge } from "tailwind-merge";

export default function ChatHeader({ selectedChat }: { selectedChat: ChatInfo }) {
  let statusBgColor = getTripStatusBgColorClassFromStatus(selectedChat?.tripStatus);
  const statusClassName = twMerge(
    "absolute right-0 top-2 px-4 py-1 rounded-l-3xl bg-purple-600 text-rnt-temp-status-text text-end text-sm",
    statusBgColor
  );

  return (
    <section className="rnt-card mt-4 rounded-xl flex overflow-hidden">
      <div
        style={{
          backgroundImage: `url(${selectedChat.carPhotoUrl})`,
        }}
        className="relative w-1/4 min-h-[6rem] flex-shrink-0 bg-center bg-cover"
      >
        <div className={statusClassName}>
          <strong className="text-sm">{selectedChat.tripStatus}</strong>
        </div>
      </div>
      <div className="w-3/4 flex flex-col gap-2 justify-center  p-2 pl-8">
        <div className="text-xl whitespace-nowrap overflow-hidden overflow-ellipsis">{selectedChat.carTitle}</div>
        <div className="text-sm">{selectedChat.carLicenceNumber}</div>
      </div>
    </section>
  );
}
