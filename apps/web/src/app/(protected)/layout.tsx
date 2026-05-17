import { redirect } from "next/navigation";

import Header from "@/components/header";
import { getServerSession } from "@/lib/server-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
