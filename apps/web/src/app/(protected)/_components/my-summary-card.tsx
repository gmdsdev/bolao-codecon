"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Separator } from "@codecon/ui/components/separator";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

export function MySummaryCard() {
  const summary = useQuery(trpc.ranking.getMySummary.queryOptions());

  return (
    <Card className="w-full h-min shrink-0 lg:w-72">
      <CardHeader>
        <CardTitle>Meu Resumo</CardTitle>
      </CardHeader>
      <CardContent>
        <MySummaryContent summary={summary} />
      </CardContent>
    </Card>
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
  summary: ReturnType<typeof useQuery<SummaryData>>;
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
