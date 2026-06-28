import { describe, expect, test } from "vitest";

import {
  applyBetScoreModifier,
  calculateBetPoints,
  calculateBetPointsWithPenalties,
  type BetScore,
} from "./bet-scoring";

const modifierCases: Array<[string, number, number, number]> = [
  ["normal", 0, 0, 0],
  ["invert_bet", 0, 0, 0],
  ["double_points", 0, 0, 0],
  ["half_points", 0, 0, 0],
  ["invalid_bet", 0, 0, 0],
  ["lucky_duck", 0, 0, 0],
  ["normal", 1, 0, 1],
  ["invert_bet", 1, 0, 1],
  ["double_points", 1, 1, 2],
  ["half_points", 1, -0.5, 0.5],
  ["invalid_bet", 1, -1, 0],
  ["lucky_duck", 1, 1, 2],
  ["normal", 3, 0, 3],
  ["invert_bet", 3, 0, 3],
  ["double_points", 3, 3, 6],
  ["half_points", 3, -1.5, 1.5],
  ["invalid_bet", 3, -3, 0],
  ["lucky_duck", 3, 1, 4],
];

const missedOutcomeCases: Array<[string, BetScore, BetScore]> = [
  [
    "team A win bet misses when team B wins",
    { scoreA: 2, scoreB: 0 },
    { scoreA: 0, scoreB: 1 },
  ],
  [
    "team B win bet misses when team A wins",
    { scoreA: 0, scoreB: 2 },
    { scoreA: 1, scoreB: 0 },
  ],
  [
    "team A win bet misses when match is a draw",
    { scoreA: 3, scoreB: 1 },
    { scoreA: 2, scoreB: 2 },
  ],
  [
    "team B win bet misses when match is a draw",
    { scoreA: 1, scoreB: 3 },
    { scoreA: 2, scoreB: 2 },
  ],
];

const exactScoreCases: Array<[string, BetScore]> = [
  ["0 - 0", { scoreA: 0, scoreB: 0 }],
  ["4 - 3", { scoreA: 4, scoreB: 3 }],
  ["3 - 4", { scoreA: 3, scoreB: 4 }],
];

describe("calculateBetPoints", () => {
  test("awards 3 points for the exact score", () => {
    expect(
      calculateBetPoints(
        { scoreA: 2, scoreB: 1 },
        { scoreA: 2, scoreB: 1 },
        "normal",
      ),
    ).toEqual({
      basePoints: 3,
      modifierPoints: 0,
      totalPoints: 3,
    });
  });

  test("awards 1 point for the correct team A win outcome", () => {
    expect(
      calculateBetPoints(
        { scoreA: 2, scoreB: 1 },
        { scoreA: 1, scoreB: 0 },
        "normal",
      ).basePoints,
    ).toBe(1);
  });

  test("awards 1 point for the correct team B win outcome", () => {
    expect(
      calculateBetPoints(
        { scoreA: 1, scoreB: 2 },
        { scoreA: 0, scoreB: 3 },
        "normal",
      ).basePoints,
    ).toBe(1);
  });

  test("awards 1 point for a correct draw outcome with a different score", () => {
    expect(
      calculateBetPoints(
        { scoreA: 1, scoreB: 1 },
        { scoreA: 2, scoreB: 2 },
        "normal",
      ),
    ).toEqual({
      basePoints: 1,
      modifierPoints: 0,
      totalPoints: 1,
    });
  });

  test("does not award outcome points when a draw bet misses", () => {
    expect(
      calculateBetPoints(
        { scoreA: 1, scoreB: 1 },
        { scoreA: 2, scoreB: 1 },
        "normal",
      ).totalPoints,
    ).toBe(0);
  });

  test.each(missedOutcomeCases)(
    "%s",
    (_: string, betScore: BetScore, matchScore: BetScore) => {
      expect(calculateBetPoints(betScore, matchScore, "normal")).toEqual({
        basePoints: 0,
        modifierPoints: 0,
        totalPoints: 0,
      });
    },
  );

  test.each(exactScoreCases)(
    "awards exact score points for %s",
    (_: string, score: BetScore) => {
      expect(calculateBetPoints(score, score, "normal")).toEqual({
        basePoints: 3,
        modifierPoints: 0,
        totalPoints: 3,
      });
    },
  );

  test("treats unknown modifiers as normal scoring", () => {
    expect(
      calculateBetPoints(
        { scoreA: 2, scoreB: 1 },
        { scoreA: 2, scoreB: 1 },
        "surprise_modifier",
      ),
    ).toEqual({
      basePoints: 3,
      modifierPoints: 0,
      totalPoints: 3,
    });
  });

  test("does not apply lucky duck bonus when the bet scores zero", () => {
    expect(
      calculateBetPoints(
        { scoreA: 2, scoreB: 1 },
        { scoreA: 0, scoreB: 1 },
        "lucky_duck",
      ),
    ).toEqual({
      basePoints: 0,
      modifierPoints: 0,
      totalPoints: 0,
    });
  });

  test.each(modifierCases)(
    "applies %s to %i base points",
    (
      modifier: string,
      basePoints: number,
      modifierPoints: number,
      totalPoints: number,
    ) => {
      const scores = getScoresForBasePoints(basePoints);

      expect(
        calculateBetPoints(scores.betScore, scores.matchScore, modifier),
      ).toEqual({
        basePoints,
        modifierPoints,
        totalPoints,
      });
    },
  );

  test("scores an inverted bet using the saved swapped score", () => {
    const savedBet = applyBetScoreModifier(
      { scoreA: 2, scoreB: 0 },
      "invert_bet",
    );

    expect(
      calculateBetPoints(savedBet, { scoreA: 0, scoreB: 2 }, "invert_bet"),
    ).toMatchObject({
      basePoints: 3,
      totalPoints: 3,
    });

    expect(
      calculateBetPoints(savedBet, { scoreA: 2, scoreB: 0 }, "invert_bet"),
    ).toMatchObject({
      basePoints: 0,
      totalPoints: 0,
    });
  });
});

