import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  account,
  bet,
  match,
  ranking,
  round,
  stadium,
  team,
  teamGroup,
  user,
} from "./schema";

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "apps/server/.env"),
  resolve(process.cwd(), "../../apps/server/.env"),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false, quiet: true });
  }
}

const { env } = await import("@codecon/env/server");

const seedLogin = {
  name: "CodeCon Seed User",
  email: "seed.user@codecon.local",
  password: `CodeCon-${randomBytes(8).toString("hex")}`,
};

const seedUsers = [seedLogin];

// ===================================================================
// COPA DO MUNDO FIFA 2026 — DADOS BASE
// ===================================================================

// 16 Estádios oficiais da Copa do Mundo FIFA 2026
const seedStadiums = [
  // México (3)
  { name: "Estadio Azteca",          city: "Cidade do México, México" },
  { name: "Estadio Akron",           city: "Guadalajara, México" },
  { name: "Estadio BBVA",            city: "Monterrey, México" },
  // Canadá (2)
  { name: "BMO Field",               city: "Toronto, Canadá" },
  { name: "BC Place",                city: "Vancouver, Canadá" },
  // Estados Unidos (11)
  { name: "MetLife Stadium",         city: "East Rutherford, Nova Jersey, EUA" },
  { name: "Gillette Stadium",        city: "Foxborough, Massachusetts, EUA" },
  { name: "SoFi Stadium",            city: "Inglewood, Califórnia, EUA" },
  { name: "AT&T Stadium",            city: "Arlington, Texas, EUA" },
  { name: "Mercedes-Benz Stadium",   city: "Atlanta, Geórgia, EUA" },
  { name: "Levi's Stadium",          city: "Santa Clara, Califórnia, EUA" },
  { name: "NRG Stadium",             city: "Houston, Texas, EUA" },
  { name: "Arrowhead Stadium",       city: "Kansas City, Missouri, EUA" },
  { name: "Hard Rock Stadium",       city: "Miami Gardens, Flórida, EUA" },
  { name: "Lincoln Financial Field", city: "Filadélfia, Pensilvânia, EUA" },
  { name: "Lumen Field",             city: "Seattle, Washington, EUA" },
];

const seedStadiumNames = seedStadiums.map((s) => s.name);

// 12 Grupos (A–L)
const seedGroupNames = Array.from(
  { length: 12 },
  (_, index) => `Grupo ${String.fromCharCode(65 + index)}`,
);

