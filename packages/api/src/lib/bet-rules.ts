export type BettableMatch = {
  status: string;
  scoreA: number | null;
  scoreB: number | null;
  date: Date;
};

export function isBetClosed(match: BettableMatch, now = new Date()) {
  return (
    match.status !== "pending" ||
    match.scoreA !== null ||
    match.scoreB !== null ||
    match.date <= now
  );
}
