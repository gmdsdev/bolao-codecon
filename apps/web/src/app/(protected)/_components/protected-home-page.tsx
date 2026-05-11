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
      <RankingCard ranking={initialData.ranking} />
    </div>
  );
}
