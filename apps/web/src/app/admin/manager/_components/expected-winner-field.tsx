"use client";

import { Label } from "@codecon/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";

import { NO_EXPECTED_WINNER_VALUE } from "./match-utils";
import type { ExpectedWinner, Match } from "./types";

export function ExpectedWinnerField({
  match,
  value,
  disabled,
  onChange,
}: {
  match: Match;
  value: ExpectedWinner | null;
  disabled: boolean;
  onChange: (value: ExpectedWinner | null) => void;
}) {
  const selectValue = value ?? NO_EXPECTED_WINNER_VALUE;
  const teamALabel = `${match.teamAFlag ?? ""} ${
    match.teamAName ?? "A definir"
  }`.trim();
  const teamBLabel = `${match.teamBFlag ?? ""} ${
    match.teamBName ?? "A definir"
  }`.trim();
  const options = [
    { value: NO_EXPECTED_WINNER_VALUE, label: "Nenhum" },
    { value: "teamA", label: teamALabel, disabled: match.teamAId === null },
    { value: "teamB", label: teamBLabel, disabled: match.teamBId === null },
  ];

  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={`expected-winner-${match.id}`}>Vencedor esperado</Label>
      <Select
        id={`expected-winner-${match.id}`}
        items={options}
        value={selectValue}
        onValueChange={(nextValue) =>
          onChange(nextValue === "teamA" || nextValue === "teamB" ? nextValue : null)
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-full min-w-0" size="default">
          <SelectValue
            className="min-w-0 truncate"
            placeholder="Selecione um vencedor"
          />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {match.expectedWinnerName && (
        <p className="text-xs text-muted-foreground">
          Atual:{" "}
          {match.expectedWinnerName === match.teamAName
            ? teamALabel
            : teamBLabel}
        </p>
      )}
    </div>
  );
}
