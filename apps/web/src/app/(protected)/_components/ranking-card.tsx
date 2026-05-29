"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Button } from "@codecon/ui/components/button";
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
import Link from "next/link";
import { useState } from "react";

import type { ProtectedHomePageData } from "./protected-home-page-data";
import { ScoreLogDialog } from "@/components/score-log-dialog";

type RankingCardProps = {
  ranking: ProtectedHomePageData["ranking"];
};

type RankingUser = ProtectedHomePageData["ranking"][number];

export function RankingCard({ ranking }: RankingCardProps) {
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const visibleRanking = ranking.slice(0, 10);
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
        <CardHeader className="!flex items-center justify-between">
          <CardTitle>Classificação</CardTitle>
          <CardAction className="col-auto row-auto row-span-1 self-center justify-self-auto">
            <Button
              variant="outline"
              size="xs"
              nativeButton={false}
              render={<Link href="/ranking" />}
            >
              Ver tudo
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {visibleRanking.length ? (
            <RankingTable
              ranking={visibleRanking}
              onSelectUser={setSelectedUser}
            />
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
