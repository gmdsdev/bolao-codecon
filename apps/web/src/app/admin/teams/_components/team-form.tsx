"use client";

import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import type { Team, TeamGroup } from "./types";

export function TeamForm({
  team,
  initialTeamGroupId,
  groups,
  onSaved,
  onCancel,
}: {
  team: Team | null;
  initialTeamGroupId: number | null;
  groups: TeamGroup[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [flag, setFlag] = useState(team?.flag ?? "");
  const [teamGroupId, setTeamGroupId] = useState(
    team
      ? String(team.teamGroupId)
      : initialTeamGroupId
        ? String(initialTeamGroupId)
        : "",
  );

  const createTeam = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: () => {
        toast.success("Time cadastrado");
      },
    }),
  );

  const updateTeam = useMutation(
    trpc.team.update.mutationOptions({
      onSuccess: () => {
        toast.success("Time atualizado");
      },
    }),
  );

  const parsedTeamGroupId = Number(teamGroupId);
  const groupOptions = groups.map((group) => ({
    value: String(group.id),
    label: group.name,
  }));
  const isPending = createTeam.isPending || updateTeam.isPending;
  const error = createTeam.error ?? updateTeam.error;
  const trimmedName = name.trim();
  const trimmedFlag = flag.trim();
  const canSubmit =
    trimmedName.length > 0 &&
    trimmedFlag.length > 0 &&
    Number.isInteger(parsedTeamGroupId) &&
    parsedTeamGroupId > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      if (team) {
        await updateTeam.mutateAsync({
          teamId: team.id,
          name: trimmedName,
          flag: trimmedFlag,
          teamGroupId: parsedTeamGroupId,
        });
      } else {
        await createTeam.mutateAsync({
          name: trimmedName,
          flag: trimmedFlag,
          teamGroupId: parsedTeamGroupId,
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
        <Label htmlFor="team-name">Nome</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          maxLength={120}
          required
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="team-flag">Bandeira</Label>
        <Input
          id="team-flag"
          value={flag}
          onChange={(event) => setFlag(event.target.value)}
          disabled={isPending}
          maxLength={20}
          required
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="team-group">Grupo</Label>
        <Select
          id="team-group"
          items={groupOptions}
          value={teamGroupId}
          onValueChange={(value) => setTeamGroupId(value ?? "")}
          disabled={isPending || groups.length === 0}
          required
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue
              className="min-w-0 truncate"
              placeholder="Selecione um grupo"
            />
          </SelectTrigger>
          <SelectContent align="start">
            {groups.map((group) => (
              <SelectItem key={group.id} value={String(group.id)}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre grupos antes de criar times.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error.message}</p>}

      <AdminDialogFooter
        submitLabel={team ? "Salvar" : "Cadastrar"}
        isPending={isPending}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      />
    </form>
  );
}
