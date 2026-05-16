import Link from "next/link";
import type { PropsWithChildren } from "react";

import { CodeconLogo } from "@/components/codecon-logo";

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div className="max-w-md mx-auto my-12">
      <Link href="/sign-in">
        <CodeconLogo className="mb-6" />
      </Link>
      {children}
    </div>
  );
}
