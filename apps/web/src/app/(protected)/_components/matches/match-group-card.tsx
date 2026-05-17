import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";

import { MatchTable } from "./match-table";
import type { Match, SavedBet } from "./types";

type MatchGroupCardProps = {
  title: string;
  matches: Match[];
  savedBets: Map<number, SavedBet>;
  isBetPending: boolean;
  currentTimeMs: number;
  onOpenBet: (match: Match) => void;
};

export function MatchGroupCard({
  title,
  matches,
  savedBets,
  isBetPending,
  currentTimeMs,
  onOpenBet,
}: MatchGroupCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <MatchTable
          matches={matches}
          savedBets={savedBets}
          isBetPending={isBetPending}
          currentTimeMs={currentTimeMs}
          onOpenBet={onOpenBet}
        />
      </CardContent>
    </Card>
  );
}
