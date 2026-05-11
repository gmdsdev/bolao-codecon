import {
  BET_WHEEL_OPTIONS,
  WHEEL_SEGMENT_DEGREES,
} from "./bet-wheel-options";
import type { Match, MatchGroup } from "./types";

function getWinner(scoreA: number, scoreB: number) {
  if (scoreA > scoreB) return "teamA";
  if (scoreB > scoreA) return "teamB";
  return null;
}

function applyBetModifier(points: number, modifier: string): number {
  if (points === 0) return 0;
  if (modifier === "double_points") return points * 2;
  if (modifier === "half_points") return Math.floor(points / 2);
  if (modifier === "invalid_bet") return 0;
  if (modifier === "lucky_duck") return points + 1;
  return points;
}

export function calculateBetPoints(
  betScoreA: number,
  betScoreB: number,
  matchScoreA: number,
  matchScoreB: number,
  modifier: string,
): number {
  const gotCorrectScore = betScoreA === matchScoreA && betScoreB === matchScoreB;
  const betWinner = getWinner(betScoreA, betScoreB);
  const finalWinner = getWinner(matchScoreA, matchScoreB);
  const gotWinner = finalWinner !== null && finalWinner === betWinner;
  const basePoints = gotCorrectScore ? 3 : gotWinner ? 1 : 0;
  return applyBetModifier(basePoints, modifier);
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
