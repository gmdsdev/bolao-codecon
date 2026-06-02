"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { DeleteUserForm } from "./delete-user-form";
import type { ManagedUser } from "./types";
import { UserForm } from "./user-form";
import { UsersTable } from "./users-table";

export function UsersPage() {
  const users = useQuery(trpc.user.getAll.queryOptions());
  const { data: session } = authClient.useSession();
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const closeEditForm = () => {
    setSelectedUser(null);
  };

  const handleSaved = () => {
    users.refetch();
    closeEditForm();
  };

  const handleDeleted = () => {
    users.refetch();
    setUserToDelete(null);
  };

  return (
    <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Gerencie nome, senha e acesso dos usuários cadastrados.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <UsersTable
            users={users.data}
            isLoading={users.isLoading}
            errorMessage={users.error?.message}
            currentUserId={session?.user.id}
            onEdit={setSelectedUser}
            onDelete={setUserToDelete}
          />
        </CardContent>
      </Card>

      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) closeEditForm();
        }}
      >
        {selectedUser && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar usuário</DialogTitle>
              <DialogDescription>
                Atualize o nome ou defina uma nova senha para{" "}
                {selectedUser.email}.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              key={selectedUser.id}
              user={selectedUser}
              onCancel={closeEditForm}
              onSaved={handleSaved}
            />
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={userToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        {userToDelete && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir usuário</DialogTitle>
              <DialogDescription>
                Esta ação remove {userToDelete.name} e todos os dados
                vinculados a esta conta, incluindo apostas e pontuação.
              </DialogDescription>
            </DialogHeader>
            <DeleteUserForm
              user={userToDelete}
              onCancel={() => setUserToDelete(null)}
              onDeleted={handleDeleted}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
