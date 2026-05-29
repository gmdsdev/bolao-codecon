"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Dialog } from "@codecon/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { LogoCard } from "@/components/bolao/logo-card";
import { PrizeCard } from "@/components/bolao/prize-card";
import { MySummaryCard } from "@/components/my-summary-card";
import { RankingTable, type RankingTableUser } from "@/components/ranking-table";
import { ScoreLogDialog } from "@/components/score-log-dialog";
import { trpc } from "@/utils/trpc";

import {
  TableEmptyState,
  TableErrorState,
  TableLoadingState,
} from "@/components/tables/table-state";

type RankingUser = RankingTableUser & {
  userId: string;
};

export function RankingPage() {
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const ranking = useQuery(trpc.ranking.getAll.queryOptions());
  const scoreLog = useQuery(
    trpc.ranking.getLog.queryOptions(
      { userId: selectedUser?.userId ?? "" },
      { enabled: Boolean(selectedUser) },
    ),
  );

  return (
    <Dialog
      open={Boolean(selectedUser)}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
        }
      }}
    >
      <div className="flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-3 p-2 sm:p-3 lg:flex-row">
        <aside className="flex min-w-0 shrink-0 flex-col gap-3">
          <LogoCard />
        </aside>

        <main className="min-w-0 w-full flex-1">
          <Card className="h-min min-w-0">
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ranking.isLoading ? (
                <TableLoadingState />
              ) : ranking.error ? (
                <TableErrorState message={ranking.error.message} />
              ) : ranking.data?.length ? (
                <RankingTable
                  ranking={ranking.data}
                  onSelectUser={setSelectedUser}
                />
              ) : (
                <TableEmptyState>Ainda não há classificação.</TableEmptyState>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="flex min-w-0 shrink-0 flex-col gap-3 lg:w-72">
          <MySummaryCard />
          <PrizeCard />
        </aside>
      </div>
      <ScoreLogDialog
        betLabel="Aposta"
        scoreLog={scoreLog}
        description={
          selectedUser
            ? `Histórico das partidas que formaram a pontuação de ${selectedUser.userName}.`
            : undefined
        }
      />
    </Dialog>
  );
}
