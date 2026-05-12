"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { Separator } from "@codecon/ui/components/separator";
import { trpc } from "@/utils/trpc";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Loader2Icon, ScrollTextIcon } from "lucide-react";
import { useState } from "react";

import { getBetModifierLabel } from "./matches/match-utils";

export function MySummaryCard() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const summary = useQuery(trpc.ranking.getMySummary.queryOptions());
  const scoreLog = useQuery(
    trpc.ranking.getMyLog.queryOptions(undefined, {
      enabled: isDetailsOpen,
    }),
  );

  return (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <Card className="w-full h-min shrink-0 lg:w-72">
        <CardHeader>
          <CardTitle>Meu Resumo</CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsDetailsOpen(true)}
            >
              Detalhes
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <MySummaryContent summary={summary} />
        </CardContent>
      </Card>
      <ScoreLogDialog scoreLog={scoreLog} />
    </Dialog>
  );
}

type SummaryData = {
  position: number | null;
  totalPoints: number;
  betsPlaced: number;
  pendingMatches: number;
  lastPoints: {
    totalPoints: number;
    basePoints: number;
    modifierPoints: number;
    modifier: string;
  } | null;
};

type ScoreLogEntry = {
  id: number;
  matchId: number;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
  roundTitle: string;
  betScoreA: number;
  betScoreB: number;
  matchScoreA: number | null;
  matchScoreB: number | null;
  basePoints: number;
  modifierPoints: number;
  totalPoints: number;
  modifier: string;
  createdAt: string;
};

type MySummaryContentProps = {
  summary: UseQueryResult<SummaryData, unknown>;
};

function MySummaryContent({ summary }: MySummaryContentProps) {
  if (summary.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="size-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (summary.isError || !summary.data) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o resumo.
      </p>
    );
  }

  const { position, totalPoints, betsPlaced, pendingMatches, lastPoints } =
    summary.data;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <SummaryRow
          label="Minha posição"
          value={position ? `#${position}` : "—"}
          highlight
        />
        <SummaryRow label="Total de pontos" value={String(totalPoints)} />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <SummaryRow label="Apostas feitas" value={String(betsPlaced)} />
        <SummaryRow label="Partidas pendentes" value={String(pendingMatches)} />
      </div>

      {lastPoints && (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Última pontuação</span>
            <span className="text-lg font-semibold">
              {lastPoints.totalPoints > 0 ? "+" : ""}
              {lastPoints.totalPoints} pts
            </span>
            {lastPoints.modifierPoints !== 0 && (
              <span className="text-xs text-muted-foreground">
                Base: {lastPoints.basePoints} pts &middot; Modificador:{" "}
                {lastPoints.modifierPoints > 0 ? "+" : ""}
                {lastPoints.modifierPoints} pts
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ScoreLogDialog({
  scoreLog,
}: {
  scoreLog: UseQueryResult<ScoreLogEntry[], unknown>;
}) {
  return (
    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detalhes da pontuação</DialogTitle>
        <DialogDescription>
          Histórico das partidas que formaram sua pontuação atual.
        </DialogDescription>
      </DialogHeader>

      <ScoreLogContent scoreLog={scoreLog} />
    </DialogContent>
  );
}

function ScoreLogContent({
  scoreLog,
}: {
  scoreLog: UseQueryResult<ScoreLogEntry[], unknown>;
}) {
  if (scoreLog.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (scoreLog.isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o log de pontuação.
      </p>
    );
  }

  if (!scoreLog.data?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
        <ScrollTextIcon className="size-5" />
        <p className="text-sm">Ainda não há pontuação registrada.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto pr-1">
      <div className="flex flex-col gap-3">
        {scoreLog.data.map((entry) => (
          <ScoreLogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ScoreLogItem({ entry }: { entry: ScoreLogEntry }) {
  const teamALabel = `${entry.teamAFlag ?? ""} ${entry.teamAName}`.trim();
  const teamBLabel = `${entry.teamBName} ${entry.teamBFlag ?? ""}`.trim();
  const finalScore =
    entry.matchScoreA === null || entry.matchScoreB === null
      ? "- x -"
      : `${entry.matchScoreA} x ${entry.matchScoreB}`;
  const modifierLabel = getBetModifierLabel(entry.modifier);

  return (
    <div className="rounded border border-border bg-muted/60 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {teamALabel}
            <span className="mx-1 text-muted-foreground">x</span>
            {teamBLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.roundTitle} &middot; {formatLogDate(entry.createdAt)}
          </p>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {formatSignedPoints(entry.totalPoints)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span>
          Sua aposta: {entry.betScoreA} x {entry.betScoreB}
        </span>
        <span>Resultado: {finalScore}</span>
        <span>Base: {entry.basePoints} pts ({getBasePointsReason(entry)})</span>
        <span>
          {modifierLabel}: {formatSignedPoints(entry.modifierPoints)}
        </span>
      </div>

      <Separator className="my-3" />

      <p className="text-xs text-muted-foreground">
        {entry.basePoints} pts de base {formatMathDelta(entry.modifierPoints)} ={" "}
        <span className="font-medium text-foreground">
          {entry.totalPoints} pts
        </span>
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "text-sm font-bold text-foreground"
            : "text-sm font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

function getBasePointsReason(entry: ScoreLogEntry) {
  if (entry.basePoints === 3) {
    return "placar exato";
  }

  if (entry.basePoints === 1) {
    return "vencedor certo";
  }

  return "sem acerto";
}

function formatSignedPoints(points: number) {
  return `${points > 0 ? "+" : ""}${points} pts`;
}

function formatMathDelta(points: number) {
  if (points === 0) {
    return "+ 0 pts";
  }

  return points > 0 ? `+ ${points} pts` : `- ${Math.abs(points)} pts`;
}

function formatLogDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
