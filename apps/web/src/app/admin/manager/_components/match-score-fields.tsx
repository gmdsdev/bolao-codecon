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
  idPrefix = "score",
  title,
  onScoreAChange,
  onScoreBChange,
}: {
  match: Match;
  scoreA: string;
  scoreB: string;
  disabled: boolean;
  scoreAInputRef?: Ref<HTMLInputElement>;
  idPrefix?: string;
  title?: string;
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
    <div className="grid gap-2">
      {title && <p className="text-sm font-medium">{title}</p>}
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-a-${match.id}`} className="block truncate">
            {teamALabel}
          </Label>
          <Input
            ref={scoreAInputRef}
            id={`${idPrefix}-a-${match.id}`}
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
          <Label htmlFor={`${idPrefix}-b-${match.id}`} className="block truncate">
            {teamBLabel}
          </Label>
          <Input
            id={`${idPrefix}-b-${match.id}`}
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
    </div>
  );
}
