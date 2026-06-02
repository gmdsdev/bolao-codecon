"use client";

import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getUserErrorMessage } from "@/lib/error-message";
import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { ManagedUser } from "./types";

export function DeleteUserForm({
  user,
  onDeleted,
  onCancel,
}: {
  user: ManagedUser;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const deleteUser = useMutation(
    trpc.user.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Usuário excluído");
      },
    }),
  );

  const isConfirmed =
    confirmationEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) {
      toast.error("Digite o email do usuário para confirmar");
      return;
    }

    try {
      await deleteUser.mutateAsync({ userId: user.id });
      onDeleted();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="delete-user-email">Confirme o email</Label>
        <Input
          id="delete-user-email"
          type="email"
          value={confirmationEmail}
          onChange={(event) => setConfirmationEmail(event.target.value)}
          disabled={deleteUser.isPending}
          placeholder={user.email}
        />
      </div>

      {deleteUser.isError && (
        <p className="text-xs text-destructive">
          {getUserErrorMessage(deleteUser.error)}
        </p>
      )}

      <AdminDialogFooter
        submitType="button"
        submitVariant="destructive"
        submitLabel="Excluir usuário"
        isPending={deleteUser.isPending}
        canSubmit={isConfirmed}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
        onSubmit={handleDelete}
      />
    </div>
  );
}
