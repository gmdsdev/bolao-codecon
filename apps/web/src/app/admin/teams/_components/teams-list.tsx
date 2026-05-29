"use client";

import {
  TableEmptyState,
  TableErrorState,
  TableLoadingState,
} from "@/components/tables/table-state";
import { TeamGroupSection } from "./team-group-section";
import type { Team, TeamGroup } from "./types";

export function TeamsList({
  teams,
  groups,
  isLoading,
  errorMessage,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}: {
  teams: Team[] | undefined;
  groups: TeamGroup[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  onCreateTeam: (teamGroupId: number) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (groups?.length === 0) {
    return (
      <TableEmptyState>
        Nenhum grupo cadastrado para vincular times.
      </TableEmptyState>
    );
  }

  if (groups !== undefined && groups.length > 0) {
    return (
      <div className="divide-y divide-border">
        {groups.map((group) => (
          <TeamGroupSection
            key={group.id}
            group={group}
            teams={
              teams?.filter((team) => team.teamGroupId === group.id) ?? []
            }
            onCreateTeam={onCreateTeam}
            onEditTeam={onEditTeam}
            onDeleteTeam={onDeleteTeam}
          />
        ))}
      </div>
    );
  }

  return <TableLoadingState />;
}
