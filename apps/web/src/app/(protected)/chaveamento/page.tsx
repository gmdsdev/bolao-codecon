import type { Metadata } from "next";

import { BracketPage } from "./_components/bracket-page";
import { getBracketPageData } from "./_components/bracket-page-data";

export const metadata: Metadata = {
  title: "Chaveamento",
};

export default async function Page() {
  const data = await getBracketPageData();

  return <BracketPage data={data} />;
}
