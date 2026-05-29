import { MySummaryCard } from "@/components/my-summary-card";
import { PrizeCard } from "@/components/bolao/prize-card";
import { ProtectedHomePageClient } from "./protected-home-page-client";
import { getProtectedHomePageData } from "./protected-home-page-data";
import { RankingCard } from "./ranking-card";

export async function ProtectedHomePage() {
  const initialData = await getProtectedHomePageData();

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-3 p-2 sm:p-3 lg:flex-row">
      <ProtectedHomePageClient
        initialData={{
          roundId: initialData.roundId,
          renderedAt: initialData.renderedAt,
          rounds: initialData.rounds,
          matches: initialData.matches,
        }}
      />
      <div className="flex min-w-0 shrink-0 flex-col gap-3 lg:w-72">
        <RankingCard ranking={initialData.ranking} />
        <MySummaryCard />
        <PrizeCard />
      </div>
    </div>
  );
}
