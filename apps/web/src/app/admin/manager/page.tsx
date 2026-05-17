"use client";

import { Button } from "@codecon/ui/components/button";
import { Calendar } from "@codecon/ui/components/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@codecon/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
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
  date: string;
  scoreA: number | null;
  scoreB: number | null;
  stadiumId: number;
  stadiumName: string;
  stadiumCity: string;
  expectedWinnerName: string | null;
  totalBets: number;
};

type Team = {
  id: number;
  name: string;
  flag: string;
};

type Stadium = {
  id: number;
  name: string;
  city: string;
};

type ExpectedWinner = "teamA" | "teamB";
const NO_EXPECTED_WINNER_VALUE = "none";

export default function Page() {
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const teams = useQuery(trpc.team.getAll.queryOptions());
  const stadiums = useQuery(trpc.stadium.getAll.queryOptions());

  useEffect(() => {
    if (rounds.data?.length && selectedRoundId === null) {
      setSelectedRoundId(rounds.data[0].id);
    }
  }, [rounds.data, selectedRoundId]);

  const selectedRound = rounds.data?.find((r) => r.id === selectedRoundId);

  if (rounds.isLoading || teams.isLoading || stadiums.isLoading) {
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

  if (stadiums.isError) {
    return <div>Erro: {stadiums.error.message}</div>;
  }

  if (!rounds.data?.length) {
    return (
      <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Partidas</CardTitle>
            <CardDescription>
              Cadastre rodadas antes de gerenciar partidas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-3 p-2 sm:p-3 lg:flex-row">
      <TableSelectRound
        rounds={rounds as never}
        selectedRoundId={selectedRoundId ?? undefined}
        onSelectRound={(round) => setSelectedRoundId(round.id)}
      />

      <div className="min-w-0 w-full flex-1">
        {selectedRound ? (
          <RoundMatches
            key={selectedRound.id}
            round={selectedRound}
            teams={teams.data ?? []}
            stadiums={stadiums.data ?? []}
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
  stadiums,
}: {
  round: Round;
  teams: Team[];
  stadiums: Stadium[];
}) {
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const matches = useQuery(
    trpc.match.getByRound.queryOptions({ roundId: round.id }),
  );

  const isRoundComplete = round.status === "complete";

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <CardTitle>{round.title}</CardTitle>
          <CardDescription>
            Status: {isRoundComplete ? "concluída" : round.status}
          </CardDescription>
        </div>
        {!isRoundComplete && (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsAddMatchOpen(true)}
          >
            Adicionar partida
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {matches.isLoading ? (
          <div className="flex justify-center border py-4">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : matches.isError ? (
          <div className="py-6 text-center text-sm text-destructive">
            Erro: {matches.error.message}
          </div>
        ) : matches.data?.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma partida nesta rodada.
          </div>
        ) : matches.data !== undefined && matches.data.length > 0 ? (
          <Table>
            <TableHeader className="hidden sm:table-header-group">
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
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center border py-4">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        <Dialog open={isAddMatchOpen} onOpenChange={setIsAddMatchOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar partida</DialogTitle>
              <DialogDescription>{round.title}</DialogDescription>
            </DialogHeader>
            <AddMatchForm
              roundId={round.id}
              teams={teams}
              stadiums={stadiums}
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
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar partida</DialogTitle>
                <DialogDescription>
                  {selectedMatch.teamAFlag} {selectedMatch.teamAName} x{" "}
                  {selectedMatch.teamBName} {selectedMatch.teamBFlag}
                </DialogDescription>
              </DialogHeader>
              <MatchResultForm
                match={selectedMatch}
                stadiums={stadiums}
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
}: {
  match: Match;
  roundComplete: boolean;
  onEdit: () => void;
}) {
  const isComplete = match.status === "complete";

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
    <TableRow
      className={
        isComplete
          ? "block p-3 opacity-60 sm:table-row sm:p-0"
          : "block p-3 sm:table-row sm:p-0"
      }
    >
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">
          {match.teamAFlag} {match.teamAName}
        </span>
        <span className="mx-1.5 text-muted-foreground">x</span>
        <span className="break-words">
          {match.teamBName} {match.teamBFlag}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">
          Vencedor esperado
        </span>
        <span className="text-right sm:text-left">{expectedWinnerLabel}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Placar</span>
        <span>{scoreLabel}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Apostas</span>
        <span className="text-muted-foreground">{match.totalBets ?? 0}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Status</span>
        {isComplete ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="size-3.5" />
            Concluída
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Pendente</span>
        )}
      </TableCell>
      <TableCell className="block p-0 pt-3 text-right sm:table-cell sm:p-2">
        <div className="flex justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onEdit}
            disabled={isComplete || roundComplete}
          >
            Editar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AddMatchForm({
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
  const teamOptions = getTeamOptions(teams);
  const stadiumOptions = getStadiumOptions(stadiums);
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
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`team-a-${roundId}`}>Time A</Label>
          <Select
            id={`team-a-${roundId}`}
            items={teamOptions}
            value={teamAId}
            onValueChange={(value) => setTeamAId(value ?? "")}
            disabled={createMatch.isPending || teams.length === 0}
            required
          >
            <SelectTrigger className="w-full min-w-0" size="default">
              <SelectValue
                className="min-w-0 truncate"
                placeholder="Selecione um time"
              />
            </SelectTrigger>
            <SelectContent align="start">
              {teams.map((team) => (
                <SelectItem
                  key={team.id}
                  value={String(team.id)}
                  className="min-w-0"
                >
                  <span className="block min-w-0 truncate">
                    {team.flag} {team.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`team-b-${roundId}`}>Time B</Label>
          <Select
            id={`team-b-${roundId}`}
            items={teamOptions}
            value={teamBId}
            onValueChange={(value) => setTeamBId(value ?? "")}
            disabled={createMatch.isPending || teams.length === 0}
            required
          >
            <SelectTrigger className="w-full min-w-0" size="default">
              <SelectValue
                className="min-w-0 truncate"
                placeholder="Selecione um time"
              />
            </SelectTrigger>
            <SelectContent align="start">
              {teams.map((team) => (
                <SelectItem
                  key={team.id}
                  value={String(team.id)}
                  className="min-w-0"
                >
                  <span className="block min-w-0 truncate">
                    {team.flag} {team.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor={`stadium-${roundId}`}>Estádio</Label>
        <Select
          id={`stadium-${roundId}`}
          items={stadiumOptions}
          value={stadiumId}
          onValueChange={(value) => setStadiumId(value ?? "")}
          disabled={createMatch.isPending || stadiums.length === 0}
          required
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue
              className="min-w-0 truncate"
              placeholder="Selecione um estádio"
            />
          </SelectTrigger>
          <SelectContent align="start">
            {stadiums.map((stadium) => (
              <SelectItem
                key={stadium.id}
                value={String(stadium.id)}
                className="min-w-0"
              >
                <span className="block min-w-0 truncate">
                  {stadium.name} - {stadium.city}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor={`date-${roundId}`}>Data e hora</Label>
        <DateTimePicker
          id={`date-${roundId}`}
          value={matchDate}
          onChange={setMatchDate}
          disabled={createMatch.isPending}
        />
      </div>

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

      <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
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
  const expectedWinnerValue = expectedWinner ?? NO_EXPECTED_WINNER_VALUE;
  const expectedWinnerOptions = [
    { value: NO_EXPECTED_WINNER_VALUE, label: "Nenhum" },
    { value: "teamA", label: `${match.teamAFlag} ${match.teamAName}` },
    { value: "teamB", label: `${match.teamBFlag} ${match.teamBName}` },
  ];

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
  const stadiumOptions = getStadiumOptions(stadiums);
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
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`expected-winner-${match.id}`}>Vencedor esperado</Label>
        <Select
          id={`expected-winner-${match.id}`}
          items={expectedWinnerOptions}
          value={expectedWinnerValue}
          onValueChange={(value) =>
            setExpectedWinner(
              value === "teamA" || value === "teamB" ? value : null,
            )
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue
              className="min-w-0 truncate"
              placeholder="Selecione um vencedor"
            />
          </SelectTrigger>
          <SelectContent align="start">
            {expectedWinnerOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {match.expectedWinnerName && (
          <p className="text-xs text-muted-foreground">
            Atual:{" "}
            {match.expectedWinnerName === match.teamAName
              ? `${match.teamAFlag} ${match.teamAName}`
              : `${match.teamBFlag} ${match.teamBName}`}
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`stadium-result-${match.id}`}>Estádio</Label>
        <Select
          id={`stadium-result-${match.id}`}
          items={stadiumOptions}
          value={stadiumId}
          onValueChange={(value) => setStadiumId(value ?? "")}
          disabled={isPending || stadiums.length === 0}
          required
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue
              className="min-w-0 truncate"
              placeholder="Selecione um estádio"
            />
          </SelectTrigger>
          <SelectContent align="start">
            {stadiums.map((stadium) => (
              <SelectItem
                key={stadium.id}
                value={String(stadium.id)}
                className="min-w-0"
              >
                <span className="block min-w-0 truncate">
                  {stadium.name} - {stadium.city}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor={`date-result-${match.id}`}>Data e hora</Label>
        <DateTimePicker
          id={`date-result-${match.id}`}
          value={matchDate}
          onChange={setMatchDate}
          disabled={isPending}
        />
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`score-a-${match.id}`} className="block truncate">
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
            disabled={isPending}
            required
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`score-b-${match.id}`} className="block truncate">
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
            disabled={isPending}
            required
          />
        </div>
      </div>

      {updateResult.isError && (
        <p className="text-xs text-destructive">{updateResult.error.message}</p>
      )}

      <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit || isPending}>
          {pendingAction === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Salvar"
          )}
        </Button>
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
      </DialogFooter>
    </form>
  );
}

function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedDate = isValidDatetimeLocal(value) ? new Date(value) : undefined;
  const timeValue = selectedDate ? value.slice(11, 16) : "";

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const [hours = "00", minutes = "00"] = timeValue
      ? timeValue.split(":")
      : [];
    const nextDate = new Date(date);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);

    onChange(formatDatetimeLocalFromDate(nextDate));
  };

  const handleTimeChange = (time: string) => {
    if (!selectedDate || time === "") return;

    const [hours = "00", minutes = "00"] = time.split(":");
    const nextDate = new Date(selectedDate);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);

    onChange(formatDatetimeLocalFromDate(nextDate));
  };

  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
      <Popover>
        <PopoverTrigger
          id={id}
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-0 justify-start text-left font-normal"
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="size-4" />
          <span
            className={
              selectedDate
                ? "min-w-0 truncate"
                : "min-w-0 truncate text-muted-foreground"
            }
          >
            {selectedDate
              ? formatDateTimeDisplay(selectedDate)
              : "Selecione uma data"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>

      <Input
        className="min-w-0"
        type="time"
        value={timeValue}
        onChange={(event) => handleTimeChange(event.target.value)}
        disabled={disabled || !selectedDate}
        required
      />
    </div>
  );
}

function formatDatetimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getStadiumOptions(stadiums: Stadium[]) {
  return stadiums.map((stadium) => ({
    value: String(stadium.id),
    label: `${stadium.name} - ${stadium.city}`,
  }));
}

function getTeamOptions(teams: Team[]) {
  return teams.map((team) => ({
    value: String(team.id),
    label: `${team.flag} ${team.name}`,
  }));
}

function formatDatetimeLocalFromDate(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTimeDisplay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isValidDatetimeLocal(value: string) {
  return value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

function datetimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}
