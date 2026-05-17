import { Button } from "@codecon/ui/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
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
  currentTimeMs: number;
  onOpenBet: (match: Match) => void;
};

export function MatchTable({
  matches,
  savedBets,
  isBetPending,
  currentTimeMs,
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
          currentTimeMs={currentTimeMs}
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
  currentTimeMs,
  onOpenBet,
}: {
  match: Match;
  savedBet?: SavedBet;
  isBetPending: boolean;
  currentTimeMs: number;
  onOpenBet: (match: Match) => void;
}) {
  const betScoreA = savedBet?.scoreA ?? match.betScoreA;
  const betScoreB = savedBet?.scoreB ?? match.betScoreB;
  const betModifier = savedBet?.modifier ?? match.betModifier;
  const isScored = match.scoreA !== null || match.scoreB !== null;
  const isClosed = isScored || new Date(match.date).getTime() <= currentTimeMs;
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
    <Item className="group/match-item w-full min-w-0 border-b border-border last:border-b-0">
      <ItemHeader className="flex-col items-stretch justify-normal gap-3 sm:flex-row sm:items-center">
        <ItemTitle className="mr-auto flex w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-base transition-all duration-300 grayscale-100 group-hover/match-item:grayscale-0 sm:text-lg">
          <span className="min-w-0 truncate">
            {match.teamAFlag} {match.teamAName}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">vs</span>
          <span className="min-w-0 truncate">
            {match.teamBName} {match.teamBFlag}
          </span>
        </ItemTitle>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
          <Tooltip>
            <TooltipTrigger>
              <div
                className="flex shrink-0 items-center"
                aria-label={`Placar final: ${finalScoreLabel}`}
              >
                <div className="border border-border px-2 py-1 text-sm">
                  {match.scoreA ?? "-"}
                </div>
                <div className="px-2 py-1 text-sm text-muted-foreground">:</div>
                <div className="border border-border px-2 py-1 text-sm">
                  {match.scoreB ?? "-"}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>Placar final</TooltipContent>
          </Tooltip>
          <ItemActions className="ml-auto sm:ml-0">
            <Button
              onClick={() => onOpenBet(match)}
              disabled={isClosed || hasBet || isBetPending}
              className="min-w-24"
            >
              {isClosed ? "Encerrada" : hasBet ? "Aposta feita" : "Apostar"}
            </Button>
          </ItemActions>
        </div>
      </ItemHeader>
      <Separator />
      <ItemContent className="min-w-0 text-muted-foreground">
        {!hasBet && <span>Aposta não efetuada</span>}
        {hasBet && (
          <div className="grid gap-1 sm:grid-cols-3 sm:gap-3">
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
