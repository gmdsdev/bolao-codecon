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
  TableRow,
} from "@codecon/ui/components/table";
import { cn } from "@codecon/ui/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

type Round = {
  id: number;
  title: string;
};

type OnSelectHandler = (round: Round) => void;

type TableSelectRoundProps = {
  rounds: UseQueryResult<Round[]>;
  onSelectRound: OnSelectHandler;
  selectedRoundId?: number;
};

export function TableSelectRound(props: TableSelectRoundProps) {
  return (
    <Card className="h-min w-full shrink-0 lg:w-56">
      <CardHeader>
        <CardTitle>Rodadas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TableSelectRoundContent {...props} />
      </CardContent>
    </Card>
  );
}

function TableSelectRoundContent({
  rounds,
  onSelectRound,
  selectedRoundId,
}: TableSelectRoundProps) {
  if (rounds.isLoading) {
    return <TableSelectRoundLoadingState />;
  }

  if (rounds.isError) {
    return <TableSelectRoundErrorState />;
  }

  if (rounds.data?.length) {
    return (
      <TableSelectRoundData
        data={rounds.data}
        onClick={onSelectRound}
        selectedRoundId={selectedRoundId}
      />
    );
  }

  if (rounds.isFetched) {
    return <TableSelectRoundEmptyState />;
  }

  return null;
}

function TableSelectRoundData({
  data,
  onClick,
  selectedRoundId,
}: {
  data: Round[];
  onClick: OnSelectHandler;
  selectedRoundId?: number;
}) {
  return (
    <>
      <div className="flex gap-1 overflow-x-auto p-2 lg:hidden">
        {data?.map((row) => (
          <button
            key={row.id}
            type="button"
            className={cn(
              "h-8 shrink-0 rounded border border-border px-2.5 text-xs font-medium transition-colors",
              row.id === selectedRoundId
                ? "bg-background text-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            onClick={() => onClick(row)}
          >
            {row.title}
          </button>
        ))}
      </div>
      <div className="hidden lg:block">
        <Table>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  className={cn(
                    "cursor-pointer font-medium transition-colors",
                    row.id === selectedRoundId
                      ? "bg-muted font-semibold"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => onClick(row)}
                >
                  {row.title}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function TableSelectRoundEmptyState() {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      Nenhuma rodada cadastrada.
    </div>
  );
}

function TableSelectRoundLoadingState() {
  return (
    <div className="flex justify-center py-4">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function TableSelectRoundErrorState() {
  return (
    <div className="py-6 text-center text-sm text-destructive">
      Erro ao carregar rodadas.
    </div>
  );
}
