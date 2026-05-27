export type Round = {
  id: number;
  title: string;
  status: string;
};

export type Match = {
  id: number;
  status: string;
  teamAId: number | null;
  teamBId: number | null;
  teamAName: string | null;
  teamAFlag: string | null;
  teamBName: string | null;
  teamBFlag: string | null;
  date: string;
  scoreA: number | null;
  scoreB: number | null;
  stadiumId: number;
  stadiumName: string;
  stadiumCity: string;
  expectedWinnerName: string | null;
  totalBets: number;
};

export type Team = {
  id: number;
  name: string;
  flag: string;
};

export type Stadium = {
  id: number;
  name: string;
  city: string;
};

export type ExpectedWinner = "teamA" | "teamB";
