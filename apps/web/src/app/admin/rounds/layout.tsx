"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@codecon/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { Loader2 } from "lucide-react";
import { redirect, useParams } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams<{ id: string }>();
  const roundId = Number(params.id);

  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const ranking = useQuery(trpc.ranking.getAll.queryOptions());

  if (!rounds.data?.length) {
    return <div>Nenhum dado</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col gap-3 p-3 lg:flex-row">
      <Card className="h-min">
        <CardHeader>
          <CardTitle>Rodadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {rounds.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell
                    className="font-medium hover:bg-accent cursor-pointer"
                    onClick={() => redirect(`/admin/rounds/${row.id}`)}
                  >
                    {row.title}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="w-full flex-1">
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">{children}</CardContent>
      </Card>
      <Card className="w-full h-min shrink-0 lg:w-72">
        <CardHeader>
          <CardTitle>Classificação</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ranking.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {ranking.isError && <div>Erro: {ranking.error.message}</div>}

          {ranking.data?.length === 0 && <div>Ainda não há classificação</div>}

          {ranking.data !== undefined && ranking.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.data.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.userName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
