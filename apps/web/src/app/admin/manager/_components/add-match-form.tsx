"use client";

import { Checkbox } from "@codecon/ui/components/checkbox";
import { Label } from "@codecon/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import { MatchDateTimeField } from "./match-date-time-field";
import {
  datetimeLocalToIso,
  isValidDatetimeLocal,
} from "./match-utils";
import { StadiumSelectField } from "./stadium-select-field";
import { TeamSelectField } from "./team-select-field";
import type { Stadium, Team } from "./types";

export function AddMatchForm({
  roundId,
  teams,
  stadiums,
  onCreated,
  onCancel,
}: {
  roundId: number;
  teams: Team[];
  stadiums: Stadium[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [stadiumId, setStadiumId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const createMatch = useMutation(
    trpc.match.create.mutationOptions({
      onSuccess: () => {
        toast.success(isDraft ? "Rascunho salvo" : "Partida adicionada");
        setTeamAId("");
        setTeamBId("");
        setStadiumId("");
        setMatchDate("");
        setIsDraft(false);
        onCreated();
      },
    }),
  );

  const parsedTeamAId = Number(teamAId);
  const parsedTeamBId = Number(teamBId);
  const parsedStadiumId = Number(stadiumId);
  const hasTeamA = teamAId !== "" && Number.isInteger(parsedTeamAId);
  const hasTeamB = teamBId !== "" && Number.isInteger(parsedTeamBId);
  const hasDifferentTeams =
    !hasTeamA || !hasTeamB || parsedTeamAId !== parsedTeamBId;
  const canSubmit =
    Number.isInteger(parsedStadiumId) &&
    parsedStadiumId > 0 &&
    isValidDatetimeLocal(matchDate) &&
    hasDifferentTeams &&
    (isDraft ||
      (hasTeamA && hasTeamB && parsedTeamAId > 0 && parsedTeamBId > 0));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    createMatch.mutate({
      roundId,
      teamAId: hasTeamA ? parsedTeamAId : null,
      teamBId: hasTeamB ? parsedTeamBId : null,
      stadiumId: parsedStadiumId,
      date: datetimeLocalToIso(matchDate),
      status: isDraft ? "draft" : "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <TeamSelectField
          id={`team-a-${roundId}`}
          label="Time A"
          value={teamAId}
          teams={teams}
          allowEmpty={isDraft}
          disabled={createMatch.isPending}
          onChange={setTeamAId}
        />
        <TeamSelectField
          id={`team-b-${roundId}`}
          label="Time B"
          value={teamBId}
          teams={teams}
          allowEmpty={isDraft}
          disabled={createMatch.isPending}
          onChange={setTeamBId}
        />
      </div>

      <div className="flex items-start gap-2 rounded-none border border-border p-3">
        <Checkbox
          id={`draft-${roundId}`}
          checked={isDraft}
          onCheckedChange={(checked) => setIsDraft(checked === true)}
          disabled={createMatch.isPending}
        />
        <div className="grid gap-1">
          <Label htmlFor={`draft-${roundId}`}>Salvar como rascunho</Label>
          <p className="text-xs text-muted-foreground">
            Rascunhos ficam visíveis apenas para administradores.
          </p>
        </div>
      </div>

      <StadiumSelectField
        id={`stadium-${roundId}`}
        value={stadiumId}
        stadiums={stadiums}
        disabled={createMatch.isPending}
        onChange={setStadiumId}
      />

      <MatchDateTimeField
        id={`date-${roundId}`}
        value={matchDate}
        onChange={setMatchDate}
        disabled={createMatch.isPending}
      />

      {teams.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Adicione times antes de criar partidas.
        </p>
      )}

      {stadiums.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Adicione estádios antes de criar partidas.
        </p>
      )}

      {teamAId !== "" && teamAId === teamBId && (
        <p className="text-xs text-destructive">Escolha dois times diferentes.</p>
      )}

      {createMatch.isError && (
        <p className="text-xs text-destructive">{createMatch.error.message}</p>
      )}

      <AdminDialogFooter
        submitLabel={isDraft ? "Salvar rascunho" : "Adicionar partida"}
        isPending={createMatch.isPending}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      />
    </form>
  );
}
