"use client";

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
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { DeleteTeamForm } from "./delete-team-form";
import { TeamForm } from "./team-form";
import { TeamsList } from "./teams-list";
import type { Team } from "./types";

export function TeamsPage() {
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
          <TeamsList
            teams={teams.data}
            groups={groups.data}
            isLoading={isLoading}
            errorMessage={error?.message}
            onCreateTeam={openCreateForm}
            onEditTeam={openEditForm}
            onDeleteTeam={setTeamToDelete}
          />
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