function getScoresForBasePoints(basePoints: number) {
  if (basePoints === 0) {
    return {
      betScore: { scoreA: 2, scoreB: 1 },
      matchScore: { scoreA: 0, scoreB: 1 },
    };
  }

  if (basePoints === 1) {
    return {
      betScore: { scoreA: 1, scoreB: 1 },
      matchScore: { scoreA: 2, scoreB: 2 },
    };
  }

  if (basePoints === 3) {
    return {
      betScore: { scoreA: 2, scoreB: 1 },
      matchScore: { scoreA: 2, scoreB: 1 },
    };
  }

  throw new Error(`Unsupported base points fixture: ${basePoints}`);
}

describe("applyBetScoreModifier", () => {
  test("swaps scores for an inverted bet before it is saved", () => {
    expect(
      applyBetScoreModifier({ scoreA: 2, scoreB: 0 }, "invert_bet"),
    ).toEqual({
      scoreA: 0,
      scoreB: 2,
    });
  });

  test("keeps scores untouched for non-inverted bets", () => {
    expect(
      applyBetScoreModifier({ scoreA: 2, scoreB: 0 }, "normal"),
    ).toEqual({
      scoreA: 2,
      scoreB: 0,
    });
  });

  test.each([
    "normal",
    "double_points",
    "half_points",
    "invalid_bet",
    "lucky_duck",
    "unknown",
  ])("does not mutate the original score for %s", (modifier: string) => {
    const score = { scoreA: 5, scoreB: 4 };

    expect(applyBetScoreModifier(score, modifier)).toEqual(score);
    expect(score).toEqual({ scoreA: 5, scoreB: 4 });
  });

  test("returns a swapped copy for inverted bets without mutating the input", () => {
    const score = { scoreA: 5, scoreB: 4 };

    expect(applyBetScoreModifier(score, "invert_bet")).toEqual({
      scoreA: 4,
      scoreB: 5,
    });
    expect(score).toEqual({ scoreA: 5, scoreB: 4 });
  });
});

