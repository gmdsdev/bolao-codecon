import { MySummaryCard } from "./my-summary-card";
import { ProtectedHomePageClient } from "./protected-home-page-client";
import { getProtectedHomePageData } from "./protected-home-page-data";
import { RankingCard } from "./ranking-card";

export async function ProtectedHomePage() {
  const initialData = await getProtectedHomePageData();

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col gap-3 p-3 lg:flex-row">
      <ProtectedHomePageClient
        initialData={{
          roundId: initialData.roundId,
          rounds: initialData.rounds,
          matches: initialData.matches,
        }}
      />
      <div className="flex flex-col gap-3 lg:w-72 shrink-0">
        <RankingCard ranking={initialData.ranking} />
        <MySummaryCard />
      </div>
    </div>
  );
}
