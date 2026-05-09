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
import type { UseQueryResult } from "@tanstack/react-query";

type User = {
  id: number;
  userName: string;
  points: number;
};

type TableRankingProps = {
  ranking: UseQueryResult<User[]>;
};

export function TableRanking({ ranking }: TableRankingProps) {
  return (
    <Card className="w-full h-min shrink-0 lg:w-72">
      <CardHeader>
        <CardTitle>Classificação</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TableRankingContent ranking={ranking} />
      </CardContent>
    </Card>
  );
}

function TableRankingContent({ ranking }: TableRankingProps) {
  if (ranking.isLoading) {
    return <TableRankingLoadingState />;
  }

  if (ranking.isError) {
    return <TableRankingErrorState />;
  }

  if (ranking.isFetched) {
    if (ranking?.data?.length) {
      return <TableRankingData data={ranking.data} />;
    } else {
      <TableRankingEmptyState />;
    }
  }

  return null;
}

function TableRankingData({ data }: { data: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Participante</TableHead>
          <TableHead className="text-right">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow
            key={row.id}
            className="nth-[1]:text-green-300 nth-[2]:text-amber-300 nth-last-[3]:text-cyan-300"
          >
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">{row.userName}</TableCell>
            <TableCell className="text-right font-semibold">
              {row.points}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TableRankingEmptyState() {
  return <div>No data</div>;
}

function TableRankingLoadingState() {
  return <div>Loading...</div>;
}

function TableRankingErrorState() {
  return <div>Error</div>;
}
