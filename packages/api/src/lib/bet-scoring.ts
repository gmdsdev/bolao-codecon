export type BetModifier =
  | "invert_bet"
  | "double_points"
  | "half_points"
  | "invalid_bet"
  | "lucky_duck"
  | "normal";

type MatchOutcome = "teamA" | "teamB" | "draw";

export type BetScore = {
  scoreA: number;
  scoreB: number;
};

export type BetPoints = {
  basePoints: number;
  modifierPoints: number;
  totalPoints: number;
};

export function applyBetScoreModifier(
  score: BetScore,
  modifier: string,
): BetScore {
  if (modifier !== "invert_bet") {
    return score;
  }

  return {
    scoreA: score.scoreB,
    scoreB: score.scoreA,
  };
}

export function calculateBetPoints(
  betScore: BetScore,
  matchScore: BetScore,
  modifier: string,
): BetPoints {
  const basePoints = calculateBaseBetPoints(betScore, matchScore);
  const totalPoints = applyBetPointsModifier(basePoints, modifier);

  return {
    basePoints,
    modifierPoints: totalPoints - basePoints,
    totalPoints,
  };
}

function calculateBaseBetPoints(betScore: BetScore, matchScore: BetScore) {
  const gotCorrectScore =
    betScore.scoreA === matchScore.scoreA &&
    betScore.scoreB === matchScore.scoreB;

  if (gotCorrectScore) {
    return 3;
  }

  return getOutcome(betScore) === getOutcome(matchScore) ? 1 : 0;
}

function getOutcome(score: BetScore): MatchOutcome {
  if (score.scoreA > score.scoreB) {
    return "teamA";
  }

  if (score.scoreB > score.scoreA) {
    return "teamB";
  }

  return "draw";
}

function applyBetPointsModifier(points: number, modifier: string) {
  if (points === 0) {
    return 0;
  }

  if (modifier === "double_points") {
    return points * 2;
  }

  if (modifier === "half_points") {
    return points / 2;
  }

  if (modifier === "invalid_bet") {
    return 0;
  }

  if (modifier === "lucky_duck") {
    return points + 1;
  }

  return points;
}
