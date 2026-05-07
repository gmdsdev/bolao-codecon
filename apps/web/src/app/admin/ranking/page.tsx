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
    <div className="min-h-[calc(100vh-2.5rem)] p-3">
      <Card>
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
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.data.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.userName}</TableCell>
                    <TableCell className="text-right font-semibold">
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
