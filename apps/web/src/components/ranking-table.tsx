"use client";

import {
  Table,
  TableBody,
  TableCell,
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
    return "text-white";
  }

  return "text-muted-foreground";
}

export function RankingTable<TUser extends RankingTableUser>({
  ranking,
  onSelectUser,
}: RankingTableProps<TUser>) {
  const isInteractive = Boolean(onSelectUser);

  return (
    <Table>
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
              <TableCell className="w-10">#{position}</TableCell>
              <TableCell className="max-w-32 truncate font-medium">
                {row.userName}
              </TableCell>
              <TableCell className="text-right font-semibold">
                <span>{row.points}</span>{" "}
                <span className="text-[10px] font-medium text-muted-foreground">
                  pts
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
