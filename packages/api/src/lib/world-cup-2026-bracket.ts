import {
  knockoutAdvanceSlots,
  roundOf32Assignments,
  roundOf32ThirdPlaceSlotOrder,
  thirdPlaceMatrix,
  type MatchSide,
} from "@codecon/db/world-cup-2026";

export class BracketRuleError extends Error {
  public readonly reason: "conflict" | "not_found" | "precondition";

  constructor(
    message: string,
    reason: "conflict" | "not_found" | "precondition",
  ) {
    super(message);
    this.name = "BracketRuleError";
    this.reason = reason;
  }
}

export type GroupTeam = {
  id: number;
  name: string;
  groupName: string;
};

export type GroupMatch = {
  status: string;
  teamAId: number | null;
  teamBId: number | null;
  scoreA: number | null;
  scoreB: number | null;
};

export type ExistingRoundOf32Match = {
  teamAId: number | null;
  teamBId: number | null;
};

export type RoundOf32Update = {
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
  status: "draft" | "pending";
};

export type CompletedKnockoutMatch = {
  matchNumber: number | null;
  teamAId: number | null;
  teamBId: number | null;
  scoreA: number;
  scoreB: number;
};

export type KnockoutPlacement = {
  matchNumber: number;
  side: MatchSide;
  teamId: number;
};

export type KnockoutTargetMatch = {
  id: number;
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
};

export type KnockoutTargetUpdate = {
  id: number;
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
  status: "draft" | "pending";
};

type TeamStanding = {
  id: number;
  name: string;
  groupLetter: string;
  points: number;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
};

export function getRoundOf32Updates({
  groupMatches,
  teams,
  existingRoundOf32Matches,
}: {
  groupMatches: GroupMatch[];
  teams: GroupTeam[];
  existingRoundOf32Matches: ExistingRoundOf32Match[];
}): RoundOf32Update[] | null {
  if (
    groupMatches.length === 0 ||
    groupMatches.some(
      (match) =>
        match.status !== "complete" ||
        match.teamAId === null ||
        match.teamBId === null ||
        match.scoreA === null ||
        match.scoreB === null,
    )
  ) {
    return null;
  }

  if (
    existingRoundOf32Matches.some(
      (match) => match.teamAId !== null || match.teamBId !== null,
    )
  ) {
    return null;
  }

  const qualifiedBySlot = getQualifiedTeamsBySlot(groupMatches, teams);
  const thirdPlaceSlots = getThirdPlaceSlots(qualifiedBySlot);
  const thirdPlaceTeamByMatchNumber = getThirdPlaceTeamByMatchNumber(
    qualifiedBySlot,
    thirdPlaceSlots,
  );

  return Object.entries(roundOf32Assignments).map(
    ([matchNumber, assignment]) => {
      const numericMatchNumber = Number(matchNumber);
      const teamAId = resolveRoundOf32Slot(
        assignment.teamAId,
        numericMatchNumber,
        qualifiedBySlot,
        thirdPlaceTeamByMatchNumber,
      );
      const teamBId = resolveRoundOf32Slot(
        assignment.teamBId,
        numericMatchNumber,
        qualifiedBySlot,
        thirdPlaceTeamByMatchNumber,
      );

      return {
        matchNumber: numericMatchNumber,
        teamAId,
        teamBId,
        status: teamAId !== null && teamBId !== null ? "pending" : "draft",
      };
    },
  );
}

export function getKnockoutPlacements(
  match: CompletedKnockoutMatch,
): KnockoutPlacement[] {
  if (match.matchNumber === null) return [];

  if (match.teamAId === null || match.teamBId === null) {
    throw new BracketRuleError(
      "A partida precisa ter dois times definidos",
      "precondition",
    );
  }

  if (match.scoreA === match.scoreB) {
    throw new BracketRuleError(
      "Partidas eliminatórias precisam de um vencedor",
      "precondition",
    );
  }

  const slots =
    knockoutAdvanceSlots[match.matchNumber as keyof typeof knockoutAdvanceSlots];

  if (!slots) return [];

  const winnerTeamId = match.scoreA > match.scoreB ? match.teamAId : match.teamBId;
  const loserTeamId = match.scoreA > match.scoreB ? match.teamBId : match.teamAId;

  return slots.map((slot) => ({
    matchNumber: slot.matchNumber,
    side: slot.side,
    teamId: "loser" in slot && slot.loser ? loserTeamId : winnerTeamId,
  }));
}

export function applyKnockoutPlacement(
  targetMatch: KnockoutTargetMatch | undefined,
  placement: KnockoutPlacement,
): KnockoutTargetUpdate {
  if (!targetMatch) {
    throw new BracketRuleError(
      `Partida ${placement.matchNumber} não encontrada`,
      "not_found",
    );
  }

  const currentTeamId = targetMatch[placement.side];

  if (currentTeamId !== null && currentTeamId !== placement.teamId) {
    throw new BracketRuleError(
      `A vaga da partida ${placement.matchNumber} já está ocupada`,
      "conflict",
    );
  }

  const teamAId =
    placement.side === "teamAId" ? placement.teamId : targetMatch.teamAId;
  const teamBId =
    placement.side === "teamBId" ? placement.teamId : targetMatch.teamBId;

  return {
    id: targetMatch.id,
    matchNumber: targetMatch.matchNumber,
    teamAId,
    teamBId,
    status: teamAId !== null && teamBId !== null ? "pending" : "draft",
  };
}

