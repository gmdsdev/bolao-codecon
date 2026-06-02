"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { BetLogFilters } from "./bet-log-filters";
import { BetLogsPagination } from "./bet-logs-pagination";
import { BetLogsTable } from "./bet-logs-table";
import type { BetModifierFilter, MatchStatusFilter } from "./types";

const ALL_USERS = "all";

export function BetsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState(ALL_USERS);
  const [modifier, setModifier] = useState<BetModifierFilter>("all");
  const [matchStatus, setMatchStatus] = useState<MatchStatusFilter>("all");

  const users = useQuery(trpc.user.getAll.queryOptions());
  const userOptions = [...(users.data ?? [])].sort((userA, userB) => {
    const nameComparison = userA.name.localeCompare(userB.name, "pt-BR", {
      sensitivity: "base",
    });

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return userA.email.localeCompare(userB.email, "pt-BR", {
      sensitivity: "base",
    });
  });
  const betLogs = useQuery(
    trpc.bet.getLogs.queryOptions({
      page,
      userId: userId === ALL_USERS ? undefined : userId,
      modifier,
      matchStatus,
    }),
  );

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Apostas</CardTitle>
            <CardDescription>
              Acompanhe as apostas realizadas na plataforma.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <BetLogFilters
            users={userOptions}
            userId={userId}
            modifier={modifier}
            matchStatus={matchStatus}
            isDisabled={users.isLoading || betLogs.isLoading}
            onUserChange={(nextUserId) => {
              setUserId(nextUserId);
              resetPage();
            }}
            onModifierChange={(nextModifier) => {
              setModifier(nextModifier);
              resetPage();
            }}
            onMatchStatusChange={(nextMatchStatus) => {
              setMatchStatus(nextMatchStatus);
              resetPage();
            }}
            onClear={() => {
              setUserId(ALL_USERS);
              setModifier("all");
              setMatchStatus("all");
              resetPage();
            }}
          />

          <BetLogsTable
            data={betLogs.data}
            isLoading={betLogs.isLoading}
            errorMessage={betLogs.error?.message ?? users.error?.message}
          />

          <BetLogsPagination
            data={betLogs.data}
            isLoading={betLogs.isLoading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
