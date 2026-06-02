"use client";

import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { ManagedUser } from "./types";

export function UserForm({
  user,
  onSaved,
  onCancel,
}: {
  user: ManagedUser;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");

  const updateUser = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        toast.success("Usuário atualizado");
      },
    }),
  );

  const trimmedName = name.trim();
  const canSubmit =
    trimmedName.length >= 2 &&
    (password.length === 0 || (password.length >= 8 && password.length <= 128));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await updateUser.mutateAsync({
        userId: user.id,
        name: trimmedName,
        password: password.length > 0 ? password : undefined,
      });
      onSaved();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="user-name">Nome</Label>
        <Input
          id="user-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={updateUser.isPending}
          maxLength={120}
          required
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="user-password">Nova senha</Label>
        <Input
          id="user-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={updateUser.isPending}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="Deixe em branco para manter a senha atual"
        />
      </div>

      {password.length > 0 && password.length < 8 ? (
        <p className="text-xs text-muted-foreground">
          A senha deve ter pelo menos 8 caracteres.
        </p>
      ) : null}

      {updateUser.isError && (
        <p className="text-xs text-destructive">{updateUser.error.message}</p>
      )}

      <AdminDialogFooter
        submitLabel="Salvar"
        isPending={updateUser.isPending}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      />
    </form>
  );
}
