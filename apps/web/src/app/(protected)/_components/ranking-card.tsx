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

import type { ProtectedHomePageData } from "./protected-home-page-data";

type RankingCardProps = {
  ranking: ProtectedHomePageData["ranking"];
};

export function RankingCard({ ranking }: RankingCardProps) {
  return (
    <Card className="h-min w-full shrink-0 lg:w-72">
      <CardHeader>
        <CardTitle>Classificação</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {ranking.length ? <RankingTable ranking={ranking} /> : <div>No data</div>}
      </CardContent>
    </Card>
  );
}

function RankingTable({ ranking }: RankingCardProps) {
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
        {ranking.map((row, index) => (
          <TableRow
            key={row.id}
            className="nth-[1]:text-amber-300 nth-[2]:text-green-300 nth-[3]:text-blue-300"
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
