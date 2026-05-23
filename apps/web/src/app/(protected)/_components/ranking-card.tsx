"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Dialog } from "@codecon/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@codecon/ui/components/empty";
import { RankingTable } from "@/components/ranking-table";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { TrophyIcon } from "lucide-react";
import { useState } from "react";

import type { ProtectedHomePageData } from "./protected-home-page-data";
import { ScoreLogDialog } from "./score-log-dialog";

type RankingCardProps = {
  ranking: ProtectedHomePageData["ranking"];
};

type RankingUser = ProtectedHomePageData["ranking"][number];

export function RankingCard({ ranking }: RankingCardProps) {
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
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
      <Card className="h-min w-full min-w-0">
        <CardHeader>
          <CardTitle>Classificação</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ranking.length ? (
            <RankingTable ranking={ranking} onSelectUser={setSelectedUser} />
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia>
                  <TrophyIcon className="size-8 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma classificação ainda</EmptyTitle>
                <EmptyDescription>
                  As pontuações aparecerão aqui conforme as apostas forem
                  resolvidas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
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
