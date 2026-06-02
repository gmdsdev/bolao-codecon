"use client";

import { Button } from "@codecon/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { getUserErrorMessage } from "@/lib/error-message";
import { trpc } from "@/utils/trpc";

import { AdminDialogFooter } from "../../_components/admin-dialog-footer";
import { ExpectedWinnerField } from "./expected-winner-field";
import { MatchDateTimeField } from "./match-date-time-field";
import { MatchScoreFields } from "./match-score-fields";
import {
  datetimeLocalToIso,
  formatDatetimeLocal,
  isValidDatetimeLocal,
} from "./match-utils";
import { StadiumSelectField } from "./stadium-select-field";
import { TeamSelectField } from "./team-select-field";
import type { ExpectedWinner, Match, Stadium, Team } from "./types";

export function MatchResultForm({
  match,
  teams,
  stadiums,
  onSaved,
  onCancel,
}: {
  match: Match;
  teams: Team[];
  stadiums: Stadium[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [scoreA, setScoreA] = useState(
    match.scoreA === null ? "" : String(match.scoreA),
  );
  const [scoreB, setScoreB] = useState(
    match.scoreB === null ? "" : String(match.scoreB),
  );
  const [teamAId, setTeamAId] = useState(
    match.teamAId === null ? "" : String(match.teamAId),
  );
  const [teamBId, setTeamBId] = useState(
    match.teamBId === null ? "" : String(match.teamBId),
  );
  const [stadiumId, setStadiumId] = useState(String(match.stadiumId));
  const [matchDate, setMatchDate] = useState(formatDatetimeLocal(match.date));
  const [expectedWinner, setExpectedWinner] = useState<ExpectedWinner | null>(
    () => {
      if (match.expectedWinnerName === match.teamAName) return "teamA";
      if (match.expectedWinnerName === match.teamBName) return "teamB";
      return null;
    },
  );
  const [pendingAction, setPendingAction] = useState<"save" | "complete" | null>(
    null,
  );
  const [isDraft, setIsDraft] = useState(match.status === "draft");
  const isComplete = match.status === "complete";
  const scoreAInputRef = useRef<HTMLInputElement>(null);

  const updateResult = useMutation(trpc.match.updateResult.mutationOptions());

  const completeMatch = useMutation(
    trpc.match.complete.mutationOptions({
      onSuccess: ({ awardedUsers, betsFound, bracketUpdated }) => {
        toast.success(
          `Partida concluída — ${betsFound} aposta(s), ${awardedUsers} usuário(s) pontuado(s)${
            bracketUpdated ? ", chaveamento atualizado" : ""
          }`,
        );
      },
      onError: (err) => {
        toast.error(getUserErrorMessage(err));
      },
    }),
  );

  const parsedStadiumId = Number(stadiumId);
  const parsedTeamAId = Number(teamAId);
  const parsedTeamBId = Number(teamBId);
  const scoreAValue = parseScore(scoreA);
  const scoreBValue = parseScore(scoreB);
  const hasTeamA = teamAId !== "" && Number.isInteger(parsedTeamAId);
  const hasTeamB = teamBId !== "" && Number.isInteger(parsedTeamBId);
  const hasDifferentTeams =
    !hasTeamA || !hasTeamB || parsedTeamAId !== parsedTeamBId;
  const scoresAreBlank = scoreA.trim() === "" && scoreB.trim() === "";
  const scoresAreValid = scoreAValue !== null && scoreBValue !== null;
  const scoreFieldsAreValid = scoresAreBlank || scoresAreValid;
  const expectedWinnerIsValid =
    expectedWinner === null ||
    (expectedWinner === "teamA" && hasTeamA) ||
    (expectedWinner === "teamB" && hasTeamB);
  const canSave =
    !isComplete &&
    Number.isInteger(parsedStadiumId) &&
    parsedStadiumId > 0 &&
    isValidDatetimeLocal(matchDate) &&
    hasDifferentTeams &&
    scoreFieldsAreValid &&
    expectedWinnerIsValid;
  const canPublish =
    canSave &&
    hasTeamA &&
    hasTeamB &&
    parsedTeamAId > 0 &&
    parsedTeamBId > 0 &&
    parsedTeamAId !== parsedTeamBId;
  const canComplete = canSave && !isDraft && scoresAreValid;

  const isPending = updateResult.isPending || completeMatch.isPending;

  useEffect(() => {
    if (isComplete || isDraft) return;

    const frameId = requestAnimationFrame(() => {
      scoreAInputRef.current?.focus();
      scoreAInputRef.current?.select();
    });

    return () => cancelAnimationFrame(frameId);
  }, [isComplete, isDraft, match.id]);

  useEffect(() => {
    if (expectedWinner === "teamA" && !hasTeamA) setExpectedWinner(null);
    if (expectedWinner === "teamB" && !hasTeamB) setExpectedWinner(null);
  }, [expectedWinner, hasTeamA, hasTeamB]);

  const getResultPayload = (status: "draft" | "pending") => {
    if (!canSave) return null;

    return {
      matchId: match.id,
      teamAId: hasTeamA ? parsedTeamAId : null,
      teamBId: hasTeamB ? parsedTeamBId : null,
      scoreA: scoresAreBlank ? null : scoreAValue,
      scoreB: scoresAreBlank ? null : scoreBValue,
      stadiumId: parsedStadiumId,
      date: datetimeLocalToIso(matchDate),
      expectedWinner,
      status,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = getResultPayload(isDraft ? "draft" : "pending");
    if (!payload) return;

    setPendingAction("save");
    try {
      await updateResult.mutateAsync(payload);
      toast.success("Partida atualizada");
      onSaved();
    } catch {
      // The mutation state renders the inline error message.
    } finally {
      setPendingAction(null);
    }
  };

  const handlePublish = async () => {
    const payload = getResultPayload("pending");
    if (!payload || !canPublish) return;

    setPendingAction("save");
    try {
      await updateResult.mutateAsync(payload);
      setIsDraft(false);
      toast.success("Partida publicada");
      onSaved();
    } catch {
      // The mutation state renders the inline error message.
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveAndComplete = async () => {
    const payload = getResultPayload("pending");
    if (!payload || !canComplete) return;

    setPendingAction("complete");
    try {
      await updateResult.mutateAsync(payload);
      await completeMatch.mutateAsync({ matchId: match.id });
      onSaved();
    } catch {
      // Mutation callbacks and state surface the error to the user.
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <TeamSelectField
          id={`team-a-result-${match.id}`}
          label="Time A"
          value={teamAId}
          teams={teams}
          allowEmpty={isDraft}
          disabled={isPending || isComplete}
          onChange={setTeamAId}
        />
        <TeamSelectField
          id={`team-b-result-${match.id}`}
          label="Time B"
          value={teamBId}
          teams={teams}
          allowEmpty={isDraft}
          disabled={isPending || isComplete}
          onChange={setTeamBId}
        />
      </div>
      <ExpectedWinnerField
        match={{
          ...match,
          teamAId: hasTeamA ? parsedTeamAId : null,
          teamBId: hasTeamB ? parsedTeamBId : null,
          teamAName:
            teams.find((team) => team.id === parsedTeamAId)?.name ??
            match.teamAName,
          teamAFlag:
            teams.find((team) => team.id === parsedTeamAId)?.flag ??
            match.teamAFlag,
          teamBName:
            teams.find((team) => team.id === parsedTeamBId)?.name ??
            match.teamBName,
          teamBFlag:
            teams.find((team) => team.id === parsedTeamBId)?.flag ??
            match.teamBFlag,
        }}
        value={expectedWinner}
        disabled={isPending || isComplete}
        onChange={setExpectedWinner}
      />
      <StadiumSelectField
        id={`stadium-result-${match.id}`}
        value={stadiumId}
        stadiums={stadiums}
        disabled={isPending || isComplete}
        onChange={setStadiumId}
      />
      <MatchDateTimeField
        id={`date-result-${match.id}`}
        value={matchDate}
        onChange={setMatchDate}
        disabled={isPending || isComplete}
      />
      {!isDraft && (
        <MatchScoreFields
          match={{
            ...match,
            teamAName:
              teams.find((team) => team.id === parsedTeamAId)?.name ??
              match.teamAName,
            teamAFlag:
              teams.find((team) => team.id === parsedTeamAId)?.flag ??
              match.teamAFlag,
            teamBName:
              teams.find((team) => team.id === parsedTeamBId)?.name ??
              match.teamBName,
            teamBFlag:
              teams.find((team) => team.id === parsedTeamBId)?.flag ??
              match.teamBFlag,
          }}
          scoreA={scoreA}
          scoreB={scoreB}
          disabled={isPending || isComplete}
          scoreAInputRef={scoreAInputRef}
          onScoreAChange={setScoreA}
          onScoreBChange={setScoreB}
        />
      )}

      {isDraft && (
        <p className="text-xs text-muted-foreground">
          Rascunhos podem ser salvos sem times definidos e não aceitam conclusão.
        </p>
      )}

      {isComplete && (
        <p className="text-xs text-muted-foreground">
          Esta partida já foi concluída e não pode ser editada.
        </p>
      )}

      {updateResult.isError && (
        <p className="text-xs text-destructive">
          {getUserErrorMessage(updateResult.error)}
        </p>
      )}

      <AdminDialogFooter
        submitLabel={isDraft ? "Salvar rascunho" : "Salvar"}
        isPending={isPending}
        submitPending={pendingAction === "save"}
        canSubmit={canSave}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      >
        {isDraft ? (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish || isPending}
          >
            Publicar
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSaveAndComplete}
            disabled={!canComplete || isPending}
          >
            {pendingAction === "complete" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Salvar e Concluir"
            )}
          </Button>
        )}
      </AdminDialogFooter>
    </form>
  );
}

function parseScore(value: string) {
  if (value.trim() === "") return null;

  const score = Number(value);

  return Number.isInteger(score) && score >= 0 && score <= 99 ? score : null;
}
