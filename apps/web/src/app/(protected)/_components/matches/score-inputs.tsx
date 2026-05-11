import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import type { Dispatch, SetStateAction } from "react";

import type { Match } from "./types";

type ScoreInputsProps = {
  match: Match;
  scoreA: string;
  scoreB: string;
  scoreAId: string;
  scoreBId: string;
  disabled: boolean;
  onScoreAChange: Dispatch<SetStateAction<string>>;
  onScoreBChange: Dispatch<SetStateAction<string>>;
};

export function ScoreInputs({
  match,
  scoreA,
  scoreB,
  scoreAId,
  scoreBId,
  disabled,
  onScoreAChange,
  onScoreBChange,
}: ScoreInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor={scoreAId}>{match.teamAName}</Label>
        <Input
          id={scoreAId}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={scoreA}
          onChange={(event) => onScoreAChange(event.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={scoreBId}>{match.teamBName}</Label>
        <Input
          id={scoreBId}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={scoreB}
          onChange={(event) => onScoreBChange(event.target.value)}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