// 48 Seleções classificadas com seus grupos
const seedTeams = [
  // GRUPO A
  { name: "Mexico",          flag: "🇲🇽", groupName: "Grupo A" },
  { name: "South Africa",    flag: "🇿🇦", groupName: "Grupo A" },
  { name: "Korea Republic",  flag: "🇰🇷", groupName: "Grupo A" },
  { name: "Czechia",         flag: "🇨🇿", groupName: "Grupo A" },
  // GRUPO B
  { name: "Canada",                   flag: "🇨🇦", groupName: "Grupo B" },
  { name: "Bosnia and Herzegovina",   flag: "🇧🇦", groupName: "Grupo B" },
  { name: "Qatar",                    flag: "🇶🇦", groupName: "Grupo B" },
  { name: "Switzerland",              flag: "🇨🇭", groupName: "Grupo B" },
  // GRUPO C
  { name: "Brazil",   flag: "🇧🇷",                                                    groupName: "Grupo C" },
  { name: "Morocco",  flag: "🇲🇦",                                                    groupName: "Grupo C" },
  { name: "Haiti",    flag: "🇭🇹",                                                    groupName: "Grupo C" },
  { name: "Scotland", flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", groupName: "Grupo C" },
  // GRUPO D
  { name: "United States", flag: "🇺🇸", groupName: "Grupo D" },
  { name: "Paraguay",      flag: "🇵🇾", groupName: "Grupo D" },
  { name: "Australia",     flag: "🇦🇺", groupName: "Grupo D" },
  { name: "Türkiye",       flag: "🇹🇷", groupName: "Grupo D" },
  // GRUPO E
  { name: "Germany",     flag: "🇩🇪", groupName: "Grupo E" },
  { name: "Curaçao",     flag: "🇨🇼", groupName: "Grupo E" },
  { name: "Ivory Coast", flag: "🇨🇮", groupName: "Grupo E" },
  { name: "Ecuador",     flag: "🇪🇨", groupName: "Grupo E" },
  // GRUPO F
  { name: "Netherlands", flag: "🇳🇱", groupName: "Grupo F" },
  { name: "Japan",       flag: "🇯🇵", groupName: "Grupo F" },
  { name: "Sweden",      flag: "🇸🇪", groupName: "Grupo F" },
  { name: "Tunisia",     flag: "🇹🇳", groupName: "Grupo F" },
  // GRUPO G
  { name: "Belgium",     flag: "🇧🇪", groupName: "Grupo G" },
  { name: "Egypt",       flag: "🇪🇬", groupName: "Grupo G" },
  { name: "Iran",        flag: "🇮🇷", groupName: "Grupo G" },
  { name: "New Zealand", flag: "🇳🇿", groupName: "Grupo G" },
  // GRUPO H
  { name: "Spain",        flag: "🇪🇸", groupName: "Grupo H" },
  { name: "Cape Verde",   flag: "🇨🇻", groupName: "Grupo H" },
  { name: "Saudi Arabia", flag: "🇸🇦", groupName: "Grupo H" },
  { name: "Uruguay",      flag: "🇺🇾", groupName: "Grupo H" },
  // GRUPO I
  { name: "France",  flag: "🇫🇷", groupName: "Grupo I" },
  { name: "Senegal", flag: "🇸🇳", groupName: "Grupo I" },
  { name: "Iraq",    flag: "🇮🇶", groupName: "Grupo I" },
  { name: "Norway",  flag: "🇳🇴", groupName: "Grupo I" },
  // GRUPO J
  { name: "Argentina", flag: "🇦🇷", groupName: "Grupo J" },
  { name: "Algeria",   flag: "🇩🇿", groupName: "Grupo J" },
  { name: "Austria",   flag: "🇦🇹", groupName: "Grupo J" },
  { name: "Jordan",    flag: "🇯🇴", groupName: "Grupo J" },
  // GRUPO K
  { name: "Portugal",   flag: "🇵🇹", groupName: "Grupo K" },
  { name: "DR Congo",   flag: "🇨🇩", groupName: "Grupo K" },
  { name: "Uzbekistan", flag: "🇺🇿", groupName: "Grupo K" },
  { name: "Colombia",   flag: "🇨🇴", groupName: "Grupo K" },
  // GRUPO L
  { name: "England", flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", groupName: "Grupo L" },
  { name: "Croatia", flag: "🇭🇷", groupName: "Grupo L" },
  { name: "Ghana",   flag: "🇬🇭", groupName: "Grupo L" },
  { name: "Panama",  flag: "🇵🇦", groupName: "Grupo L" },
];

const seedTeamNames = seedTeams.map((t) => t.name);

const seedRounds = [
  { number: 1, title: "Fase de grupos - Rodada 1",   status: "pending" },
  { number: 2, title: "Fase de grupos - Rodada 2",   status: "pending" },
  { number: 3, title: "Fase de grupos - Rodada 3",   status: "pending" },
  { number: 4, title: "Dezesseis avos de final",      status: "pending" },
  { number: 5, title: "Oitavas de final",             status: "pending" },
  { number: 6, title: "Quartas de final",             status: "pending" },
  { number: 7, title: "Semifinal",                   status: "pending" },
  { number: 8, title: "Disputa pelo terceiro lugar", status: "pending" },
  { number: 9, title: "Final",                       status: "pending" },
];

// ===================================================================
// PARTIDAS DA FASE DE GRUPOS — 72 JOGOS
// Horários em UTC (EDT = UTC-4 em junho de 2026)
// Fonte: calendário oficial FIFA 2026
// ===================================================================
const seedGroupStageMatches: {
  teamA: string;
  teamB: string;
  round: number;
  date: Date;
  stadiumName: string;
}[] = [
  // ──────────────────────────────────────────────────────────────────
  // RODADA 1
  // ──────────────────────────────────────────────────────────────────

  // GRUPO A
  { teamA: "Mexico",         teamB: "South Africa",           round: 1, date: new Date("2026-06-11T19:00:00Z"), stadiumName: "Estadio Azteca" },
  { teamA: "Korea Republic", teamB: "Czechia",                round: 1, date: new Date("2026-06-12T02:00:00Z"), stadiumName: "Estadio Akron" },
  // GRUPO B
  { teamA: "Canada",         teamB: "Bosnia and Herzegovina", round: 1, date: new Date("2026-06-12T19:00:00Z"), stadiumName: "BMO Field" },
  { teamA: "Qatar",          teamB: "Switzerland",            round: 1, date: new Date("2026-06-13T19:00:00Z"), stadiumName: "Levi's Stadium" },
  // GRUPO C
  { teamA: "Brazil",         teamB: "Morocco",                round: 1, date: new Date("2026-06-13T22:00:00Z"), stadiumName: "MetLife Stadium" },
  { teamA: "Haiti",          teamB: "Scotland",               round: 1, date: new Date("2026-06-14T01:00:00Z"), stadiumName: "Gillette Stadium" },
  // GRUPO D
  { teamA: "United States",  teamB: "Paraguay",               round: 1, date: new Date("2026-06-13T01:00:00Z"), stadiumName: "SoFi Stadium" },
  { teamA: "Australia",      teamB: "Türkiye",                round: 1, date: new Date("2026-06-13T04:00:00Z"), stadiumName: "BC Place" },
  // GRUPO E
  { teamA: "Germany",        teamB: "Curaçao",                round: 1, date: new Date("2026-06-14T17:00:00Z"), stadiumName: "NRG Stadium" },
  { teamA: "Ivory Coast",    teamB: "Ecuador",                round: 1, date: new Date("2026-06-14T23:00:00Z"), stadiumName: "Lincoln Financial Field" },
  // GRUPO F
  { teamA: "Netherlands",    teamB: "Japan",                  round: 1, date: new Date("2026-06-14T20:00:00Z"), stadiumName: "AT&T Stadium" },
  { teamA: "Sweden",         teamB: "Tunisia",                round: 1, date: new Date("2026-06-15T02:00:00Z"), stadiumName: "Estadio BBVA" },
  // GRUPO G
  { teamA: "Belgium",        teamB: "Egypt",                  round: 1, date: new Date("2026-06-15T19:00:00Z"), stadiumName: "Lumen Field" },
  { teamA: "Iran",           teamB: "New Zealand",            round: 1, date: new Date("2026-06-16T01:00:00Z"), stadiumName: "SoFi Stadium" },
  // GRUPO H
  { teamA: "Spain",          teamB: "Cape Verde",             round: 1, date: new Date("2026-06-15T16:00:00Z"), stadiumName: "Mercedes-Benz Stadium" },
  { teamA: "Saudi Arabia",   teamB: "Uruguay",                round: 1, date: new Date("2026-06-15T22:00:00Z"), stadiumName: "Hard Rock Stadium" },
  // GRUPO I
  { teamA: "France",         teamB: "Senegal",                round: 1, date: new Date("2026-06-16T19:00:00Z"), stadiumName: "MetLife Stadium" },
  { teamA: "Iraq",           teamB: "Norway",                 round: 1, date: new Date("2026-06-16T22:00:00Z"), stadiumName: "Gillette Stadium" },
  // GRUPO J
  { teamA: "Argentina",      teamB: "Algeria",                round: 1, date: new Date("2026-06-17T01:00:00Z"), stadiumName: "Arrowhead Stadium" },
  { teamA: "Austria",        teamB: "Jordan",                 round: 1, date: new Date("2026-06-17T04:00:00Z"), stadiumName: "Levi's Stadium" },
  // GRUPO K
  { teamA: "Portugal",       teamB: "DR Congo",               round: 1, date: new Date("2026-06-17T17:00:00Z"), stadiumName: "NRG Stadium" },
  { teamA: "Uzbekistan",     teamB: "Colombia",               round: 1, date: new Date("2026-06-18T02:00:00Z"), stadiumName: "Estadio Azteca" },
  // GRUPO L
  { teamA: "England",        teamB: "Croatia",                round: 1, date: new Date("2026-06-17T20:00:00Z"), stadiumName: "AT&T Stadium" },
  { teamA: "Ghana",          teamB: "Panama",                 round: 1, date: new Date("2026-06-17T23:00:00Z"), stadiumName: "BMO Field" },

  // ──────────────────────────────────────────────────────────────────
  // RODADA 2
  // ──────────────────────────────────────────────────────────────────

  // GRUPO A
  { teamA: "Czechia",                  teamB: "South Africa",           round: 2, date: new Date("2026-06-18T16:00:00Z"), stadiumName: "Mercedes-Benz Stadium" },
  { teamA: "Mexico",                   teamB: "Korea Republic",         round: 2, date: new Date("2026-06-19T01:00:00Z"), stadiumName: "Estadio Akron" },
  // GRUPO B
  { teamA: "Switzerland",              teamB: "Bosnia and Herzegovina", round: 2, date: new Date("2026-06-18T19:00:00Z"), stadiumName: "SoFi Stadium" },
  { teamA: "Canada",                   teamB: "Qatar",                  round: 2, date: new Date("2026-06-18T22:00:00Z"), stadiumName: "BC Place" },
  // GRUPO C
  { teamA: "Scotland",                 teamB: "Morocco",                round: 2, date: new Date("2026-06-19T22:00:00Z"), stadiumName: "Gillette Stadium" },
  { teamA: "Brazil",                   teamB: "Haiti",                  round: 2, date: new Date("2026-06-20T00:30:00Z"), stadiumName: "Lincoln Financial Field" },
  // GRUPO D
  { teamA: "United States",            teamB: "Australia",              round: 2, date: new Date("2026-06-19T19:00:00Z"), stadiumName: "Lumen Field" },
  { teamA: "Türkiye",                  teamB: "Paraguay",               round: 2, date: new Date("2026-06-20T03:00:00Z"), stadiumName: "Levi's Stadium" },
  // GRUPO E
  { teamA: "Germany",                  teamB: "Ivory Coast",            round: 2, date: new Date("2026-06-20T20:00:00Z"), stadiumName: "BMO Field" },
  { teamA: "Ecuador",                  teamB: "Curaçao",                round: 2, date: new Date("2026-06-21T00:00:00Z"), stadiumName: "Arrowhead Stadium" },
  // GRUPO F
  { teamA: "Netherlands",              teamB: "Sweden",                 round: 2, date: new Date("2026-06-20T17:00:00Z"), stadiumName: "NRG Stadium" },
  { teamA: "Tunisia",                  teamB: "Japan",                  round: 2, date: new Date("2026-06-21T04:00:00Z"), stadiumName: "Estadio BBVA" },
  // GRUPO G
  { teamA: "Belgium",                  teamB: "Iran",                   round: 2, date: new Date("2026-06-21T19:00:00Z"), stadiumName: "SoFi Stadium" },
  { teamA: "New Zealand",              teamB: "Egypt",                  round: 2, date: new Date("2026-06-22T01:00:00Z"), stadiumName: "BC Place" },
  // GRUPO H
  { teamA: "Spain",                    teamB: "Saudi Arabia",           round: 2, date: new Date("2026-06-21T16:00:00Z"), stadiumName: "Mercedes-Benz Stadium" },
  { teamA: "Uruguay",                  teamB: "Cape Verde",             round: 2, date: new Date("2026-06-21T22:00:00Z"), stadiumName: "Hard Rock Stadium" },
  // GRUPO I
  { teamA: "France",                   teamB: "Iraq",                   round: 2, date: new Date("2026-06-22T21:00:00Z"), stadiumName: "Lincoln Financial Field" },
  { teamA: "Norway",                   teamB: "Senegal",                round: 2, date: new Date("2026-06-23T00:00:00Z"), stadiumName: "MetLife Stadium" },
  // GRUPO J
  { teamA: "Argentina",                teamB: "Austria",                round: 2, date: new Date("2026-06-22T17:00:00Z"), stadiumName: "AT&T Stadium" },
  { teamA: "Jordan",                   teamB: "Algeria",                round: 2, date: new Date("2026-06-23T03:00:00Z"), stadiumName: "Levi's Stadium" },
  // GRUPO K
  { teamA: "Portugal",                 teamB: "Uzbekistan",             round: 2, date: new Date("2026-06-23T17:00:00Z"), stadiumName: "NRG Stadium" },
  { teamA: "Colombia",                 teamB: "DR Congo",               round: 2, date: new Date("2026-06-24T02:00:00Z"), stadiumName: "Estadio Akron" },
  // GRUPO L
  { teamA: "England",                  teamB: "Ghana",                  round: 2, date: new Date("2026-06-23T20:00:00Z"), stadiumName: "Gillette Stadium" },
  { teamA: "Panama",                   teamB: "Croatia",                round: 2, date: new Date("2026-06-23T23:00:00Z"), stadiumName: "BMO Field" },

  // ──────────────────────────────────────────────────────────────────
  // RODADA 3 (partidas simultâneas por grupo)
  // ──────────────────────────────────────────────────────────────────

  // GRUPO A — 24 jun (21h ET = 25 jun 01h UTC)
  { teamA: "Czechia",                  teamB: "Mexico",                 round: 3, date: new Date("2026-06-25T01:00:00Z"), stadiumName: "Estadio Azteca" },
  { teamA: "South Africa",             teamB: "Korea Republic",         round: 3, date: new Date("2026-06-25T01:00:00Z"), stadiumName: "Estadio BBVA" },
  // GRUPO B — 24 jun (15h ET = 19h UTC)
  { teamA: "Switzerland",              teamB: "Canada",                 round: 3, date: new Date("2026-06-24T19:00:00Z"), stadiumName: "BC Place" },
  { teamA: "Bosnia and Herzegovina",   teamB: "Qatar",                  round: 3, date: new Date("2026-06-24T19:00:00Z"), stadiumName: "Lumen Field" },
  // GRUPO C — 24 jun (18h ET = 22h UTC)
  { teamA: "Scotland",                 teamB: "Brazil",                 round: 3, date: new Date("2026-06-24T22:00:00Z"), stadiumName: "Hard Rock Stadium" },
  { teamA: "Morocco",                  teamB: "Haiti",                  round: 3, date: new Date("2026-06-24T22:00:00Z"), stadiumName: "Mercedes-Benz Stadium" },
  // GRUPO D — 25 jun (22h ET = 26 jun 02h UTC)
  { teamA: "Türkiye",                  teamB: "United States",          round: 3, date: new Date("2026-06-26T02:00:00Z"), stadiumName: "SoFi Stadium" },
  { teamA: "Paraguay",                 teamB: "Australia",              round: 3, date: new Date("2026-06-26T02:00:00Z"), stadiumName: "Levi's Stadium" },
  // GRUPO E — 25 jun (16h ET = 20h UTC)
  { teamA: "Ecuador",                  teamB: "Germany",                round: 3, date: new Date("2026-06-25T20:00:00Z"), stadiumName: "MetLife Stadium" },
  { teamA: "Curaçao",                  teamB: "Ivory Coast",            round: 3, date: new Date("2026-06-25T20:00:00Z"), stadiumName: "Lincoln Financial Field" },
  // GRUPO F — 25 jun (19h ET = 23h UTC)
  { teamA: "Japan",                    teamB: "Sweden",                 round: 3, date: new Date("2026-06-25T23:00:00Z"), stadiumName: "AT&T Stadium" },
  { teamA: "Tunisia",                  teamB: "Netherlands",            round: 3, date: new Date("2026-06-25T23:00:00Z"), stadiumName: "Arrowhead Stadium" },
  // GRUPO G — 26 jun (23h ET = 27 jun 03h UTC)
  { teamA: "Egypt",                    teamB: "Iran",                   round: 3, date: new Date("2026-06-27T03:00:00Z"), stadiumName: "Lumen Field" },
  { teamA: "New Zealand",              teamB: "Belgium",                round: 3, date: new Date("2026-06-27T03:00:00Z"), stadiumName: "BC Place" },
  // GRUPO H — 26 jun (20h ET = 27 jun 00h UTC)
  { teamA: "Cape Verde",               teamB: "Saudi Arabia",           round: 3, date: new Date("2026-06-27T00:00:00Z"), stadiumName: "NRG Stadium" },
  { teamA: "Uruguay",                  teamB: "Spain",                  round: 3, date: new Date("2026-06-27T00:00:00Z"), stadiumName: "Estadio Akron" },
  // GRUPO I — 26 jun (15h ET = 19h UTC)
  { teamA: "Norway",                   teamB: "France",                 round: 3, date: new Date("2026-06-26T19:00:00Z"), stadiumName: "Gillette Stadium" },
  { teamA: "Senegal",                  teamB: "Iraq",                   round: 3, date: new Date("2026-06-26T19:00:00Z"), stadiumName: "BMO Field" },
  // GRUPO J — 27 jun (22h ET = 28 jun 02h UTC)
  { teamA: "Jordan",                   teamB: "Argentina",              round: 3, date: new Date("2026-06-28T02:00:00Z"), stadiumName: "AT&T Stadium" },
  { teamA: "Algeria",                  teamB: "Austria",                round: 3, date: new Date("2026-06-28T02:00:00Z"), stadiumName: "Arrowhead Stadium" },
  // GRUPO K — 27 jun (19h30 ET = 23h30 UTC)
  { teamA: "Colombia",                 teamB: "Portugal",               round: 3, date: new Date("2026-06-27T23:30:00Z"), stadiumName: "Hard Rock Stadium" },
  { teamA: "DR Congo",                 teamB: "Uzbekistan",             round: 3, date: new Date("2026-06-27T23:30:00Z"), stadiumName: "Mercedes-Benz Stadium" },
  // GRUPO L — 27 jun (17h ET = 21h UTC)
  { teamA: "Panama",                   teamB: "England",                round: 3, date: new Date("2026-06-27T21:00:00Z"), stadiumName: "MetLife Stadium" },
  { teamA: "Croatia",                  teamB: "Ghana",                  round: 3, date: new Date("2026-06-27T21:00:00Z"), stadiumName: "Lincoln Financial Field" },
];

// ===================================================================
// CONFIGURAÇÃO DO BANCO
// ===================================================================

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, {
  schema: {
    account,
    bet,
    match,
    ranking,
    round,
    stadium,
    team,
    teamGroup,
    user,
  },
});

try {
  const result = await db.transaction(async (tx) => {
    // ------------------------------------------------------------------
    // 1. Limpeza de dados de seed anteriores
    // ------------------------------------------------------------------
    const existingSeedUsers = await tx
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(inArray(user.email, seedUsers.map((u) => u.email)));

    if (existingSeedUsers.length > 0) {
      await tx.delete(ranking).where(
        inArray(ranking.userId, existingSeedUsers.map((u) => u.id)),
      );
    }

    const existingSeedRounds = await tx
      .select({ id: round.id, title: round.title })
      .from(round)
      .where(inArray(round.title, seedRounds.map((r) => r.title)));

    if (existingSeedRounds.length > 0) {
      await tx.delete(match).where(
        inArray(match.roundId, existingSeedRounds.map((r) => r.id)),
      );
    }

    // ------------------------------------------------------------------
    // 2. Estádios
    // ------------------------------------------------------------------
    const existingSeedStadiums = await tx
      .select({ id: stadium.id, name: stadium.name })
      .from(stadium)
      .where(inArray(stadium.name, seedStadiumNames));

    const stadiumIdByName = new Map<string, number>(
      existingSeedStadiums.map((s) => [s.name, s.id]),
    );

    const missingStadiumNames = seedStadiumNames.filter(
      (name) => !stadiumIdByName.has(name),
    );

    if (missingStadiumNames.length > 0) {
      const insertedStadiums = await tx
        .insert(stadium)
        .values(
          missingStadiumNames.map((name) => {
            const s = seedStadiums.find((st) => st.name === name)!;
            return { name: s.name, city: s.city };
          }),
        )
        .returning({ id: stadium.id, name: stadium.name });

      for (const s of insertedStadiums) {
        stadiumIdByName.set(s.name, s.id);
      }
    }

    // ------------------------------------------------------------------
    // 3. Grupos
    // ------------------------------------------------------------------
    const existingSeedGroups = await tx
      .select({ id: teamGroup.id, name: teamGroup.name })
      .from(teamGroup)
      .where(inArray(teamGroup.name, seedGroupNames));

    const groupIdByName = new Map<string, number>(
      existingSeedGroups.map((g) => [g.name, g.id]),
    );

    const missingGroupNames = seedGroupNames.filter(
      (name) => !groupIdByName.has(name),
    );

    if (missingGroupNames.length > 0) {
      const insertedGroups = await tx
        .insert(teamGroup)
        .values(missingGroupNames.map((name) => ({ name })))
        .returning({ id: teamGroup.id, name: teamGroup.name });

      for (const g of insertedGroups) {
        groupIdByName.set(g.name, g.id);
      }
    }

    // ------------------------------------------------------------------
    // 4. Times
    // ------------------------------------------------------------------
    const existingSeedTeams = await tx
      .select({ id: team.id, name: team.name })
      .from(team)
      .where(inArray(team.name, seedTeamNames));

    const teamIdByName = new Map<string, number>();

    for (const t of existingSeedTeams) {
      if (!teamIdByName.has(t.name)) {
        teamIdByName.set(t.name, t.id);
      }
    }

    // Atualiza times existentes (flag e grupo)
    for (const seedTeam of seedTeams) {
      const teamId = teamIdByName.get(seedTeam.name);
      const groupId = groupIdByName.get(seedTeam.groupName);

      if (teamId !== undefined && groupId !== undefined) {
        await tx
          .update(team)
          .set({ flag: seedTeam.flag, teamGroupId: groupId })
          .where(eq(team.id, teamId));
      }
    }

    // Insere times ausentes
    const missingTeamNames = seedTeamNames.filter(
      (name) => !teamIdByName.has(name),
    );

    if (missingTeamNames.length > 0) {
      const insertedTeams = await tx
        .insert(team)
        .values(
          missingTeamNames.map((name) => {
            const t = seedTeams.find((st) => st.name === name)!;
            const groupId = groupIdByName.get(t.groupName);

            if (groupId === undefined) {
              throw new Error(`Grupo ausente para o time: ${t.name}`);
            }

            return { name: t.name, flag: t.flag, teamGroupId: groupId };
          }),
        )
        .returning({ id: team.id, name: team.name });

      for (const t of insertedTeams) {
        teamIdByName.set(t.name, t.id);
      }
    }

    // ------------------------------------------------------------------
    // 5. Rodadas
    // ------------------------------------------------------------------
    const existingRoundByTitle = new Map<string, number>(
      existingSeedRounds.map((r) => [r.title, r.id]),
    );
    const roundIdByNumber = new Map<number, number>();

    for (const seedRound of seedRounds) {
      const existingId = existingRoundByTitle.get(seedRound.title);

      if (existingId !== undefined) {
        await tx
          .update(round)
          .set({ number: seedRound.number, status: seedRound.status })
          .where(eq(round.id, existingId));
        roundIdByNumber.set(seedRound.number, existingId);
      } else {
        const [insertedRound] = await tx
          .insert(round)
          .values(seedRound)
          .returning({ id: round.id, number: round.number });

        if (!insertedRound) {
          throw new Error("Falha ao criar rodada de seed.");
        }

        roundIdByNumber.set(insertedRound.number, insertedRound.id);
      }
    }

    // ------------------------------------------------------------------
    // 6. Partidas da fase de grupos (72 jogos com dados reais)
    // ------------------------------------------------------------------
    const groupStageMatchRows = seedGroupStageMatches.map((m) => {
      const teamAId = teamIdByName.get(m.teamA);
      const teamBId = teamIdByName.get(m.teamB);
      const roundId = roundIdByNumber.get(m.round);
      const stadiumId = stadiumIdByName.get(m.stadiumName);

      if (teamAId === undefined) throw new Error(`Time não encontrado: ${m.teamA}`);
      if (teamBId === undefined) throw new Error(`Time não encontrado: ${m.teamB}`);
      if (roundId === undefined) throw new Error(`Rodada não encontrada: ${m.round}`);
      if (stadiumId === undefined) throw new Error(`Estádio não encontrado: ${m.stadiumName}`);

      return {
        teamAId,
        teamBId,
        roundId,
        date: m.date,
        stadiumId,
        scoreA: null,
        scoreB: null,
        expectedWinnerId: null,
        status: "pending" as const,
      };
    });

    await tx.insert(match).values(groupStageMatchRows);

    return {
      stadiums: stadiumIdByName.size,
      groups: groupIdByName.size,
      teams: teamIdByName.size,
      rounds: roundIdByNumber.size,
      groupStageMatches: groupStageMatchRows.length,
    };
  });

  console.log("\n✅ Seed da Copa do Mundo FIFA 2026 concluído!\n");
  console.table(result);

  if (env.NODE_ENV === "production") {
    console.log("\nCredenciais de login do seed omitidas em produção.\n");
  } else {
    console.log("\nCredenciais de login do seed:");
    console.log(`  Email:  ${seedLogin.email}`);
    console.log(`  Senha:  ${seedLogin.password}\n`);
  }
} catch (error) {
  console.error("❌ Erro durante o seed:", error);
  process.exit(1);
} finally {
  await pool.end();
}
