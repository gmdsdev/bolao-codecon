"use client";

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
  const createMatch = useMutation(
    trpc.match.create.mutationOptions({
      onSuccess: () => {
        toast.success("Partida adicionada");
        setTeamAId("");
        setTeamBId("");
        setStadiumId("");
        setMatchDate("");
        onCreated();
      },
    }),
  );

  const parsedTeamAId = Number(teamAId);
  const parsedTeamBId = Number(teamBId);
  const parsedStadiumId = Number(stadiumId);
  const canSubmit =
    Number.isInteger(parsedTeamAId) &&
    Number.isInteger(parsedTeamBId) &&
    Number.isInteger(parsedStadiumId) &&
    parsedTeamAId > 0 &&
    parsedTeamBId > 0 &&
    parsedStadiumId > 0 &&
    isValidDatetimeLocal(matchDate) &&
    parsedTeamAId !== parsedTeamBId;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    createMatch.mutate({
      roundId,
      teamAId: parsedTeamAId,
      teamBId: parsedTeamBId,
      stadiumId: parsedStadiumId,
      date: datetimeLocalToIso(matchDate),
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
          disabled={createMatch.isPending}
          onChange={setTeamAId}
        />
        <TeamSelectField
          id={`team-b-${roundId}`}
          label="Time B"
          value={teamBId}
          teams={teams}
          disabled={createMatch.isPending}
          onChange={setTeamBId}
        />
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
        submitLabel="Adicionar partida"
        isPending={createMatch.isPending}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      />
    </form>
  );
}
