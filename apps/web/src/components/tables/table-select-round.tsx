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
    <Card className="w-full h-min shrink-0 lg:w-56">
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

  if (rounds.isFetched) {
    if (rounds?.data?.length) {
      return (
        <TableSelectRoundData
          data={rounds.data}
          onClick={onSelectRound}
          selectedRoundId={selectedRoundId}
        />
      );
    } else {
      <TableSelectRoundEmptyState />;
    }
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
    <Table>
      <TableBody>
        {data?.map((row) => (
          <TableRow key={row.id}>
            <TableCell
              className={cn(
                "font-medium cursor-pointer transition-colors",
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
  );
}

function TableSelectRoundEmptyState() {
  return <div>No data</div>;
}

function TableSelectRoundLoadingState() {
  return <div>Loading...</div>;
}

function TableSelectRoundErrorState() {
  return <div>Error</div>;
}
