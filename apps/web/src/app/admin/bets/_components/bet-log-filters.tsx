"use client";

import { Button } from "@codecon/ui/components/button";
import { Label } from "@codecon/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";
import { RotateCcw } from "lucide-react";

import { BET_MODIFIER_OPTIONS } from "./bet-utils";
import type {
  BetModifierFilter,
  MatchStatusFilter,
  UserFilterOption,
} from "./types";

const ALL_USERS = "all";
const sortedBetModifierOptions = [...BET_MODIFIER_OPTIONS].sort(
  (optionA, optionB) =>
    optionA.label.localeCompare(optionB.label, "pt-BR", {
      sensitivity: "base",
    }),
);

export function BetLogFilters({
  users,
  userId,
  modifier,
  matchStatus,
  isDisabled,
  onUserChange,
  onModifierChange,
  onMatchStatusChange,
  onClear,
}: {
  users: UserFilterOption[];
  userId: string;
  modifier: BetModifierFilter;
  matchStatus: MatchStatusFilter;
  isDisabled: boolean;
  onUserChange: (userId: string) => void;
  onModifierChange: (modifier: BetModifierFilter) => void;
  onMatchStatusChange: (matchStatus: MatchStatusFilter) => void;
  onClear: () => void;
}) {
  const hasFilters =
    userId !== ALL_USERS || modifier !== "all" || matchStatus !== "all";

  return (
    <div className="grid min-w-0 gap-3 border-b border-border p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="bet-user-filter">Usuário</Label>
        <Select
          id="bet-user-filter"
          items={[
            { value: ALL_USERS, label: "Todos os usuários" },
            ...users.map((user) => ({
              value: user.id,
              label: `${user.name} (${user.email})`,
            })),
          ]}
          value={userId}
          onValueChange={(value) => onUserChange(value ?? ALL_USERS)}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue
              className="min-w-0 truncate"
              placeholder="Todos os usuários"
            />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value={ALL_USERS}>Todos os usuários</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <span className="min-w-0 truncate">
                  {user.name} ({user.email})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="bet-modifier-filter">Consequência</Label>
        <Select
          id="bet-modifier-filter"
          items={[{ value: "all", label: "Todas" }, ...sortedBetModifierOptions]}
          value={modifier}
          onValueChange={(value) =>
            onModifierChange((value ?? "all") as BetModifierFilter)
          }
          disabled={isDisabled}
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue className="min-w-0 truncate" placeholder="Todas" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Todas</SelectItem>
            {sortedBetModifierOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="bet-status-filter">Partidas</Label>
        <Select
          id="bet-status-filter"
          items={[
            { value: "all", label: "Todas" },
            { value: "complete", label: "Concluídas" },
            { value: "not_complete", label: "Não concluídas" },
          ]}
          value={matchStatus}
          onValueChange={(value) =>
            onMatchStatusChange((value ?? "all") as MatchStatusFilter)
          }
          disabled={isDisabled}
        >
          <SelectTrigger className="w-full min-w-0" size="default">
            <SelectValue className="min-w-0 truncate" placeholder="Todas" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="complete">Concluídas</SelectItem>
            <SelectItem value="not_complete">Não concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto mb-2"
        onClick={onClear}
        disabled={isDisabled || !hasFilters}
      >
        <RotateCcw className="size-3.5" />
        Limpar
      </Button>
    </div>
  );
}
