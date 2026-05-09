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
import type { UseQueryResult } from "@tanstack/react-query";

type Round = {
  id: number;
  title: string;
};

type OnSelectHandler = (round: Round) => void;

type TableSelectRoundProps = {
  rounds: UseQueryResult<Round[]>;
  onSelectRound: OnSelectHandler;
};

export function TableSelectRound(props: TableSelectRoundProps) {
  return (
    <Card className="h-min">
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
        <TableSelectRoundData data={rounds.data} onClick={onSelectRound} />
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
}: {
  data: Round[];
  onClick: OnSelectHandler;
}) {
  return (
    <Table>
      <TableBody>
        {data?.map((row) => (
          <TableRow key={row.id}>
            <TableCell
              className="font-medium hover:bg-accent cursor-pointer"
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
