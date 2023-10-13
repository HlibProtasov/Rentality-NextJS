import Image from "next/image";
import logo from "../../images/logo.png";

type Props = {
    children?: React.ReactNode;
    accountType: string;
};

export default function BaseSideNavMenu({children, accountType}:Props) {
    accountType = accountType ?? "Host";
    const isHost = accountType === "Host";

  return (
    <aside id="main-menu" className="pl-14 pr-12 pt-12 bg-[#1E1E30] max-lg:hidden">
      <div className="w-40">
        <Image alt="" width={200} height={200} src={logo} />
      </div>
      <nav className="w-full pt-4">
          {children}
      </nav>
    </aside>
  );
}
