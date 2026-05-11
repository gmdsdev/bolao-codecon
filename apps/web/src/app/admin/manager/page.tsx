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
import { CheckCircle2, Loader2 } from "lucide-react";
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
  status: string;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
  scoreA: number | null;
  scoreB: number | null;
  expectedWinnerName: string | null;
  totalBets: number;
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
}: {
  round: Round;
  teams: Team[];
}) {
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const matches = useQuery(
    trpc.match.getByRound.queryOptions({ roundId: round.id }),
  );

  const isRoundComplete = round.status === "complete";

  return (
    <Card>
      <CardHeader className="flex align-top justify-between">
        <div>
          <CardTitle>{round.title}</CardTitle>
          <CardDescription>
            Status: {isRoundComplete ? "concluída" : round.status}
          </CardDescription>
        </div>
        {!isRoundComplete && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddMatchOpen(true)}
          >
            Adicionar partida
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {matches.isLoading && (
          <div className="flex justify-center border py-4">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {matches.isError && <div>Erro: {matches.error.message}</div>}

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
                <TableHead>Apostas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.data.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  roundComplete={isRoundComplete}
                  onEdit={() => setSelectedMatch(match)}
                  onCompleted={matches.refetch}
                />
              ))}
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
            if (!open) setSelectedMatch(null);
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
              />
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MatchRow({
  match,
  roundComplete,
  onEdit,
  onCompleted,
}: {
  match: Match;
  roundComplete: boolean;
  onEdit: () => void;
  onCompleted: () => void;
}) {
  const completeMatch = useMutation(
    trpc.match.complete.mutationOptions({
      onSuccess: ({ awardedUsers, betsFound }) => {
        toast.success(
          `Partida concluída — ${betsFound} aposta(s) encontrada(s), ${awardedUsers} usuário(s) pontuado(s)`,
        );
        onCompleted();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const isComplete = match.status === "complete";
  const hasResult =
    match.scoreA !== null &&
    match.scoreB !== null &&
    match.expectedWinnerName !== null;

  const scoreLabel =
    match.scoreA !== null && match.scoreB !== null
      ? `${match.scoreA} - ${match.scoreB}`
      : "-";

  const expectedWinnerLabel = match.expectedWinnerName
    ? match.expectedWinnerName === match.teamAName
      ? `${match.teamAFlag} ${match.teamAName}`
      : `${match.teamBFlag} ${match.teamBName}`
    : "-";

  return (
    <TableRow className={isComplete ? "opacity-60" : undefined}>
      <TableCell className="font-medium">
        <span>
          {match.teamAFlag} {match.teamAName}
        </span>
        <span className="mx-1.5 text-muted-foreground">x</span>
        <span>
          {match.teamBName} {match.teamBFlag}
        </span>
      </TableCell>
      <TableCell>{expectedWinnerLabel}</TableCell>
      <TableCell>{scoreLabel}</TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">{match.totalBets ?? 0}</span>
      </TableCell>
      <TableCell>
        {isComplete ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="size-3.5" />
            Concluída
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Pendente</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isComplete || roundComplete}
          >
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => completeMatch.mutate({ matchId: match.id })}
            disabled={
              isComplete ||
              roundComplete ||
              !hasResult ||
              completeMatch.isPending
            }
            title={
              !hasResult
                ? "Preencha placar e vencedor esperado antes de concluir"
                : undefined
            }
          >
            {completeMatch.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Concluir"
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
    if (!canSubmit) return;
    createMatch.mutate({ roundId, teamAId: parsedTeamAId, teamBId: parsedTeamBId });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`team-a-${roundId}`}>Time A</Label>
          <select
            id={`team-a-${roundId}`}
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            disabled={createMatch.isPending || teams.length === 0}
            className="h-8 w-full min-w-0 rounded border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
            required
          >
            <option value="">Selecione um time</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`team-b-${roundId}`}>Time B</Label>
          <select
            id={`team-b-${roundId}`}
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            disabled={createMatch.isPending || teams.length === 0}
            className="h-8 w-full min-w-0 rounded border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50"
            required
          >
            <option value="">Selecione um time</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
        <p className="text-xs text-destructive">Escolha dois times diferentes.</p>
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
}: {
  match: Match;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [scoreA, setScoreA] = useState(
    match.scoreA === null ? "0" : String(match.scoreA),
  );
  const [scoreB, setScoreB] = useState(
    match.scoreB === null ? "0" : String(match.scoreB),
  );
  const [expectedWinner, setExpectedWinner] = useState<ExpectedWinner | null>(
    () => {
      if (match.expectedWinnerName === match.teamAName) return "teamA";
      if (match.expectedWinnerName === match.teamBName) return "teamB";
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
    if (!canSubmit || expectedWinner === null) return;
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
            disabled={updateResult.isPending}
          >
            {match.teamAFlag} {match.teamAName}
          </Button>
          <Button
            type="button"
            variant={expectedWinner === "teamB" ? "default" : "outline"}
            onClick={() => setExpectedWinner("teamB")}
            disabled={updateResult.isPending}
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
            onChange={(e) => setScoreA(e.target.value)}
            disabled={updateResult.isPending}
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
            onChange={(e) => setScoreB(e.target.value)}
            disabled={updateResult.isPending}
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
        <Button type="submit" disabled={!canSubmit || updateResult.isPending}>
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
