"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
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
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Team = {
  id: number;
  name: string;
  flag: string;
  teamGroupId: number;
  teamGroupName: string;
};

type TeamGroup = {
  id: number;
  name: string;
};

export default function Page() {
  const teams = useQuery(trpc.team.getAll.queryOptions());
  const groups = useQuery(trpc.team.getGroups.queryOptions());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamGroupId, setSelectedTeamGroupId] = useState<number | null>(
    null,
  );
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const openCreateForm = (teamGroupId: number) => {
    setSelectedTeam(null);
    setSelectedTeamGroupId(teamGroupId);
    setIsFormOpen(true);
  };

  const openEditForm = (team: Team) => {
    setSelectedTeam(team);
    setSelectedTeamGroupId(team.teamGroupId);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedTeam(null);
    setSelectedTeamGroupId(null);
  };

  const handleSaved = () => {
    teams.refetch();
    closeForm();
  };

  const handleDeleted = () => {
    teams.refetch();
    setTeamToDelete(null);
  };

  const isLoading = teams.isLoading || groups.isLoading;
  const error = teams.error ?? groups.error;

  return (
    <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Times</CardTitle>
            <CardDescription>
              Gerencie os times disponíveis para as partidas.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {error && <div>Erro: {error.message}</div>}

          {groups.data?.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum grupo cadastrado para vincular times.
            </div>
          )}

          {groups.data !== undefined && groups.data.length > 0 && (
            <div className="divide-y divide-border">
              {groups.data.map((group) => {
                const groupTeams =
                  teams.data?.filter((team) => team.teamGroupId === group.id) ??
                  [];

                return (
                  <section key={group.id} className="min-w-0">
                    <div className="flex min-w-0 flex-col gap-2 bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate font-mono text-xs font-medium">
                          {group.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {groupTeams.length} time
                          {groupTeams.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => openCreateForm(group.id)}
                      >
                        <Plus className="size-4" />
                        Cadastrar time
                      </Button>
                    </div>

                    {groupTeams.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Nenhum time neste grupo.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="hidden sm:table-header-group">
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupTeams.map((team) => (
                            <TeamRow
                              key={team.id}
                              team={team}
                              onEdit={() => openEditForm(team)}
                              onDelete={() => setTeamToDelete(team)}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTeam ? "Editar time" : "Cadastrar time"}
            </DialogTitle>
            <DialogDescription>
              {selectedTeam
                ? "Atualize os dados do time selecionado."
                : "Informe os dados do novo time."}
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            key={selectedTeam?.id ?? `create-${selectedTeamGroupId ?? "none"}`}
            team={selectedTeam}
            initialTeamGroupId={selectedTeamGroupId}
            groups={groups.data ?? []}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={teamToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTeamToDelete(null);
        }}
      >
        {teamToDelete && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir time</DialogTitle>
              <DialogDescription>
                Esta ação oculta {teamToDelete.flag} {teamToDelete.name} da
                lista de times e das opções de Partidas. Partidas existentes
                manterão este time no histórico.
              </DialogDescription>
            </DialogHeader>
            <DeleteTeamForm
              team={teamToDelete}
              onCancel={() => setTeamToDelete(null)}
              onDeleted={handleDeleted}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function TeamRow({
  team,
  onEdit,
  onDelete,
}: {
  team: Team;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="block p-3 sm:table-row sm:p-0">
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">
          {team.flag} {team.name}
        </span>
      </TableCell>
      <TableCell className="block p-0 pt-3 text-right sm:table-cell sm:p-2">
        <div className="flex justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function TeamForm({
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
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : team ? (
            "Salvar"
          ) : (
            "Cadastrar"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteTeamForm({
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

      <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={deleteTeam.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteTeam.isPending}
        >
          {deleteTeam.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Excluir time"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
