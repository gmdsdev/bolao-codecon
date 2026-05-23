"use client";

import { Button } from "@codecon/ui/components/button";
import { TableCell, TableRow } from "@codecon/ui/components/table";
import { Pencil, Trash2 } from "lucide-react";

import type { Stadium } from "./types";

export function StadiumRow({
  stadium,
  onEdit,
  onDelete,
}: {
  stadium: Stadium;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="block p-3 sm:table-row sm:p-0">
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">{stadium.name}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Cidade</span>
        <span className="break-words text-right sm:text-left">
          {stadium.city}
        </span>
      </TableCell>
      <TableCell className="block p-0 pt-3 text-right sm:table-cell sm:p-2">
        <div className="flex justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
