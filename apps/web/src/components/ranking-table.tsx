"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { cn } from "@codecon/ui/lib/utils";

export type RankingTableUser = {
  id: number;
  userName: string;
  points: number;
};

type RankingTableProps<TUser extends RankingTableUser> = {
  ranking: TUser[];
  onSelectUser?: (user: TUser) => void;
};

export function getRankingPositionClassName(position: number) {
  if (position <= 3) {
    return "text-green-300";
  }

  return undefined;
}

export function RankingTable<TUser extends RankingTableUser>({
  ranking,
  onSelectUser,
}: RankingTableProps<TUser>) {
  const isInteractive = Boolean(onSelectUser);

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
        {ranking.map((row, index) => {
          const position = index + 1;

          return (
            <TableRow
              key={row.id}
              role={isInteractive ? "button" : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              aria-label={
                isInteractive
                  ? `Ver detalhes da pontuação de ${row.userName}`
                  : undefined
              }
              onClick={() => onSelectUser?.(row)}
              onKeyDown={(event) => {
                if (
                  !onSelectUser ||
                  (event.key !== "Enter" && event.key !== " ")
                ) {
                  return;
                }

                event.preventDefault();
                onSelectUser(row);
              }}
              className={cn(
                getRankingPositionClassName(position),
                isInteractive &&
                  "cursor-pointer hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
              )}
            >
              <TableCell className="text-muted-foreground">
                {position}
              </TableCell>
              <TableCell className="max-w-32 truncate font-medium">
                {row.userName}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {row.points}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
