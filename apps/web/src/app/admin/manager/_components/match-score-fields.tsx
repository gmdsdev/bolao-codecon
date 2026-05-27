"use client";

import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import type { Ref } from "react";

import type { Match } from "./types";

export function MatchScoreFields({
  match,
  scoreA,
  scoreB,
  disabled,
  scoreAInputRef,
  onScoreAChange,
  onScoreBChange,
}: {
  match: Match;
  scoreA: string;
  scoreB: string;
  disabled: boolean;
  scoreAInputRef?: Ref<HTMLInputElement>;
  onScoreAChange: (value: string) => void;
  onScoreBChange: (value: string) => void;
}) {
  const teamALabel = `${match.teamAFlag ?? ""} ${
    match.teamAName ?? "Time A"
  }`.trim();
  const teamBLabel = `${match.teamBFlag ?? ""} ${
    match.teamBName ?? "Time B"
  }`.trim();

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3">
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`score-a-${match.id}`} className="block truncate">
          {teamALabel}
        </Label>
        <Input
          ref={scoreAInputRef}
          id={`score-a-${match.id}`}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={scoreA}
          onChange={(event) => onScoreAChange(event.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`score-b-${match.id}`} className="block truncate">
          {teamBLabel}
        </Label>
        <Input
          id={`score-b-${match.id}`}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={scoreB}
          onChange={(event) => onScoreBChange(event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
