import { calculateBetPointsWithPenalties as calculateBetPointsBreakdown } from "@codecon/api/lib/bet-scoring";

import {
  BET_WHEEL_OPTIONS,
  WHEEL_SEGMENT_DEGREES,
} from "./bet-wheel-options";
import type { Match, MatchGroup } from "./types";

export function calculateBetPoints(
  betScoreA: number,
  betScoreB: number,
  matchScoreA: number,
  matchScoreB: number,
  modifier: string,
  betPenaltyScoreA?: number | null,
  betPenaltyScoreB?: number | null,
  matchPenaltyScoreA?: number | null,
  matchPenaltyScoreB?: number | null,
): number {
  return calculateBetPointsBreakdown(
    {
      scoreA: betScoreA,
      scoreB: betScoreB,
      penaltyScoreA: betPenaltyScoreA,
      penaltyScoreB: betPenaltyScoreB,
    },
    {
      scoreA: matchScoreA,
      scoreB: matchScoreB,
      penaltyScoreA: matchPenaltyScoreA,
      penaltyScoreB: matchPenaltyScoreB,
    },
    modifier,
  ).totalPoints;
}

export function getGroupStageMatchGroups(matches: Match[]) {
  const isGroupStageRound = matches.every(
    (match) =>
      match.roundNumber <= 3 && match.teamAGroupId === match.teamBGroupId,
  );

  if (!isGroupStageRound) {
    return null;
  }

  const groups = new Map<number, MatchGroup>();

  matches.forEach((match) => {
    const group = groups.get(match.teamAGroupId);

    if (group) {
      group.matches.push(match);
      return;
    }

    groups.set(match.teamAGroupId, {
      id: match.teamAGroupId,
      name: match.teamAGroupName,
      matches: [match],
    });
  });

  return [...groups.values()].sort((groupA, groupB) =>
    groupA.name.localeCompare(groupB.name, "pt-BR"),
  );
}

export function getBetModifierLabel(modifier: string) {
  return (
    BET_WHEEL_OPTIONS.find((option) => option.value === modifier)?.label ??
    "Sem efeito"
  );
}

export function getWheelBackground() {
  const colors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
  ];

  return `conic-gradient(${BET_WHEEL_OPTIONS.map((_, index) => {
    const start = index * WHEEL_SEGMENT_DEGREES;
    const end = start + WHEEL_SEGMENT_DEGREES;

    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(", ")})`;
}

export function getWheelLabelStyle(index: number) {
  const radius = 64;
  const angle = index * WHEEL_SEGMENT_DEGREES + WHEEL_SEGMENT_DEGREES / 2;
  const radians = angle * (Math.PI / 180);
  const x = Math.sin(radians) * radius;
  const y = -Math.cos(radians) * radius;

  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${
      angle + 90
    }deg)`,
  };
}
