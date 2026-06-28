import {
  knockoutAdvanceSlots,
  seedKnockoutMatches,
  thirdPlaceMatrix,
} from "@codecon/db/world-cup-2026";
import { describe, expect, test } from "vitest";

import {
  BracketRuleError,
  applyKnockoutPlacement,
  getKnockoutPlacements,
  getRoundOf32Updates,
  type ExistingRoundOf32Match,
  type GroupMatch,
  type GroupTeam,
} from "./world-cup-2026-bracket";

describe("getRoundOf32Updates", () => {
  test("covers every possible combination of eight third-place qualifiers", () => {
    const combinations = choose([...defaultGroupLetters], 8);

    expect(thirdPlaceMatrix.size).toBe(combinations.length);

    for (const combination of combinations) {
      const key = combination.join("");
      const slots = thirdPlaceMatrix.get(key);

      expect(slots, key).toBeDefined();
      if (!slots) throw new Error(`Missing third-place matrix row ${key}`);
      expect(slots, key).toHaveLength(8);
      expect([...new Set(slots)].sort().join(""), key).toBe(key);
    }
  });

  test("returns null until every group-stage match is complete", () => {
    const updates = getRoundOf32Updates({
      groupMatches: [
        {
          status: "pending",
          teamAId: 1,
          teamBId: 2,
          scoreA: null,
          scoreB: null,
        },
      ],
      teams: makeTeams(),
      existingRoundOf32Matches: makeEmptyRoundOf32Matches(),
    });

    expect(updates).toBeNull();
  });

  test("does not overwrite an already generated round of 32", () => {
    const updates = getRoundOf32Updates({
      groupMatches: makeGroupMatches(),
      teams: makeTeams(),
      existingRoundOf32Matches: [
        { teamAId: 1, teamBId: null },
        ...makeEmptyRoundOf32Matches().slice(1),
      ],
    });

    expect(updates).toBeNull();
  });

  test("builds every round-of-32 match from group standings and the official third-place matrix", () => {
    const updates = getRoundOf32Updates({
      groupMatches: makeGroupMatches(),
      teams: makeTeams(),
      existingRoundOf32Matches: makeEmptyRoundOf32Matches(),
    });

    expect(updates).toHaveLength(16);
    expect(updates?.every((update) => update.status === "pending")).toBe(true);

    const updateByMatch = new Map(
      updates?.map((update) => [update.matchNumber, update]),
    );

    expect(updateByMatch.get(73)).toMatchObject({
      teamAId: teamId("A", 2),
      teamBId: teamId("B", 2),
    });
    expect(updateByMatch.get(74)).toMatchObject({
      teamAId: teamId("E", 1),
      teamBId: teamId("C", 3),
    });
    expect(updateByMatch.get(79)).toMatchObject({
      teamAId: teamId("A", 1),
      teamBId: teamId("H", 3),
    });
    expect(updateByMatch.get(81)).toMatchObject({
      teamAId: teamId("D", 1),
      teamBId: teamId("B", 3),
    });
    expect(updateByMatch.get(85)).toMatchObject({
      teamAId: teamId("B", 1),
      teamBId: teamId("G", 3),
    });
    expect(updateByMatch.get(87)).toMatchObject({
      teamAId: teamId("K", 1),
      teamBId: teamId("D", 3),
    });
  });

  test("throws when a group match references a team outside the seeded groups", () => {
    expect(() =>
      getRoundOf32Updates({
        groupMatches: [
          { ...makeGroupMatches()[0]!, teamAId: 999 },
          ...makeGroupMatches().slice(1),
        ],
        teams: makeTeams(),
        existingRoundOf32Matches: makeEmptyRoundOf32Matches(),
      }),
    ).toThrowError(BracketRuleError);
  });

  test("throws when a group is missing enough teams for qualification", () => {
    expect(() =>
      getRoundOf32Updates({
        groupMatches: makeGroupMatches(),
        teams: makeTeams().filter((team) => team.groupName !== "Grupo L"),
        existingRoundOf32Matches: makeEmptyRoundOf32Matches(),
      }),
    ).toThrowError(BracketRuleError);
  });
});

