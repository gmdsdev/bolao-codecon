import Link from "next/link";
import type { PropsWithChildren } from "react";

import { CodeconLogo } from "@/components/codecon-logo";

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto my-8 w-full max-w-md px-3 sm:my-12 sm:px-0">
      <Link href="/sign-in">
        <CodeconLogo className="mb-6" />
      </Link>
      {children}
    </div>
  );
}
