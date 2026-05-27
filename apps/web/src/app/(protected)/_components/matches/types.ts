export type Match = {
  id: number;
  status: string;
  roundNumber: number;
  teamAGroupId: number;
  teamAGroupName: string;
  teamAName: string;
  teamAFlag: string;
  teamBGroupId: number;
  teamBName: string;
  teamBFlag: string;
  date: string | Date;
  scoreA: number | null;
  scoreB: number | null;
  hasBet: boolean;
  betScoreA: number | null;
  betScoreB: number | null;
  betModifier: string | null;
};

export type MatchGroup = {
  id: number;
  name: string;
  matches: Match[];
};

export type BetModifier =
  | "invert_bet"
  | "double_points"
  | "half_points"
  | "invalid_bet"
  | "lucky_duck"
  | "normal";

export type BetWheelOption = {
  value: BetModifier;
  label: string;
  description: string;
};

export type SavedBet = {
  scoreA: number;
  scoreB: number;
  modifier: BetModifier;
};
