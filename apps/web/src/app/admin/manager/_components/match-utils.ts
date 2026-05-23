import type { Stadium, Team } from "./types";

export const NO_EXPECTED_WINNER_VALUE = "none";

export function formatDatetimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function getStadiumOptions(stadiums: Stadium[]) {
  return stadiums.map((stadium) => ({
    value: String(stadium.id),
    label: `${stadium.name} - ${stadium.city}`,
  }));
}

export function getTeamOptions(teams: Team[]) {
  return teams.map((team) => ({
    value: String(team.id),
    label: `${team.flag} ${team.name}`,
  }));
}

export function formatDatetimeLocalFromDate(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function formatDateTimeDisplay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isValidDatetimeLocal(value: string) {
  return value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

export function datetimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}