describe("getKnockoutPlacements", () => {
  test("every knockout fixture has the expected match number range and no duplicates", () => {
    const matchNumbers = seedKnockoutMatches.map(
      (fixture) => fixture.matchNumber,
    );

    expect(matchNumbers).toHaveLength(32);
    expect([...new Set(matchNumbers)]).toHaveLength(32);
    expect(Math.min(...matchNumbers)).toBe(73);
    expect(Math.max(...matchNumbers)).toBe(104);
  });

  test("all configured knockout destinations point to existing later matches", () => {
    const seededMatchNumbers = new Set(
      seedKnockoutMatches.map((fixture) => fixture.matchNumber),
    );

    for (const [sourceMatchNumber, destinations] of Object.entries(
      knockoutAdvanceSlots,
    )) {
      for (const destination of destinations) {
        expect(
          seededMatchNumbers.has(destination.matchNumber),
          `${sourceMatchNumber} -> ${destination.matchNumber}`,
        ).toBe(true);
        expect(destination.matchNumber).toBeGreaterThan(Number(sourceMatchNumber));
      }
    }
  });

  test("moves the winner of a round-of-32 match to the configured next slot", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: 73,
        teamAId: 101,
        teamBId: 102,
        scoreA: 2,
        scoreB: 1,
      }),
    ).toEqual([{ matchNumber: 90, side: "teamAId", teamId: 101 }]);
  });

  test("moves semifinal winners to the final and losers to the third-place match", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: 101,
        teamAId: 201,
        teamBId: 202,
        scoreA: 0,
        scoreB: 2,
      }),
    ).toEqual([
      { matchNumber: 104, side: "teamAId", teamId: 202 },
      { matchNumber: 103, side: "teamAId", teamId: 201 },
    ]);
  });

  test("moves the winner from the second semifinal to the other final slot", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: 102,
        teamAId: 203,
        teamBId: 204,
        scoreA: 4,
        scoreB: 3,
      }),
    ).toEqual([
      { matchNumber: 104, side: "teamBId", teamId: 203 },
      { matchNumber: 103, side: "teamBId", teamId: 204 },
    ]);
  });

  test("does not advance anyone from the final", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: 104,
        teamAId: 301,
        teamBId: 302,
        scoreA: 3,
        scoreB: 1,
      }),
    ).toEqual([]);
  });

  test("rejects knockout draws because a winner is required", () => {
    expect(() =>
      getKnockoutPlacements({
        matchNumber: 88,
        teamAId: 401,
        teamBId: 402,
        scoreA: 1,
        scoreB: 1,
      }),
    ).toThrowError(BracketRuleError);
  });

  test("uses penalties to advance a tied knockout match", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: 88,
        teamAId: 401,
        teamBId: 402,
        scoreA: 1,
        scoreB: 1,
        penaltyScoreA: 4,
        penaltyScoreB: 3,
      }),
    ).toEqual([{ matchNumber: 95, side: "teamBId", teamId: 401 }]);
  });

  test("rejects knockout matches without both teams", () => {
    expect(() =>
      getKnockoutPlacements({
        matchNumber: 90,
        teamAId: 101,
        teamBId: null,
        scoreA: 1,
        scoreB: 0,
      }),
    ).toThrowError(BracketRuleError);
  });

  test("returns no placements for matches without a fixed match number", () => {
    expect(
      getKnockoutPlacements({
        matchNumber: null,
        teamAId: 1,
        teamBId: 2,
        scoreA: 1,
        scoreB: 0,
      }),
    ).toEqual([]);
  });

  test("all pre-final knockout matches have at least one configured destination", () => {
    const matchNumbers = seedKnockoutMatches
      .map((fixture) => fixture.matchNumber)
      .filter((matchNumber) => matchNumber <= 102);

    for (const matchNumber of matchNumbers) {
      const placements = getKnockoutPlacements({
        matchNumber,
        teamAId: 1,
        teamBId: 2,
        scoreA: 1,
        scoreB: 0,
      });

      expect(placements.length, `Match ${matchNumber}`).toBeGreaterThan(0);
    }
  });
});

