"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@codecon/ui/components/item";
import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Round = {
  id: number;
  title: string;
  status: string;
};

type Match = {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  expectedWinnerName: string | null;
};

type Team = {
  id: number;
  name: string;
};

type ExpectedWinner = "teamA" | "teamB";

export default function Page() {
  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const teams = useQuery(trpc.team.getAll.queryOptions());

  if (rounds.isLoading || teams.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (rounds.isError) {
    return <div>Erro: {rounds.error.message}</div>;
  }

  if (teams.isError) {
    return <div>Erro: {teams.error.message}</div>;
  }

  if (!rounds.data?.length) {
    return <div>Nenhum dado</div>;
  }

  return (
    <div className="grid min-h-[calc(100vh-2.5rem)] gap-3 p-3">
      {rounds.data.map((round) => (
        <RoundMatches
          key={round.id}
          round={round}
          teams={teams.data ?? []}
          onRoundCompleted={rounds.refetch}
        />
      ))}
    </div>
  );
}

function RoundMatches({
  round,
  teams,
  onRoundCompleted,
}: {
  round: Round;
  teams: Team[];
  onRoundCompleted: () => void;
}) {
  const matches = useQuery(
    trpc.match.getByRound.queryOptions({
      roundId: round.id,
    }),
  );
  const completeRound = useMutation(
    trpc.round.complete.mutationOptions({
      onSuccess: () => {
        toast.success("Rodada concluída");
        onRoundCompleted();
        matches.refetch();
      },
    }),
  );

  const isComplete = round.status === "complete";
  const canComplete =
    !isComplete &&
    matches.data !== undefined &&
    matches.data.length > 0 &&
    matches.data.every((match) => {
      return (
        match.scoreA !== null &&
        match.scoreB !== null &&
        match.expectedWinnerName !== null
      );
    });

  const handleCompleteRound = () => {
    if (!canComplete) {
      return;
    }

    completeRound.mutate({
      roundId: round.id,
    });
  };

  return (
    <section className="grid gap-3 rounded border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-semibold">{round.title}</h2>
          <p className="text-xs text-muted-foreground">
            Status: {isComplete ? "concluída" : round.status}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleCompleteRound}
          disabled={!canComplete || completeRound.isPending}
        >
          {completeRound.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isComplete ? (
            "Concluída"
          ) : (
            "Concluir rodada"
          )}
        </Button>
      </div>

      {!isComplete && (
        <AddMatchForm
          roundId={round.id}
          teams={teams}
          onCreated={matches.refetch}
        />
      )}

      {matches.isLoading && (
        <div className="flex justify-center border py-4">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {matches.isError && <div>Erro: {matches.error.message}</div>}
      {completeRound.isError && (
        <div className="text-xs text-destructive">
          {completeRound.error.message}
        </div>
      )}

      {matches.data?.length === 0 && <div>Nenhuma partida encontrada</div>}

      {matches.data?.map((match) => (
        <MatchResultForm
          key={match.id}
          match={match}
          onSaved={matches.refetch}
          disabled={isComplete}
        />
      ))}
    </section>
  );
}

function AddMatchForm({
  roundId,
  teams,
  onCreated,
}: {
  roundId: number;
  teams: Team[];
  onCreated: () => void;
}) {
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const createMatch = useMutation(
    trpc.match.create.mutationOptions({
      onSuccess: () => {
        toast.success("Partida adicionada");
        setTeamAId("");
        setTeamBId("");
        onCreated();
      },
    }),
  );

  const parsedTeamAId = Number(teamAId);
  const parsedTeamBId = Number(teamBId);
  const canSubmit =
    Number.isInteger(parsedTeamAId) &&
    Number.isInteger(parsedTeamBId) &&
    parsedTeamAId > 0 &&
    parsedTeamBId > 0 &&
    parsedTeamAId !== parsedTeamBId;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    createMatch.mutate({
      roundId,
      teamAId: parsedTeamAId,
      teamBId: parsedTeamBId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar partida</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor={`team-a-${roundId}`}>Time A</Label>
              <select
                id={`team-a-${roundId}`}
                value={teamAId}
                onChange={(event) => setTeamAId(event.target.value)}
                disabled={createMatch.isPending || teams.length === 0}
                className="h-8 w-full min-w-0 rounded border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
                required
              >
                <option value="">Selecione um time</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`team-b-${roundId}`}>Time B</Label>
              <select
                id={`team-b-${roundId}`}
                value={teamBId}
                onChange={(event) => setTeamBId(event.target.value)}
                disabled={createMatch.isPending || teams.length === 0}
                className="h-8 w-full min-w-0 rounded border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
                required
              >
                <option value="">Selecione um time</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              disabled={!canSubmit || createMatch.isPending}
            >
              {createMatch.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Adicionar partida"
              )}
            </Button>
          </div>

          {teams.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Adicione times antes de criar partidas.
            </p>
          )}

          {teamAId !== "" && teamAId === teamBId && (
            <p className="text-xs text-destructive">
              Escolha dois times diferentes.
            </p>
          )}

          {createMatch.isError && (
            <p className="text-xs text-destructive">
              {createMatch.error.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function MatchResultForm({
  match,
  onSaved,
  disabled = false,
}: {
  match: Match;
  onSaved: () => void;
  disabled?: boolean;
}) {
  const [scoreA, setScoreA] = useState(
    match.scoreA === null ? "" : String(match.scoreA),
  );
  const [scoreB, setScoreB] = useState(
    match.scoreB === null ? "" : String(match.scoreB),
  );
  const [expectedWinner, setExpectedWinner] =
    useState<ExpectedWinner | null>(() => {
      if (match.expectedWinnerName === match.teamAName) {
        return "teamA";
      }

      if (match.expectedWinnerName === match.teamBName) {
        return "teamB";
      }

      return null;
    });

  const updateResult = useMutation(
    trpc.match.updateResult.mutationOptions({
      onSuccess: () => {
        toast.success("Partida atualizada");
        onSaved();
      },
    }),
  );

  const canSubmit =
    expectedWinner !== null &&
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number(scoreA) >= 0 &&
    Number(scoreB) >= 0 &&
    Number.isInteger(Number(scoreA)) &&
    Number.isInteger(Number(scoreB));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || expectedWinner === null) {
      return;
    }

    updateResult.mutate({
      matchId: match.id,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      expectedWinner,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {match.teamAName} x {match.teamBName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Vencedor esperado</ItemTitle>
              {match.expectedWinnerName && (
                <p className="text-xs text-muted-foreground">
                  Atual: {match.expectedWinnerName}
                </p>
              )}
            </ItemContent>
            <ItemActions>
              <Button
                type="button"
                variant={expectedWinner === "teamA" ? "default" : "outline"}
                onClick={() => setExpectedWinner("teamA")}
                disabled={disabled || updateResult.isPending}
              >
                {match.teamAName}
              </Button>
              <Button
                type="button"
                variant={expectedWinner === "teamB" ? "default" : "outline"}
                onClick={() => setExpectedWinner("teamB")}
                disabled={disabled || updateResult.isPending}
              >
                {match.teamBName}
              </Button>
            </ItemActions>
          </Item>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`score-a-${match.id}`}>{match.teamAName}</Label>
              <Input
                id={`score-a-${match.id}`}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={scoreA}
                onChange={(event) => setScoreA(event.target.value)}
                disabled={disabled || updateResult.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`score-b-${match.id}`}>{match.teamBName}</Label>
              <Input
                id={`score-b-${match.id}`}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={scoreB}
                onChange={(event) => setScoreB(event.target.value)}
                disabled={disabled || updateResult.isPending}
                required
              />
            </div>
          </div>

          {updateResult.isError && (
            <p className="text-xs text-destructive">
              {updateResult.error.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={disabled || !canSubmit || updateResult.isPending}
            >
              {updateResult.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Salvar partida"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