function getQualifiedTeamsBySlot(groupMatches: GroupMatch[], teams: GroupTeam[]) {
  const standingsByTeamId = new Map<number, TeamStanding>();
  const standingsByGroup = new Map<string, TeamStanding[]>();

  for (const team of teams) {
    const groupLetter = getGroupLetter(team.groupName);
    const standing: TeamStanding = {
      id: team.id,
      name: team.name,
      groupLetter,
      points: 0,
      wins: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };

    standingsByTeamId.set(team.id, standing);
    standingsByGroup.set(groupLetter, [
      ...(standingsByGroup.get(groupLetter) ?? []),
      standing,
    ]);
  }

  for (const match of groupMatches) {
    const teamAStanding = standingsByTeamId.get(match.teamAId!);
    const teamBStanding = standingsByTeamId.get(match.teamBId!);

    if (!teamAStanding || !teamBStanding) {
      throw new BracketRuleError(
        "Há partidas de grupo com times sem grupo válido",
        "precondition",
      );
    }

    applyGroupResult(teamAStanding, teamBStanding, match.scoreA!, match.scoreB!);
  }

  const qualifiedBySlot = new Map<string, number>();
  const thirdPlaceTeams: TeamStanding[] = [];

  for (const groupLetter of "ABCDEFGHIJKL") {
    const groupStandings = standingsByGroup.get(groupLetter)?.sort(compareTeams);
    const firstPlace = groupStandings?.[0];
    const secondPlace = groupStandings?.[1];
    const thirdPlace = groupStandings?.[2];

    if (!firstPlace || !secondPlace || !thirdPlace) {
      throw new BracketRuleError(
        `Grupo ${groupLetter} não possui times suficientes`,
        "precondition",
      );
    }

    qualifiedBySlot.set(`1${groupLetter}`, firstPlace.id);
    qualifiedBySlot.set(`2${groupLetter}`, secondPlace.id);
    qualifiedBySlot.set(`3${groupLetter}`, thirdPlace.id);
    thirdPlaceTeams.push(thirdPlace);
  }

  for (const thirdPlaceTeam of thirdPlaceTeams.sort(compareTeams).slice(0, 8)) {
    qualifiedBySlot.set(`Q3${thirdPlaceTeam.groupLetter}`, thirdPlaceTeam.id);
  }

  return qualifiedBySlot;
}

function getThirdPlaceSlots(qualifiedBySlot: Map<string, number>) {
  const qualifiedThirdGroups = [...qualifiedBySlot.keys()]
    .filter((slot) => slot.startsWith("Q3"))
    .map((slot) => slot.replace("Q3", ""))
    .sort()
    .join("");
  const thirdPlaceSlots = thirdPlaceMatrix.get(qualifiedThirdGroups);

  if (!thirdPlaceSlots) {
    throw new BracketRuleError(
      "Combinação de terceiros colocados não encontrada",
      "precondition",
    );
  }

  return thirdPlaceSlots;
}

function getThirdPlaceTeamByMatchNumber(
  qualifiedBySlot: Map<string, number>,
  thirdPlaceSlots: string[],
) {
  const thirdPlaceTeamByMatchNumber = new Map<number, number>();

  roundOf32ThirdPlaceSlotOrder.forEach((slot, index) => {
    const groupLetter = thirdPlaceSlots[index];
    const teamId = qualifiedBySlot.get(`3${groupLetter}`);

    if (!teamId) {
      throw new BracketRuleError(
        "Terceiro colocado classificado não encontrado",
        "precondition",
      );
    }

    thirdPlaceTeamByMatchNumber.set(slot.matchNumber, teamId);
  });

  return thirdPlaceTeamByMatchNumber;
}

function resolveRoundOf32Slot(
  slot: string,
  matchNumber: number,
  qualifiedBySlot: Map<string, number>,
  thirdPlaceTeamByMatchNumber: Map<number, number>,
) {
  if (slot === "3") return thirdPlaceTeamByMatchNumber.get(matchNumber) ?? null;
  return qualifiedBySlot.get(slot) ?? null;
}

function applyGroupResult(
  teamAStanding: TeamStanding,
  teamBStanding: TeamStanding,
  scoreA: number,
  scoreB: number,
) {
  teamAStanding.goalsFor += scoreA;
  teamAStanding.goalsAgainst += scoreB;
  teamBStanding.goalsFor += scoreB;
  teamBStanding.goalsAgainst += scoreA;

  if (scoreA > scoreB) {
    teamAStanding.points += 3;
    teamAStanding.wins += 1;
  } else if (scoreB > scoreA) {
    teamBStanding.points += 3;
    teamBStanding.wins += 1;
  } else {
    teamAStanding.points += 1;
    teamBStanding.points += 1;
  }
}

function compareTeams(teamAStanding: TeamStanding, teamBStanding: TeamStanding) {
  const goalDifferenceA =
    teamAStanding.goalsFor - teamAStanding.goalsAgainst;
  const goalDifferenceB =
    teamBStanding.goalsFor - teamBStanding.goalsAgainst;

  return (
    teamBStanding.points - teamAStanding.points ||
    goalDifferenceB - goalDifferenceA ||
    teamBStanding.goalsFor - teamAStanding.goalsFor ||
    teamBStanding.wins - teamAStanding.wins ||
    teamAStanding.name.localeCompare(teamBStanding.name, "pt-BR") ||
    teamAStanding.id - teamBStanding.id
  );
}

function getGroupLetter(groupName: string) {
  return groupName.replace("Grupo ", "");
}
