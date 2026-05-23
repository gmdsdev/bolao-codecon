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

import { ScoreLogDialog } from "@/app/(protected)/_components/score-log-dialog";
import { RankingTable, type RankingTableUser } from "@/components/ranking-table";
import { trpc } from "@/utils/trpc";

import {
  TableEmptyState,
  TableErrorState,
  TableLoadingState,
} from "../../_components/table-state";

type RankingUser = RankingTableUser & {
  userId: string;
};

export function AdminRankingPage() {
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
      <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
        <Card className="min-w-0">
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
