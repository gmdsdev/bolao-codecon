"use client";

import { Button } from "@codecon/ui/components/button";
import { TableCell, TableRow } from "@codecon/ui/components/table";
import { Pencil, ShieldCheck, Trash2, User } from "lucide-react";

import type { ManagedUser } from "./types";

export function UserRow({
  user,
  currentUserId,
  onEdit,
  onDelete,
}: {
  user: ManagedUser;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canDelete = currentUserId !== undefined && user.id !== currentUserId;

  return (
    <TableRow className="block p-3 sm:table-row sm:p-0">
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">{user.name}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Email</span>
        <span className="break-all text-right sm:text-left">
          {user.email}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Perfil</span>
        {user.isAdmin ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <ShieldCheck className="size-3.5" />
            Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3.5" />
            Usuário
          </span>
        )}
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
          {canDelete ? (
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
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
