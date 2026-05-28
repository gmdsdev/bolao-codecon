import { describe, expect, test } from "vitest";

import { isBetClosed, type BettableMatch } from "./bet-rules";

const now = new Date("2026-06-10T12:00:00Z");
const scoreClosedCases: Array<{ scoreA: number | null; scoreB: number | null }> =
  [
    { scoreA: 1, scoreB: null },
    { scoreA: null, scoreB: 1 },
    { scoreA: 0, scoreB: 0 },
  ];

describe("isBetClosed", () => {
  test("keeps betting open for pending future matches with no score", () => {
    expect(
      isBetClosed(
        makeMatch({ status: "pending", date: "2026-06-10T12:00:01Z" }),
        now,
      ),
    ).toBe(false);
  });

  test.each(["draft", "complete", "cancelled"])(
    "closes betting when match status is %s",
    (status: string) => {
      expect(
        isBetClosed(
          makeMatch({ status, date: "2026-06-10T12:00:01Z" }),
          now,
        ),
      ).toBe(true);
    },
  );

  test("closes betting exactly at kickoff time", () => {
    expect(
      isBetClosed(makeMatch({ status: "pending", date: now }), now),
    ).toBe(true);
  });

  test("closes betting after kickoff time", () => {
    expect(
      isBetClosed(
        makeMatch({ status: "pending", date: "2026-06-10T11:59:59Z" }),
        now,
      ),
    ).toBe(true);
  });

  test.each(scoreClosedCases)(
    "closes betting when any score is already present",
    (scores: { scoreA: number | null; scoreB: number | null }) => {
      expect(
        isBetClosed(
          makeMatch({
            status: "pending",
            date: "2026-06-10T12:00:01Z",
            ...scores,
          }),
          now,
        ),
      ).toBe(true);
    },
  );
});

function makeMatch({
  status,
  date,
  scoreA = null,
  scoreB = null,
}: {
  status: string;
  date: string | Date;
  scoreA?: number | null;
  scoreB?: number | null;
}): BettableMatch {
  return {
    status,
    date: date instanceof Date ? date : new Date(date),
    scoreA,
    scoreB,
  };
}
