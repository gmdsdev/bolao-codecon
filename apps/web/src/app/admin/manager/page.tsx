"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { TableSelectRound } from "@/components/tables/table-select-round";
import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";

type Round = {
  id: number;
  title: string;
  status: string;
};

type Match = {
  id: number;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
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
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const teams = useQuery(trpc.team.getAll.queryOptions());

  // Auto-seleciona a primeira rodada ao carregar
  useEffect(() => {
    if (rounds.data?.length && selectedRoundId === null) {
      setSelectedRoundId(rounds.data[0].id);
    }
  }, [rounds.data, selectedRoundId]);

  const selectedRound = rounds.data?.find((r) => r.id === selectedRoundId);

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
    <div className="flex min-h-[calc(100vh-2.5rem)] flex-col gap-3 p-3 lg:flex-row">
      <TableSelectRound
        rounds={rounds as never}
        selectedRoundId={selectedRoundId ?? undefined}
        onSelectRound={(round) => setSelectedRoundId(round.id)}
      />

      <div className="w-full flex-1">
        {selectedRound ? (
          <RoundMatches
            key={selectedRound.id}
            round={selectedRound}
            teams={teams.data ?? []}
            onRoundCompleted={rounds.refetch}
          />
        ) : (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            Selecione uma rodada para gerenciar as partidas.
          </div>
        )}
      </div>
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
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
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
    <Card>
      <CardHeader className="flex align-top justify-between">
        <div>
          <CardTitle>{round.title}</CardTitle>
          <CardDescription>
            Status: {isComplete ? "concluída" : round.status}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddMatchOpen(true)}
            >
              Adicionar partida
            </Button>
          )}
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
      </CardHeader>

      <CardContent className="p-0">
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

        {matches.data?.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma partida nesta rodada.
          </div>
        )}

        {matches.data !== undefined && matches.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partida</TableHead>
                <TableHead>Vencedor esperado</TableHead>
                <TableHead>Placar</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.data.map((match) => {
                const scoreLabel =
                  match.scoreA !== null && match.scoreB !== null
                    ? `${match.scoreA} - ${match.scoreB}`
                    : "-";

                return (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      <span>
                        {match.teamAFlag} {match.teamAName}
                      </span>
                      <span className="mx-1.5 text-muted-foreground">x</span>
                      <span>
                        {match.teamBName} {match.teamBFlag}
                      </span>
                    </TableCell>
                    <TableCell>
                      {match.expectedWinnerName ? (
                        <span>
                          {match.expectedWinnerName === match.teamAName
                            ? `${match.teamAFlag} ${match.teamAName}`
                            : `${match.teamBFlag} ${match.teamBName}`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{scoreLabel}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedMatch(match)}
                        disabled={isComplete}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={isAddMatchOpen} onOpenChange={setIsAddMatchOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar partida</DialogTitle>
              <DialogDescription>{round.title}</DialogDescription>
            </DialogHeader>
            <AddMatchForm
              roundId={round.id}
              teams={teams}
              onCancel={() => setIsAddMatchOpen(false)}
              onCreated={() => {
                matches.refetch();
                setIsAddMatchOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={selectedMatch !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMatch(null);
            }
          }}
        >
          {selectedMatch && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar partida</DialogTitle>
                <DialogDescription>
                  {selectedMatch.teamAFlag} {selectedMatch.teamAName} x{" "}
                  {selectedMatch.teamBName} {selectedMatch.teamBFlag}
                </DialogDescription>
              </DialogHeader>
              <MatchResultForm
                match={selectedMatch}
                onCancel={() => setSelectedMatch(null)}
                onSaved={() => {
                  matches.refetch();
                  setSelectedMatch(null);
                }}
                disabled={isComplete}
              />
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AddMatchForm({
  roundId,
  teams,
  onCreated,
  onCancel,
}: {
  roundId: number;
  teams: Team[];
  onCreated: () => void;
  onCancel: () => void;
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
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
        <p className="text-xs text-destructive">{createMatch.error.message}</p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createMatch.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit || createMatch.isPending}>
          {createMatch.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Adicionar partida"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MatchResultForm({
  match,
  onSaved,
  onCancel,
  disabled = false,
}: {
  match: Match;
  onSaved: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [scoreA, setScoreA] = useState(
    match.scoreA === null ? "0" : String(match.scoreA),
  );
  const [scoreB, setScoreB] = useState(
    match.scoreB === null ? "0" : String(match.scoreB),
  );
  const [expectedWinner, setExpectedWinner] = useState<ExpectedWinner | null>(
    () => {
      if (match.expectedWinnerName === match.teamAName) {
        return "teamA";
      }

      if (match.expectedWinnerName === match.teamBName) {
        return "teamB";
      }

      return null;
    },
  );

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
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Vencedor esperado</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={expectedWinner === "teamA" ? "default" : "outline"}
            onClick={() => setExpectedWinner("teamA")}
            disabled={disabled || updateResult.isPending}
          >
            {match.teamAFlag} {match.teamAName}
          </Button>
          <Button
            type="button"
            variant={expectedWinner === "teamB" ? "default" : "outline"}
            onClick={() => setExpectedWinner("teamB")}
            disabled={disabled || updateResult.isPending}
          >
            {match.teamBFlag} {match.teamBName}
          </Button>
        </div>
        {match.expectedWinnerName && (
          <p className="text-xs text-muted-foreground">
            Atual:{" "}
            {match.expectedWinnerName === match.teamAName
              ? `${match.teamAFlag} ${match.teamAName}`
              : `${match.teamBFlag} ${match.teamBName}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`score-a-${match.id}`}>
            {match.teamAFlag} {match.teamAName}
          </Label>
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
          <Label htmlFor={`score-b-${match.id}`}>
            {match.teamBFlag} {match.teamBName}
          </Label>
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
        <p className="text-xs text-destructive">{updateResult.error.message}</p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updateResult.isPending}
        >
          Cancelar
        </Button>
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
      </DialogFooter>
    </form>
  );
}
