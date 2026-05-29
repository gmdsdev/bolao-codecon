"use client";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { Separator } from "@codecon/ui/components/separator";
import type { UseQueryResult } from "@tanstack/react-query";
import { Loader2Icon, ScrollTextIcon } from "lucide-react";

export type ScoreLogEntry = {
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
  createdAt: string | Date;
};

type ScoreLogDialogProps = {
  scoreLog: UseQueryResult<ScoreLogEntry[], unknown>;
  betLabel?: string;
  description?: string;
};

export function ScoreLogDialog({
  scoreLog,
  betLabel = "Sua aposta",
  description = "Histórico das partidas que formaram sua pontuação atual.",
}: ScoreLogDialogProps) {
  return (
    <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-hidden sm:max-h-[calc(100vh-2rem)] sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detalhes da pontuação</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <ScoreLogContent scoreLog={scoreLog} betLabel={betLabel} />
    </DialogContent>
  );
}

function ScoreLogContent({
  betLabel,
  scoreLog,
}: {
  betLabel: string;
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
    <div className="max-h-[min(28rem,calc(100dvh-10rem))] overflow-y-auto pr-1">
      <div className="flex flex-col gap-3">
        {scoreLog.data.map((entry) => (
          <ScoreLogItem key={entry.id} entry={entry} betLabel={betLabel} />
        ))}
      </div>
    </div>
  );
}

function ScoreLogItem({
  betLabel,
  entry,
}: {
  betLabel: string;
  entry: ScoreLogEntry;
}) {
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
          <p className="min-w-0 font-medium text-foreground">
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
          {betLabel}: {entry.betScoreA} x {entry.betScoreB}
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

function getBasePointsReason(entry: ScoreLogEntry) {
  if (entry.basePoints === 3) {
    return "placar exato";
  }

  if (entry.basePoints === 1) {
    return "resultado certo";
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

function formatLogDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getBetModifierLabel(modifier: string) {
  switch (modifier) {
    case "invert_bet":
      return "Inverter aposta";
    case "double_points":
      return "Pontos em dobro";
    case "half_points":
      return "Metade dos pontos";
    case "invalid_bet":
      return "Aposta inválida";
    case "lucky_duck":
      return "Pato da sorte";
    case "normal":
      return "Sem efeito";
    default:
      return "Sem efeito";
  }
}
