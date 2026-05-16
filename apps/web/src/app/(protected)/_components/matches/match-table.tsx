import { Button } from "@codecon/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@codecon/ui/components/item";

import { getBetModifierLabel, calculateBetPoints } from "./match-utils";
import type { Match, SavedBet } from "./types";
import { Separator } from "@codecon/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@codecon/ui/components/tooltip";

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
    <>
      {matches.map((match) => (
        <MatchTableRow
          key={match.id}
          match={match}
          savedBet={savedBets.get(match.id)}
          isBetPending={isBetPending}
          onOpenBet={onOpenBet}
        />
      ))}
    </>
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
  const isClosed = isScored || new Date(match.date) <= new Date();
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

  const earnedPoints =
    isScored &&
    hasBet &&
    betScoreA !== null &&
    betScoreB !== null &&
    match.scoreA !== null &&
    match.scoreB !== null
      ? calculateBetPoints(
          betScoreA,
          betScoreB,
          match.scoreA,
          match.scoreB,
          betModifier ?? "normal",
        )
      : null;

  return (
    <Item className="last:border-b-0 border-b border-border w-full group/match-item">
      <ItemHeader className="flex justify-normal items-center">
        <ItemTitle className="text-lg grayscale-100 group-hover/match-item:grayscale-0 transition-all duration-300 mr-auto">
          {match.teamAFlag} {match.teamAName}
          <span className="text-muted-foreground text-sm">vs</span>
          {match.teamBName} {match.teamBFlag}
        </ItemTitle>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center ml-auto">
              <div className="text-md border border-border px-2 py-1">
                {match.scoreA ?? "-"}
              </div>
              <div className="text-md text-muted-foreground px-2 py-1">:</div>
              <div className="text-md border border-border px-2 py-1">
                {match.scoreB ?? "-"}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Placar final</TooltipContent>
        </Tooltip>
        <ItemActions>
          <Button
            onClick={() => onOpenBet(match)}
            disabled={isClosed || hasBet || isBetPending}
          >
            {isClosed ? "Encerrada" : hasBet ? "Aposta feita" : "Apostar"}
          </Button>
        </ItemActions>
      </ItemHeader>
      <Separator />
      <ItemContent className="text-muted-foreground">
        {!match.hasBet && <span>Aposta não efetuada</span>}
        {match.hasBet && (
          <div className="flex justify-between">
            <span>Sua aposta: {betLabel}</span>
            <span>Modificador: {modifierLabel}</span>
            <span>
              Pontos ganhos:{" "}
              {earnedPoints !== null ? `${earnedPoints} pts` : "-"}
            </span>
          </div>
        )}
      </ItemContent>
    </Item>
  );
}
