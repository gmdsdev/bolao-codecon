"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Dialog } from "@codecon/ui/components/dialog";
import { Separator } from "@codecon/ui/components/separator";
import { trpc } from "@/utils/trpc";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { ScoreLogDialog } from "./score-log-dialog";

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
        <CardHeader className="!flex items-center justify-between">
          <CardTitle>Meu Resumo</CardTitle>
          <CardAction className="col-auto row-auto row-span-1 self-center justify-self-auto">
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
      <span className="min-w-0 pr-2 text-sm text-muted-foreground">
        {label}
      </span>
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
