"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";

import {
  TableEmptyState,
  TableErrorState,
  TableLoadingState,
} from "@/components/tables/table-state";

import type { ManagedUser } from "./types";
import { UserRow } from "./user-row";

export function UsersTable({
  users,
  isLoading,
  errorMessage,
  currentUserId,
  onEdit,
  onDelete,
}: {
  users: ManagedUser[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  currentUserId?: string;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (users?.length === 0) {
    return <TableEmptyState>Nenhum usuário cadastrado.</TableEmptyState>;
  }

  if (users !== undefined && users.length > 0) {
    return (
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              onEdit={() => onEdit(user)}
              onDelete={() => onDelete(user)}
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  return <TableLoadingState />;
}
