"use client";

import { Button } from "@codecon/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

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
import type { ExpectedWinner, Match, Stadium } from "./types";

export function MatchResultForm({
  match,
  stadiums,
  onSaved,
  onCancel,
}: {
  match: Match;
  stadiums: Stadium[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [scoreA, setScoreA] = useState(
    match.scoreA === null ? "0" : String(match.scoreA),
  );
  const [scoreB, setScoreB] = useState(
    match.scoreB === null ? "0" : String(match.scoreB),
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

  const updateResult = useMutation(trpc.match.updateResult.mutationOptions());

  const completeMatch = useMutation(
    trpc.match.complete.mutationOptions({
      onSuccess: ({ awardedUsers, betsFound }) => {
        toast.success(
          `Partida concluída — ${betsFound} aposta(s) encontrada(s), ${awardedUsers} usuário(s) pontuado(s)`,
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const parsedStadiumId = Number(stadiumId);
  const canSubmit =
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number.isInteger(parsedStadiumId) &&
    Number(scoreA) >= 0 &&
    Number(scoreB) >= 0 &&
    parsedStadiumId > 0 &&
    isValidDatetimeLocal(matchDate) &&
    Number.isInteger(Number(scoreA)) &&
    Number.isInteger(Number(scoreB));

  const isPending = updateResult.isPending || completeMatch.isPending;

  const getResultPayload = () => {
    if (!canSubmit) return null;

    return {
      matchId: match.id,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      stadiumId: parsedStadiumId,
      date: datetimeLocalToIso(matchDate),
      expectedWinner,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = getResultPayload();
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

  const handleSaveAndComplete = async () => {
    const payload = getResultPayload();
    if (!payload) return;

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
      <ExpectedWinnerField
        match={match}
        value={expectedWinner}
        disabled={isPending}
        onChange={setExpectedWinner}
      />
      <StadiumSelectField
        id={`stadium-result-${match.id}`}
        value={stadiumId}
        stadiums={stadiums}
        disabled={isPending}
        onChange={setStadiumId}
      />
      <MatchDateTimeField
        id={`date-result-${match.id}`}
        value={matchDate}
        onChange={setMatchDate}
        disabled={isPending}
      />
      <MatchScoreFields
        match={match}
        scoreA={scoreA}
        scoreB={scoreB}
        disabled={isPending}
        onScoreAChange={setScoreA}
        onScoreBChange={setScoreB}
      />

      {updateResult.isError && (
        <p className="text-xs text-destructive">{updateResult.error.message}</p>
      )}

      <AdminDialogFooter
        submitLabel="Salvar"
        isPending={isPending}
        submitPending={pendingAction === "save"}
        canSubmit={canSubmit}
        pendingContent={<Loader2 className="size-4 animate-spin" />}
        onCancel={onCancel}
      >
        <Button
          type="button"
          onClick={handleSaveAndComplete}
          disabled={!canSubmit || isPending}
        >
          {pendingAction === "complete" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Salvar e Concluir"
          )}
        </Button>
      </AdminDialogFooter>
    </form>
  );
}
