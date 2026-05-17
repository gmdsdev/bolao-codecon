"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Dialog } from "@codecon/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { ScoreLogDialog } from "../../(protected)/_components/score-log-dialog";

type RankingUser = {
  id: number;
  userId: string;
  userName: string;
  points: number;
};

export default function Page() {
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
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : ranking.isError ? (
              <div className="py-6 text-center text-sm text-destructive">
                Erro: {ranking.error.message}
              </div>
            ) : ranking.data?.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Ainda não há classificação.
              </div>
            ) : ranking.data !== undefined && ranking.data.length > 0 ? (
              <Table>
                <TableHeader className="hidden sm:table-header-group">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.data.map((row, index) => (
                    <TableRow
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalhes da pontuação de ${row.userName}`}
                      onClick={() => setSelectedUser(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedUser(row);
                        }
                      }}
                      className="block cursor-pointer p-3 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:table-row sm:p-0"
                    >
                      <TableCell className="inline-block w-10 p-0 text-muted-foreground sm:table-cell sm:w-12 sm:p-2">
                        {index + 1}
                      </TableCell>
                      <TableCell className="inline-block max-w-[calc(100%-6rem)] whitespace-normal p-0 font-medium sm:table-cell sm:max-w-none sm:p-2">
                        {row.userName}
                      </TableCell>
                      <TableCell className="block p-0 pt-2 text-right font-semibold sm:table-cell sm:p-2">
                        {row.points} pts
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin" />
              </div>
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
