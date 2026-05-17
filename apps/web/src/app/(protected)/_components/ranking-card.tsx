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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
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

function RankingTable({
  ranking,
  onSelectUser,
}: RankingCardProps & {
  onSelectUser: (user: RankingUser) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Participante</TableHead>
          <TableHead className="text-right">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranking.map((row, index) => (
          <TableRow
            key={row.id}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalhes da pontuação de ${row.userName}`}
            onClick={() => onSelectUser(row)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectUser(row);
              }
            }}
            className="cursor-pointer nth-[1]:text-amber-300 nth-[2]:text-green-300 nth-[3]:text-blue-300 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
          >
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="max-w-32 truncate font-medium">
              {row.userName}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {row.points}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
