export type BetLog = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  matchId: number;
  matchDate: string;
  matchStatus: string;
  roundTitle: string;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
  scoreA: number;
  scoreB: number;
  modifier: string;
  createdAt: string;
  totalPoints: number | null;
};

export type BetLogsData = {
  rows: BetLog[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type BetModifierFilter =
  | "all"
  | "invert_bet"
  | "double_points"
  | "half_points"
  | "invalid_bet"
  | "lucky_duck"
  | "normal";

export type MatchStatusFilter = "all" | "complete" | "not_complete";

export type UserFilterOption = {
  id: string;
  name: string;
  email: string;
};
