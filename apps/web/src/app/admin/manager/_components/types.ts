export type Round = {
  id: number;
  title: string;
  status: string;
};

export type Match = {
  id: number;
  status: string;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
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
