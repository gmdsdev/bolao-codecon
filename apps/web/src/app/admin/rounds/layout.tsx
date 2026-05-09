"use client";

import { useQuery } from "@tanstack/react-query";

import { TableRanking } from "@/components/tables/table-ranking";
import { TableSelectRound } from "@/components/tables/table-select-round";
import { trpc } from "@/utils/trpc";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const ranking = useQuery(trpc.ranking.getAll.queryOptions());

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col gap-3 p-3 lg:flex-row">
      <TableSelectRound
        rounds={rounds as never}
        onSelectRound={(round) => {
          redirect(`/admin/rounds/${round.id}`);
        }}
      />
      <div className="w-full flex-1">{children}</div>
      <TableRanking ranking={ranking as never} />
    </div>
  );
}
