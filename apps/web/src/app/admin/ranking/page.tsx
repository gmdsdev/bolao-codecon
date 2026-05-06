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
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { trpc } from "@/utils/trpc";

export default function Page() {
  const ranking = useQuery(trpc.ranking.getAll.queryOptions());

  return (
    <div className="container mx-auto py-10">
      <Card>
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
            <Item key={row.id} variant="outline">
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
