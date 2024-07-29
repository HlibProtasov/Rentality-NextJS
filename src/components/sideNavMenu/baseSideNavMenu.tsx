import Image from "next/image";
import logo from "../../images/logo.svg";
import Link from "next/link";

export default function BaseSideNavMenu({
  children,
  accountType,
}: {
  children?: React.ReactNode;
  accountType: string;
}) {
  accountType = accountType ?? "Host";

  return (
    <aside id="main-menu" className="lg:min-w-[300px] pl-14 pr-12 pt-12 bg-rentality-bg-left-sidebar max-lg:hidden">
      <div className="w-40">
        <Link href={"/"}>
          <Image alt="" width={200} height={200} src={logo} />
        </Link>
      </div>
      <nav className="w-full pt-4">{children}</nav>
    </aside>
  );
}
