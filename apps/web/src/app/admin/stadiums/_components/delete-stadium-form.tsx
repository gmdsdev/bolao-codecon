"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getUserErrorMessage } from "@/lib/error-message";
import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { Stadium } from "./types";

export function DeleteStadiumForm({
  stadium,
  onDeleted,
  onCancel,
}: {
  stadium: Stadium;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const deleteStadium = useMutation(
    trpc.stadium.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio excluído");
      },
    }),
  );

  const handleDelete = async () => {
    try {
      await deleteStadium.mutateAsync({ stadiumId: stadium.id });
      onDeleted();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      {deleteStadium.isError && (
        <p className="text-xs text-destructive">
          {getUserErrorMessage(deleteStadium.error)}
        </p>
      )}

      <AdminDialogFooter
        submitType="button"
        submitVariant="destructive"
        submitLabel="Excluir estádio"
        isPending={deleteStadium.isPending}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
        onSubmit={handleDelete}
      />
    </div>
  );
}
