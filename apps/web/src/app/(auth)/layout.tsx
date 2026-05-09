import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import logo from "@/assets/codecon.svg";

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div className="max-w-md mx-auto my-12">
      <Link href="/sign-in">
        <Image src={logo} alt="Codecon logo" loading="eager" className="mb-6" />
      </Link>
      {children}
    </div>
  );
}
