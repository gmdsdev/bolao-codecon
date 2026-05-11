import { Button } from "@codecon/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";

import { getBetModifierLabel } from "./match-utils";
import type { Match, SavedBet } from "./types";

type MatchTableProps = {
  matches: Match[];
  savedBets: Map<number, SavedBet>;
  isBetPending: boolean;
  onOpenBet: (match: Match) => void;
};

export function MatchTable({
  matches,
  savedBets,
  isBetPending,
  onOpenBet,
}: MatchTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Partida</TableHead>
          <TableHead>Sua aposta</TableHead>
          <TableHead>Roleta</TableHead>
          <TableHead className="text-right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => (
          <MatchTableRow
            key={match.id}
            match={match}
            savedBet={savedBets.get(match.id)}
            isBetPending={isBetPending}
            onOpenBet={onOpenBet}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function MatchTableRow({
  match,
  savedBet,
  isBetPending,
  onOpenBet,
}: {
  match: Match;
  savedBet?: SavedBet;
  isBetPending: boolean;
  onOpenBet: (match: Match) => void;
}) {
  const betScoreA = savedBet?.scoreA ?? match.betScoreA;
  const betScoreB = savedBet?.scoreB ?? match.betScoreB;
  const betModifier = savedBet?.modifier ?? match.betModifier;
  const isScored = match.scoreA !== null || match.scoreB !== null;
  const hasBet = match.hasBet || savedBet !== undefined;
  const betLabel =
    hasBet && betScoreA !== null && betScoreB !== null
      ? `${betScoreA} - ${betScoreB}`
      : "-";
  const modifierLabel =
    hasBet && betModifier ? getBetModifierLabel(betModifier) : "-";
  const finalScoreLabel = isScored
    ? `${match.scoreA ?? "-"} - ${match.scoreB ?? "-"}`
    : "-";

  return (
    <TableRow>
      <TableCell className="flex flex-col gap-1.5 font-medium">
        <span className="block">
          {match.teamAFlag} {match.teamAName} x {match.teamBName}{" "}
          {match.teamBFlag}
        </span>
        {!isScored ? (
          <span className="text-muted-foreground">Partida não concluída</span>
        ) : (
          <span className="text-muted-foreground">
            Placar final: {finalScoreLabel}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center">{betLabel}</TableCell>
      <TableCell>{modifierLabel}</TableCell>
      <TableCell className="text-right">
        <Button
          onClick={() => onOpenBet(match)}
          disabled={isScored || hasBet || isBetPending}
        >
          {isScored ? "Encerrada" : hasBet ? "Aposta feita" : "Apostar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
