"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { Plus } from "lucide-react";

import { TableEmptyState } from "../../_components/table-state";
import { TeamRow } from "./team-row";
import type { Team, TeamGroup } from "./types";

export function TeamGroupSection({
  group,
  teams,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}: {
  group: TeamGroup;
  teams: Team[];
  onCreateTeam: (teamGroupId: number) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
}) {
  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-2 bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-mono text-xs font-medium">
            {group.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {teams.length} time{teams.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onCreateTeam(group.id)}
        >
          <Plus className="size-4" />
          Cadastrar time
        </Button>
      </div>

      {teams.length === 0 ? (
        <TableEmptyState>Nenhum time neste grupo.</TableEmptyState>
      ) : (
        <Table>
          <TableHeader className="hidden sm:table-header-group">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                onEdit={() => onEditTeam(team)}
                onDelete={() => onDeleteTeam(team)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
