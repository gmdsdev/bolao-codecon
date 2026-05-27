"use client";

import { Label } from "@codecon/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";

import { getTeamOptions } from "./match-utils";
import type { Team } from "./types";

const NO_TEAM_VALUE = "__no-team__";

export function TeamSelectField({
  id,
  label,
  value,
  teams,
  disabled,
  allowEmpty = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  teams: Team[];
  disabled: boolean;
  allowEmpty?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        items={getTeamOptions(teams)}
        value={value}
        onValueChange={(nextValue) =>
          onChange(nextValue === NO_TEAM_VALUE ? "" : (nextValue ?? ""))
        }
        disabled={disabled || teams.length === 0}
      >
        <SelectTrigger className="w-full min-w-0" size="default">
          <SelectValue
            className="min-w-0 truncate"
            placeholder="Selecione um time"
          />
        </SelectTrigger>
        <SelectContent align="start">
          {allowEmpty && (
            <SelectItem value={NO_TEAM_VALUE} className="min-w-0">
              <span className="block min-w-0 truncate">A definir</span>
            </SelectItem>
          )}
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
  );
}
