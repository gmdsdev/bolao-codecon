"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { Team } from "./types";

export function DeleteTeamForm({
  team,
  onDeleted,
  onCancel,
}: {
  team: Team;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const deleteTeam = useMutation(
    trpc.team.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Time excluído");
      },
    }),
  );

  const handleDelete = async () => {
    try {
      await deleteTeam.mutateAsync({ teamId: team.id });
      onDeleted();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      {deleteTeam.isError && (
        <p className="text-xs text-destructive">{deleteTeam.error.message}</p>
      )}

      <AdminDialogFooter
        submitType="button"
        submitVariant="destructive"
        submitLabel="Excluir time"
        isPending={deleteTeam.isPending}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
        onSubmit={handleDelete}
      />
    </div>
  );
}
