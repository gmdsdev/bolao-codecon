"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@codecon/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { redirect, useParams } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams<{ id: string }>();
  const roundId = Number(params.id);

  const rounds = useQuery(trpc.round.getAll.queryOptions());

  if (!rounds.data?.length) {
    return <div>Nenhum dado</div>;
  }

  return (
    <div className="container mx-auto py-10 flex gap-4">
      <Tabs value={roundId} orientation="vertical">
        <TabsList>
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
