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
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { trpc } from "@/utils/trpc";

export default function Page() {
  const ranking = useQuery(trpc.ranking.getAll.queryOptions());

  return (
    <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Classificação</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ranking.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {ranking.isError && <div>Erro: {ranking.error.message}</div>}

          {ranking.data?.length === 0 && <div>Ainda não há classificação</div>}

          {ranking.data !== undefined && ranking.data.length > 0 && (
            <Table>
              <TableHeader className="hidden sm:table-header-group">
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.data.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="block p-3 sm:table-row sm:p-0"
                  >
                    <TableCell className="inline-block w-10 p-0 text-muted-foreground sm:table-cell sm:w-12 sm:p-2">
                      {index + 1}
                    </TableCell>
                    <TableCell className="inline-block max-w-[calc(100%-6rem)] whitespace-normal p-0 font-medium sm:table-cell sm:max-w-none sm:p-2">
                      {row.userName}
                    </TableCell>
                    <TableCell className="block p-0 pt-2 text-right font-semibold sm:table-cell sm:p-2">
                      {row.points} pts
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
