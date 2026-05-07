"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@codecon/ui/components/item";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@codecon/ui/components/tabs";
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
      <Tabs value={roundId} orientation="vertical" className="shrink-0">
        <TabsList className="min-w-36">
          {rounds.data.map((round) => (
            <TabsTrigger
              key={round.id}
              value={round.id}
              onClick={() => redirect(`/admin/rounds/${round.id}`)}
            >
              {round.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card className="w-full flex-1">
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <Card className="w-full shrink-0 lg:w-72">
        <CardHeader>
          <CardTitle>Classificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {ranking.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {ranking.isError && <div>Erro: {ranking.error.message}</div>}

          {ranking.data?.length === 0 && <div>Ainda não há classificação</div>}

          {ranking.data?.map((row, index) => (
            <Item key={row.id} variant="outline" className="min-w-0">
              <ItemContent>
                <ItemTitle>
                  {index + 1}. {row.userName}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <span className="text-sm font-semibold">{row.points} pts</span>
              </ItemActions>
            </Item>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