describe("calculateBetPointsWithPenalties", () => {
  test("adds regular time and penalty shootout points", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 0, scoreB: 0, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 0, scoreB: 0, penaltyScoreA: 5, penaltyScoreB: 4 },
        "normal",
      ),
    ).toEqual({
      basePoints: 4,
      modifierPoints: 0,
      totalPoints: 4,
    });
  });

  test("applies modifiers to both regular time and penalties", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        "half_points",
      ),
    ).toEqual({
      basePoints: 6,
      modifierPoints: -3,
      totalPoints: 3,
    });
  });

  test("falls back to regular time scoring when the bet has no penalties", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1 },
        "normal",
      ),
    ).toEqual({
      basePoints: 3,
      modifierPoints: 0,
      totalPoints: 3,
    });
  });

  test("falls back to regular time scoring when the match has no penalties", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: null, penaltyScoreB: null },
        "normal",
      ),
    ).toEqual({
      basePoints: 3,
      modifierPoints: 0,
      totalPoints: 3,
    });
  });

  test("awards only outcome points when the exact penalty score is missed", () => {
    // Regular time exact (3) + correct penalty winner but wrong score (1).
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 0, scoreB: 0, penaltyScoreA: 5, penaltyScoreB: 3 },
        { scoreA: 0, scoreB: 0, penaltyScoreA: 4, penaltyScoreB: 2 },
        "normal",
      ),
    ).toEqual({
      basePoints: 4,
      modifierPoints: 0,
      totalPoints: 4,
    });
  });

  test("does not award penalty points when the penalty winner is wrong", () => {
    // Regular time exact (3) + wrong penalty winner (0).
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 5, penaltyScoreB: 4 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 3, penaltyScoreB: 5 },
        "normal",
      ),
    ).toEqual({
      basePoints: 3,
      modifierPoints: 0,
      totalPoints: 3,
    });
  });

  test("awards no points when both regular time and penalties miss", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 2, scoreB: 0, penaltyScoreA: 5, penaltyScoreB: 4 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 3, penaltyScoreB: 5 },
        "normal",
      ),
    ).toEqual({
      basePoints: 0,
      modifierPoints: 0,
      totalPoints: 0,
    });
  });

  test("doubles the combined regular time and penalty points", () => {
    // Regular exact (3) + penalty exact (3) = 6, doubled to 12.
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        "double_points",
      ),
    ).toEqual({
      basePoints: 6,
      modifierPoints: 6,
      totalPoints: 12,
    });
  });

  test("voids the combined points for an invalid bet", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        "invalid_bet",
      ),
    ).toEqual({
      basePoints: 6,
      modifierPoints: -6,
      totalPoints: 0,
    });
  });

  test("adds the lucky duck bonus only once to the combined points", () => {
    // Regular exact (3) + penalty exact (3) = 6, lucky duck adds a single +1.
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 },
        "lucky_duck",
      ),
    ).toEqual({
      basePoints: 6,
      modifierPoints: 1,
      totalPoints: 7,
    });
  });

  test("does not apply the lucky duck bonus when nothing scores", () => {
    expect(
      calculateBetPointsWithPenalties(
        { scoreA: 2, scoreB: 0, penaltyScoreA: 5, penaltyScoreB: 4 },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 3, penaltyScoreB: 5 },
        "lucky_duck",
      ),
    ).toEqual({
      basePoints: 0,
      modifierPoints: 0,
      totalPoints: 0,
    });
  });

  test("scores an inverted bet using the saved swapped scores", () => {
    // A bet of regular 1-1 / penalties 2-0 inverted is saved as 1-1 / 0-2.
    const savedRegular = applyBetScoreModifier(
      { scoreA: 1, scoreB: 1 },
      "invert_bet",
    );
    const savedPenalties = applyBetScoreModifier(
      { scoreA: 2, scoreB: 0 },
      "invert_bet",
    );

    expect(
      calculateBetPointsWithPenalties(
        {
          scoreA: savedRegular.scoreA,
          scoreB: savedRegular.scoreB,
          penaltyScoreA: savedPenalties.scoreA,
          penaltyScoreB: savedPenalties.scoreB,
        },
        { scoreA: 1, scoreB: 1, penaltyScoreA: 0, penaltyScoreB: 2 },
        "invert_bet",
      ),
    ).toEqual({
      basePoints: 6,
      modifierPoints: 0,
      totalPoints: 6,
    });
  });
});
