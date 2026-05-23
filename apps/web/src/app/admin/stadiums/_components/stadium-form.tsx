"use client";

import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { Stadium } from "./types";

export function StadiumForm({
  stadium,
  onSaved,
  onCancel,
}: {
  stadium: Stadium | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(stadium?.name ?? "");
  const [city, setCity] = useState(stadium?.city ?? "");

  const createStadium = useMutation(
    trpc.stadium.create.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio cadastrado");
      },
    }),
  );

  const updateStadium = useMutation(
    trpc.stadium.update.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio atualizado");
      },
    }),
  );

  const isPending = createStadium.isPending || updateStadium.isPending;
  const error = createStadium.error ?? updateStadium.error;
  const trimmedName = name.trim();
  const trimmedCity = city.trim();
  const canSubmit = trimmedName.length > 0 && trimmedCity.length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      if (stadium) {
        await updateStadium.mutateAsync({
          stadiumId: stadium.id,
          name: trimmedName,
          city: trimmedCity,
        });
      } else {
        await createStadium.mutateAsync({
          name: trimmedName,
          city: trimmedCity,
        });
      }
      onSaved();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="stadium-name">Nome</Label>
        <Input
          id="stadium-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          maxLength={120}
          required
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="stadium-city">Cidade</Label>
        <Input
          id="stadium-city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={isPending}
          maxLength={120}
          required
        />
      </div>

      {error && <p className="text-xs text-destructive">{error.message}</p>}

      <AdminDialogFooter
        submitLabel={stadium ? "Salvar" : "Cadastrar"}
        isPending={isPending}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      />
    </form>
  );
}