describe("applyKnockoutPlacement", () => {
  test("fills an empty target slot and keeps the match as draft until both teams are known", () => {
    expect(
      applyKnockoutPlacement(
        { id: 90, matchNumber: 90, teamAId: null, teamBId: null },
        { matchNumber: 90, side: "teamAId", teamId: 101 },
      ),
    ).toEqual({
      id: 90,
      matchNumber: 90,
      teamAId: 101,
      teamBId: null,
      status: "draft",
    });
  });

  test("publishes the target match when both teams are known", () => {
    expect(
      applyKnockoutPlacement(
        { id: 90, matchNumber: 90, teamAId: 101, teamBId: null },
        { matchNumber: 90, side: "teamBId", teamId: 202 },
      ),
    ).toEqual({
      id: 90,
      matchNumber: 90,
      teamAId: 101,
      teamBId: 202,
      status: "pending",
    });
  });

  test("is idempotent when the same winner is written again", () => {
    expect(
      applyKnockoutPlacement(
        { id: 90, matchNumber: 90, teamAId: 101, teamBId: null },
        { matchNumber: 90, side: "teamAId", teamId: 101 },
      ),
    ).toMatchObject({
      teamAId: 101,
      teamBId: null,
      status: "draft",
    });
  });

  test("rejects overwriting a slot with another team", () => {
    expect(() =>
      applyKnockoutPlacement(
        { id: 90, matchNumber: 90, teamAId: 101, teamBId: null },
        { matchNumber: 90, side: "teamAId", teamId: 999 },
      ),
    ).toThrowError(BracketRuleError);
  });

  test("rejects applying a placement to a missing target match", () => {
    expect(() =>
      applyKnockoutPlacement(undefined, {
        matchNumber: 90,
        side: "teamAId",
        teamId: 101,
      }),
    ).toThrowError(BracketRuleError);
  });
});

const defaultGroupLetters = "ABCDEFGHIJKL".split("");

function choose<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];

  const first = items[0] as T;
  const rest = items.slice(1);
  const withFirst = choose(rest, size - 1).map((combination) => [
    first,
    ...combination,
  ]);
  const withoutFirst = choose(rest, size);

  return [...withFirst, ...withoutFirst];
}

function makeTeams(): GroupTeam[] {
  return defaultGroupLetters.flatMap((groupLetter) =>
    [1, 2, 3, 4].map((position) => ({
      id: teamId(groupLetter, position),
      name: `${groupLetter}${position}`,
      groupName: `Grupo ${groupLetter}`,
    })),
  );
}

function makeGroupMatches(): GroupMatch[] {
  return defaultGroupLetters.flatMap((groupLetter) => {
    const isStrongThirdPlaceGroup = groupLetter <= "H";
    const thirdPlaceLoss = isStrongThirdPlaceGroup ? 1 : 5;
    const thirdPlaceWin = isStrongThirdPlaceGroup ? 5 : 1;

    return [
      match(groupLetter, 1, 2, 3, 0),
      match(groupLetter, 1, 3, thirdPlaceLoss, 0),
      match(groupLetter, 1, 4, 3, 0),
      match(groupLetter, 2, 3, thirdPlaceLoss, 0),
      match(groupLetter, 2, 4, 2, 0),
      match(groupLetter, 3, 4, thirdPlaceWin, 0),
    ];
  });
}

function match(
  groupLetter: string,
  teamAPosition: number,
  teamBPosition: number,
  scoreA: number,
  scoreB: number,
): GroupMatch {
  return {
    status: "complete",
    teamAId: teamId(groupLetter, teamAPosition),
    teamBId: teamId(groupLetter, teamBPosition),
    scoreA,
    scoreB,
  };
}

function makeEmptyRoundOf32Matches(): ExistingRoundOf32Match[] {
  return Array.from({ length: 16 }, () => ({ teamAId: null, teamBId: null }));
}

function teamId(groupLetter: string, position: number) {
  return (groupLetter.charCodeAt(0) - 64) * 10 + position;
}
