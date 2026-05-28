import { describe, expect, test } from "vitest";

import { applyBetScoreModifier, calculateBetPoints } from "./bet-scoring";

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
  ["half_points", 1, -1, 0],
  ["invalid_bet", 1, -1, 0],
  ["lucky_duck", 1, 1, 2],
  ["normal", 3, 0, 3],
  ["invert_bet", 3, 0, 3],
  ["double_points", 3, 3, 6],
  ["half_points", 3, -2, 1],
  ["invalid_bet", 3, -3, 0],
  ["lucky_duck", 3, 1, 4],
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

  test.each(modifierCases)(
    "applies %s to %i base points",
    (modifier, basePoints, modifierPoints, totalPoints) => {
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
});
