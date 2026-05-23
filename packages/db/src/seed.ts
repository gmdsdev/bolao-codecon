import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

import { config } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

import {
  account,
  bet,
  match,
  ranking,
  rankingLog,
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
  { name: "Estadio Azteca", city: "Cidade do México, México" },
  { name: "Estadio Akron", city: "Guadalajara, México" },
  { name: "Estadio BBVA", city: "Monterrey, México" },
  // Canadá (2)
  { name: "BMO Field", city: "Toronto, Canadá" },
  { name: "BC Place", city: "Vancouver, Canadá" },
  // Estados Unidos (11)
  { name: "MetLife Stadium", city: "East Rutherford, Nova Jersey, EUA" },
  { name: "Gillette Stadium", city: "Foxborough, Massachusetts, EUA" },
  { name: "SoFi Stadium", city: "Inglewood, Califórnia, EUA" },
  { name: "AT&T Stadium", city: "Arlington, Texas, EUA" },
  { name: "Mercedes-Benz Stadium", city: "Atlanta, Geórgia, EUA" },
  { name: "Levi's Stadium", city: "Santa Clara, Califórnia, EUA" },
  { name: "NRG Stadium", city: "Houston, Texas, EUA" },
  { name: "Arrowhead Stadium", city: "Kansas City, Missouri, EUA" },
  { name: "Hard Rock Stadium", city: "Miami Gardens, Flórida, EUA" },
  { name: "Lincoln Financial Field", city: "Filadélfia, Pensilvânia, EUA" },
  { name: "Lumen Field", city: "Seattle, Washington, EUA" },
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
  { name: "México", flag: "🇲🇽", groupName: "Grupo A" },
  { name: "África do Sul", flag: "🇿🇦", groupName: "Grupo A" },
  { name: "Coreia do Sul", flag: "🇰🇷", groupName: "Grupo A" },
  { name: "Tchéquia", flag: "🇨🇿", groupName: "Grupo A" },
  // GRUPO B
  { name: "Canadá", flag: "🇨🇦", groupName: "Grupo B" },
  { name: "Bósnia e Herzegovina", flag: "🇧🇦", groupName: "Grupo B" },
  { name: "Catar", flag: "🇶🇦", groupName: "Grupo B" },
  { name: "Suíça", flag: "🇨🇭", groupName: "Grupo B" },
  // GRUPO C
  { name: "Brasil", flag: "🇧🇷", groupName: "Grupo C" },
  { name: "Marrocos", flag: "🇲🇦", groupName: "Grupo C" },
  { name: "Haiti", flag: "🇭🇹", groupName: "Grupo C" },
  {
    name: "Escócia",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    groupName: "Grupo C",
  },
  // GRUPO D
  { name: "Estados Unidos", flag: "🇺🇸", groupName: "Grupo D" },
  { name: "Paraguai", flag: "🇵🇾", groupName: "Grupo D" },
  { name: "Austrália", flag: "🇦🇺", groupName: "Grupo D" },
  { name: "Turquia", flag: "🇹🇷", groupName: "Grupo D" },
  // GRUPO E
  { name: "Alemanha", flag: "🇩🇪", groupName: "Grupo E" },
  { name: "Curaçao", flag: "🇨🇼", groupName: "Grupo E" },
  { name: "Costa do Marfim", flag: "🇨🇮", groupName: "Grupo E" },
  { name: "Equador", flag: "🇪🇨", groupName: "Grupo E" },
  // GRUPO F
  { name: "Holanda", flag: "🇳🇱", groupName: "Grupo F" },
  { name: "Japão", flag: "🇯🇵", groupName: "Grupo F" },
  { name: "Suécia", flag: "🇸🇪", groupName: "Grupo F" },
  { name: "Tunísia", flag: "🇹🇳", groupName: "Grupo F" },
  // GRUPO G
  { name: "Bélgica", flag: "🇧🇪", groupName: "Grupo G" },
  { name: "Egito", flag: "🇪🇬", groupName: "Grupo G" },
  { name: "Irã", flag: "🇮🇷", groupName: "Grupo G" },
  { name: "Nova Zelândia", flag: "🇳🇿", groupName: "Grupo G" },
  // GRUPO H
  { name: "Espanha", flag: "🇪🇸", groupName: "Grupo H" },
  { name: "Cabo Verde", flag: "🇨🇻", groupName: "Grupo H" },
  { name: "Arábia Saudita", flag: "🇸🇦", groupName: "Grupo H" },
  { name: "Uruguai", flag: "🇺🇾", groupName: "Grupo H" },
  // GRUPO I
  { name: "França", flag: "🇫🇷", groupName: "Grupo I" },
  { name: "Senegal", flag: "🇸🇳", groupName: "Grupo I" },
  { name: "Iraque", flag: "🇮🇶", groupName: "Grupo I" },
  { name: "Noruega", flag: "🇳🇴", groupName: "Grupo I" },
  // GRUPO J
  { name: "Argentina", flag: "🇦🇷", groupName: "Grupo J" },
  { name: "Argélia", flag: "🇩🇿", groupName: "Grupo J" },
  { name: "Áustria", flag: "🇦🇹", groupName: "Grupo J" },
  { name: "Jordânia", flag: "🇯🇴", groupName: "Grupo J" },
  // GRUPO K
  { name: "Portugal", flag: "🇵🇹", groupName: "Grupo K" },
  { name: "RD Congo", flag: "🇨🇩", groupName: "Grupo K" },
  { name: "Uzbequistão", flag: "🇺🇿", groupName: "Grupo K" },
  { name: "Colômbia", flag: "🇨🇴", groupName: "Grupo K" },
  // GRUPO L
  {
    name: "Inglaterra",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    groupName: "Grupo L",
  },
  { name: "Croácia", flag: "🇭🇷", groupName: "Grupo L" },
  { name: "Gana", flag: "🇬🇭", groupName: "Grupo L" },
  { name: "Panamá", flag: "🇵🇦", groupName: "Grupo L" },
];

const seedTeamNames = seedTeams.map((t) => t.name);

const seedRounds = [
  { number: 1, title: "Fase de grupos - Rodada 1", status: "pending" },
  { number: 2, title: "Fase de grupos - Rodada 2", status: "pending" },
  { number: 3, title: "Fase de grupos - Rodada 3", status: "pending" },
  { number: 4, title: "Dezesseis avos de final", status: "pending" },
  { number: 5, title: "Oitavas de final", status: "pending" },
  { number: 6, title: "Quartas de final", status: "pending" },
  { number: 7, title: "Semifinal", status: "pending" },
  { number: 8, title: "Disputa pelo terceiro lugar", status: "pending" },
  { number: 9, title: "Final", status: "pending" },
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
  {
    teamA: "México",
    teamB: "África do Sul",
    round: 1,
    date: new Date("2026-06-11T19:00:00Z"),
    stadiumName: "Estadio Azteca",
  },
  {
    teamA: "Coreia do Sul",
    teamB: "Tchéquia",
    round: 1,
    date: new Date("2026-06-12T02:00:00Z"),
    stadiumName: "Estadio Akron",
  },
  // GRUPO B
  {
    teamA: "Canadá",
    teamB: "Bósnia e Herzegovina",
    round: 1,
    date: new Date("2026-06-12T19:00:00Z"),
    stadiumName: "BMO Field",
  },
  {
    teamA: "Catar",
    teamB: "Suíça",
    round: 1,
    date: new Date("2026-06-13T19:00:00Z"),
    stadiumName: "Levi's Stadium",
  },
  // GRUPO C
  {
    teamA: "Brasil",
    teamB: "Marrocos",
    round: 1,
    date: new Date("2026-06-13T22:00:00Z"),
    stadiumName: "MetLife Stadium",
  },
  {
    teamA: "Haiti",
    teamB: "Escócia",
    round: 1,
    date: new Date("2026-06-14T01:00:00Z"),
    stadiumName: "Gillette Stadium",
  },
  // GRUPO D
  {
    teamA: "Estados Unidos",
    teamB: "Paraguai",
    round: 1,
    date: new Date("2026-06-13T01:00:00Z"),
    stadiumName: "SoFi Stadium",
  },
  {
    teamA: "Austrália",
    teamB: "Turquia",
    round: 1,
    date: new Date("2026-06-13T04:00:00Z"),
    stadiumName: "BC Place",
  },
  // GRUPO E
  {
    teamA: "Alemanha",
    teamB: "Curaçao",
    round: 1,
    date: new Date("2026-06-14T17:00:00Z"),
    stadiumName: "NRG Stadium",
  },
  {
    teamA: "Costa do Marfim",
    teamB: "Equador",
    round: 1,
    date: new Date("2026-06-14T23:00:00Z"),
    stadiumName: "Lincoln Financial Field",
  },
  // GRUPO F
  {
    teamA: "Holanda",
    teamB: "Japão",
    round: 1,
    date: new Date("2026-06-14T20:00:00Z"),
    stadiumName: "AT&T Stadium",
  },
  {
    teamA: "Suécia",
    teamB: "Tunísia",
    round: 1,
    date: new Date("2026-06-15T02:00:00Z"),
    stadiumName: "Estadio BBVA",
  },
  // GRUPO G
  {
    teamA: "Bélgica",
    teamB: "Egito",
    round: 1,
    date: new Date("2026-06-15T19:00:00Z"),
    stadiumName: "Lumen Field",
  },
  {
    teamA: "Irã",
    teamB: "Nova Zelândia",
    round: 1,
    date: new Date("2026-06-16T01:00:00Z"),
    stadiumName: "SoFi Stadium",
  },
  // GRUPO H
  {
    teamA: "Espanha",
    teamB: "Cabo Verde",
    round: 1,
    date: new Date("2026-06-15T16:00:00Z"),
    stadiumName: "Mercedes-Benz Stadium",
  },
  {
    teamA: "Arábia Saudita",
    teamB: "Uruguai",
    round: 1,
    date: new Date("2026-06-15T22:00:00Z"),
    stadiumName: "Hard Rock Stadium",
  },
  // GRUPO I
  {
    teamA: "França",
    teamB: "Senegal",
    round: 1,
    date: new Date("2026-06-16T19:00:00Z"),
    stadiumName: "MetLife Stadium",
  },
  {
    teamA: "Iraque",
    teamB: "Noruega",
    round: 1,
    date: new Date("2026-06-16T22:00:00Z"),
    stadiumName: "Gillette Stadium",
  },
  // GRUPO J
  {
    teamA: "Argentina",
    teamB: "Argélia",
    round: 1,
    date: new Date("2026-06-17T01:00:00Z"),
    stadiumName: "Arrowhead Stadium",
  },
  {
    teamA: "Áustria",
    teamB: "Jordânia",
    round: 1,
    date: new Date("2026-06-17T04:00:00Z"),
    stadiumName: "Levi's Stadium",
  },
  // GRUPO K
  {
    teamA: "Portugal",
    teamB: "RD Congo",
    round: 1,
    date: new Date("2026-06-17T17:00:00Z"),
    stadiumName: "NRG Stadium",
  },
  {
    teamA: "Uzbequistão",
    teamB: "Colômbia",
    round: 1,
    date: new Date("2026-06-18T02:00:00Z"),
    stadiumName: "Estadio Azteca",
  },
  // GRUPO L
  {
    teamA: "Inglaterra",
    teamB: "Croácia",
    round: 1,
    date: new Date("2026-06-17T20:00:00Z"),
    stadiumName: "AT&T Stadium",
  },
  {
    teamA: "Gana",
    teamB: "Panamá",
    round: 1,
    date: new Date("2026-06-17T23:00:00Z"),
    stadiumName: "BMO Field",
  },

  // ──────────────────────────────────────────────────────────────────
  // RODADA 2
  // ──────────────────────────────────────────────────────────────────

  // GRUPO A
  {
    teamA: "Tchéquia",
    teamB: "África do Sul",
    round: 2,
    date: new Date("2026-06-18T16:00:00Z"),
    stadiumName: "Mercedes-Benz Stadium",
  },
  {
    teamA: "México",
    teamB: "Coreia do Sul",
    round: 2,
    date: new Date("2026-06-19T01:00:00Z"),
    stadiumName: "Estadio Akron",
  },
  // GRUPO B
  {
    teamA: "Suíça",
    teamB: "Bósnia e Herzegovina",
    round: 2,
    date: new Date("2026-06-18T19:00:00Z"),
    stadiumName: "SoFi Stadium",
  },
  {
    teamA: "Canadá",
    teamB: "Catar",
    round: 2,
    date: new Date("2026-06-18T22:00:00Z"),
    stadiumName: "BC Place",
  },
  // GRUPO C
  {
    teamA: "Escócia",
    teamB: "Marrocos",
    round: 2,
    date: new Date("2026-06-19T22:00:00Z"),
    stadiumName: "Gillette Stadium",
  },
  {
    teamA: "Brasil",
    teamB: "Haiti",
    round: 2,
    date: new Date("2026-06-20T00:30:00Z"),
    stadiumName: "Lincoln Financial Field",
  },
  // GRUPO D
  {
    teamA: "Estados Unidos",
    teamB: "Austrália",
    round: 2,
    date: new Date("2026-06-19T19:00:00Z"),
    stadiumName: "Lumen Field",
  },
  {
    teamA: "Turquia",
    teamB: "Paraguai",
    round: 2,
    date: new Date("2026-06-20T03:00:00Z"),
    stadiumName: "Levi's Stadium",
  },
  // GRUPO E
  {
    teamA: "Alemanha",
    teamB: "Costa do Marfim",
    round: 2,
    date: new Date("2026-06-20T20:00:00Z"),
    stadiumName: "BMO Field",
  },
  {
    teamA: "Equador",
    teamB: "Curaçao",
    round: 2,
    date: new Date("2026-06-21T00:00:00Z"),
    stadiumName: "Arrowhead Stadium",
  },
  // GRUPO F
  {
    teamA: "Holanda",
    teamB: "Suécia",
    round: 2,
    date: new Date("2026-06-20T17:00:00Z"),
    stadiumName: "NRG Stadium",
  },
  {
    teamA: "Tunísia",
    teamB: "Japão",
    round: 2,
    date: new Date("2026-06-21T04:00:00Z"),
    stadiumName: "Estadio BBVA",
  },
  // GRUPO G
  {
    teamA: "Bélgica",
    teamB: "Irã",
    round: 2,
    date: new Date("2026-06-21T19:00:00Z"),
    stadiumName: "SoFi Stadium",
  },
  {
    teamA: "Nova Zelândia",
    teamB: "Egito",
    round: 2,
    date: new Date("2026-06-22T01:00:00Z"),
    stadiumName: "BC Place",
  },
  // GRUPO H
  {
    teamA: "Espanha",
    teamB: "Arábia Saudita",
    round: 2,
    date: new Date("2026-06-21T16:00:00Z"),
    stadiumName: "Mercedes-Benz Stadium",
  },
  {
    teamA: "Uruguai",
    teamB: "Cabo Verde",
    round: 2,
    date: new Date("2026-06-21T22:00:00Z"),
    stadiumName: "Hard Rock Stadium",
  },
  // GRUPO I
  {
    teamA: "França",
    teamB: "Iraque",
    round: 2,
    date: new Date("2026-06-22T21:00:00Z"),
    stadiumName: "Lincoln Financial Field",
  },
  {
    teamA: "Noruega",
    teamB: "Senegal",
    round: 2,
    date: new Date("2026-06-23T00:00:00Z"),
    stadiumName: "MetLife Stadium",
  },
  // GRUPO J
  {
    teamA: "Argentina",
    teamB: "Áustria",
    round: 2,
    date: new Date("2026-06-22T17:00:00Z"),
    stadiumName: "AT&T Stadium",
  },
  {
    teamA: "Jordânia",
    teamB: "Argélia",
    round: 2,
    date: new Date("2026-06-23T03:00:00Z"),
    stadiumName: "Levi's Stadium",
  },
  // GRUPO K
  {
    teamA: "Portugal",
    teamB: "Uzbequistão",
    round: 2,
    date: new Date("2026-06-23T17:00:00Z"),
    stadiumName: "NRG Stadium",
  },
  {
    teamA: "Colômbia",
    teamB: "RD Congo",
    round: 2,
    date: new Date("2026-06-24T02:00:00Z"),
    stadiumName: "Estadio Akron",
  },
  // GRUPO L
  {
    teamA: "Inglaterra",
    teamB: "Gana",
    round: 2,
    date: new Date("2026-06-23T20:00:00Z"),
    stadiumName: "Gillette Stadium",
  },
  {
    teamA: "Panamá",
    teamB: "Croácia",
    round: 2,
    date: new Date("2026-06-23T23:00:00Z"),
    stadiumName: "BMO Field",
  },

  // ──────────────────────────────────────────────────────────────────
  // RODADA 3 (partidas simultâneas por grupo)
  // ──────────────────────────────────────────────────────────────────

  // GRUPO A — 24 jun (21h ET = 25 jun 01h UTC)
  {
    teamA: "Tchéquia",
    teamB: "México",
    round: 3,
    date: new Date("2026-06-25T01:00:00Z"),
    stadiumName: "Estadio Azteca",
  },
  {
    teamA: "África do Sul",
    teamB: "Coreia do Sul",
    round: 3,
    date: new Date("2026-06-25T01:00:00Z"),
    stadiumName: "Estadio BBVA",
  },
  // GRUPO B — 24 jun (15h ET = 19h UTC)
  {
    teamA: "Suíça",
    teamB: "Canadá",
    round: 3,
    date: new Date("2026-06-24T19:00:00Z"),
    stadiumName: "BC Place",
  },
  {
    teamA: "Bósnia e Herzegovina",
    teamB: "Catar",
    round: 3,
    date: new Date("2026-06-24T19:00:00Z"),
    stadiumName: "Lumen Field",
  },
  // GRUPO C — 24 jun (18h ET = 22h UTC)
  {
    teamA: "Escócia",
    teamB: "Brasil",
    round: 3,
    date: new Date("2026-06-24T22:00:00Z"),
    stadiumName: "Hard Rock Stadium",
  },
  {
    teamA: "Marrocos",
    teamB: "Haiti",
    round: 3,
    date: new Date("2026-06-24T22:00:00Z"),
    stadiumName: "Mercedes-Benz Stadium",
  },
  // GRUPO D — 25 jun (22h ET = 26 jun 02h UTC)
  {
    teamA: "Turquia",
    teamB: "Estados Unidos",
    round: 3,
    date: new Date("2026-06-26T02:00:00Z"),
    stadiumName: "SoFi Stadium",
  },
  {
    teamA: "Paraguai",
    teamB: "Austrália",
    round: 3,
    date: new Date("2026-06-26T02:00:00Z"),
    stadiumName: "Levi's Stadium",
  },
  // GRUPO E — 25 jun (16h ET = 20h UTC)
  {
    teamA: "Equador",
    teamB: "Alemanha",
    round: 3,
    date: new Date("2026-06-25T20:00:00Z"),
    stadiumName: "MetLife Stadium",
  },
  {
    teamA: "Curaçao",
    teamB: "Costa do Marfim",
    round: 3,
    date: new Date("2026-06-25T20:00:00Z"),
    stadiumName: "Lincoln Financial Field",
  },
  // GRUPO F — 25 jun (19h ET = 23h UTC)
  {
    teamA: "Japão",
    teamB: "Suécia",
    round: 3,
    date: new Date("2026-06-25T23:00:00Z"),
    stadiumName: "AT&T Stadium",
  },
  {
    teamA: "Tunísia",
    teamB: "Holanda",
    round: 3,
    date: new Date("2026-06-25T23:00:00Z"),
    stadiumName: "Arrowhead Stadium",
  },
  // GRUPO G — 26 jun (23h ET = 27 jun 03h UTC)
  {
    teamA: "Egito",
    teamB: "Irã",
    round: 3,
    date: new Date("2026-06-27T03:00:00Z"),
    stadiumName: "Lumen Field",
  },
  {
    teamA: "Nova Zelândia",
    teamB: "Bélgica",
    round: 3,
    date: new Date("2026-06-27T03:00:00Z"),
    stadiumName: "BC Place",
  },
  // GRUPO H — 26 jun (20h ET = 27 jun 00h UTC)
  {
    teamA: "Cabo Verde",
    teamB: "Arábia Saudita",
    round: 3,
    date: new Date("2026-06-27T00:00:00Z"),
    stadiumName: "NRG Stadium",
  },
  {
    teamA: "Uruguai",
    teamB: "Espanha",
    round: 3,
    date: new Date("2026-06-27T00:00:00Z"),
    stadiumName: "Estadio Akron",
  },
  // GRUPO I — 26 jun (15h ET = 19h UTC)
  {
    teamA: "Noruega",
    teamB: "França",
    round: 3,
    date: new Date("2026-06-26T19:00:00Z"),
    stadiumName: "Gillette Stadium",
  },
  {
    teamA: "Senegal",
    teamB: "Iraque",
    round: 3,
    date: new Date("2026-06-26T19:00:00Z"),
    stadiumName: "BMO Field",
  },
  // GRUPO J — 27 jun (22h ET = 28 jun 02h UTC)
  {
    teamA: "Jordânia",
    teamB: "Argentina",
    round: 3,
    date: new Date("2026-06-28T02:00:00Z"),
    stadiumName: "AT&T Stadium",
  },
  {
    teamA: "Argélia",
    teamB: "Áustria",
    round: 3,
    date: new Date("2026-06-28T02:00:00Z"),
    stadiumName: "Arrowhead Stadium",
  },
  // GRUPO K — 27 jun (19h30 ET = 23h30 UTC)
  {
    teamA: "Colômbia",
    teamB: "Portugal",
    round: 3,
    date: new Date("2026-06-27T23:30:00Z"),
    stadiumName: "Hard Rock Stadium",
  },
  {
    teamA: "RD Congo",
    teamB: "Uzbequistão",
    round: 3,
    date: new Date("2026-06-27T23:30:00Z"),
    stadiumName: "Mercedes-Benz Stadium",
  },
  // GRUPO L — 27 jun (17h ET = 21h UTC)
  {
    teamA: "Panamá",
    teamB: "Inglaterra",
    round: 3,
    date: new Date("2026-06-27T21:00:00Z"),
    stadiumName: "MetLife Stadium",
  },
  {
    teamA: "Croácia",
    teamB: "Gana",
    round: 3,
    date: new Date("2026-06-27T21:00:00Z"),
    stadiumName: "Lincoln Financial Field",
  },
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
    rankingLog,
    round,
    stadium,
    team,
    teamGroup,
    user,
  },
});

// ===================================================================
// DADOS DE DEMONSTRAÇÃO (opcional — requer SEED_DEMO_DATA=true)
// ===================================================================

const demoUsersData = [
  { name: "Alice Demo", email: "demo.alice@codecon.local" },
  { name: "Bob Demo", email: "demo.bob@codecon.local" },
  { name: "Charlie Demo", email: "demo.charlie@codecon.local" },
  { name: "Diana Demo", email: "demo.diana@codecon.local" },
  { name: "Eve Demo", email: "demo.eve@codecon.local" },
];

const demoPassword = "CodeCon-Demo-2026!";

// Partidas da Rodada 1 que serão marcadas como finalizadas no demo
const demoFinishedMatches = [
  { teamA: "México", teamB: "África do Sul", scoreA: 2, scoreB: 1 },
  { teamA: "Coreia do Sul", teamB: "Tchéquia", scoreA: 1, scoreB: 1 },
  { teamA: "Canadá", teamB: "Bósnia e Herzegovina", scoreA: 1, scoreB: 0 },
  { teamA: "Brasil", teamB: "Marrocos", scoreA: 3, scoreB: 1 },
  { teamA: "Alemanha", teamB: "Curaçao", scoreA: 4, scoreB: 0 },
  { teamA: "França", teamB: "Senegal", scoreA: 2, scoreB: 0 },
  { teamA: "Argentina", teamB: "Argélia", scoreA: 1, scoreB: 0 },
  { teamA: "Inglaterra", teamB: "Croácia", scoreA: 2, scoreB: 1 },
];

type BetRow = { scoreA: number; scoreB: number; modifier: string };

// Apostas de cada usuário para as partidas finalizadas (mesma ordem de demoFinishedMatches)
const demoBetsOnFinished: Record<string, BetRow[]> = {
  "demo.alice@codecon.local": [
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 0, modifier: "double_points" }, // exato + dobro → 6pts
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 3, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
  ],
  "demo.bob@codecon.local": [
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 0, modifier: "normal" }, // errou → 0pts
    { scoreA: 3, scoreB: 1, modifier: "normal" }, // exato → 3pts
    { scoreA: 2, scoreB: 0, modifier: "half_points" }, // vencedor certo + metade → 0pts
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // exato → 3pts
  ],
  "demo.charlie@codecon.local": [
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // errou → 0pts
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 1, scoreB: 2, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
  ],
  "demo.diana@codecon.local": [
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 1, modifier: "half_points" }, // exato + metade → 1pt
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 3, scoreB: 1, modifier: "lucky_duck" }, // exato + bônus → 6pts
    { scoreA: 4, scoreB: 0, modifier: "invalid_bet" }, // invalidada → 0pts
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // exato → 3pts
    { scoreA: 0, scoreB: 0, modifier: "normal" }, // errou → 0pts
    { scoreA: 3, scoreB: 1, modifier: "normal" }, // vencedor certo → 1pt
  ],
  "demo.eve@codecon.local": [
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // exato → 3pts
    { scoreA: 1, scoreB: 2, modifier: "normal" }, // errou → 0pts
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // vencedor certo → 1pt
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // errou → 0pts
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // errou → 0pts
  ],
};

// Apostas para as partidas pendentes da Rodada 1 (sem ranking_log)
const demoBetsOnPending: Record<string, BetRow[]> = {
  "demo.alice@codecon.local": [
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // Qatar vs Switzerland
    { scoreA: 0, scoreB: 1, modifier: "normal" }, // Haiti vs Scotland
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // USA vs Paraguay
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // Australia vs Türkiye
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // Ivory Coast vs Ecuador
    { scoreA: 2, scoreB: 1, modifier: "normal" }, // Netherlands vs Japan
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // Sweden vs Tunisia
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // Belgium vs Egypt
    { scoreA: 1, scoreB: 0, modifier: "normal" }, // Iran vs New Zealand
    { scoreA: 3, scoreB: 0, modifier: "normal" }, // Spain vs Cape Verde
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // Saudi Arabia vs Uruguay
    { scoreA: 0, scoreB: 1, modifier: "normal" }, // Iraq vs Norway
    { scoreA: 2, scoreB: 0, modifier: "normal" }, // Austria vs Jordan
    { scoreA: 3, scoreB: 0, modifier: "normal" }, // Portugal vs DR Congo
    { scoreA: 0, scoreB: 2, modifier: "normal" }, // Uzbekistan vs Colombia
    { scoreA: 1, scoreB: 1, modifier: "normal" }, // Ghana vs Panama
  ],
  "demo.bob@codecon.local": [
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 2, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
  ],
  "demo.charlie@codecon.local": [
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 2, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 0, scoreB: 2, modifier: "normal" },
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 2, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
  ],
  "demo.diana@codecon.local": [
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 2, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 2, modifier: "normal" },
    { scoreA: 3, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 4, scoreB: 0, modifier: "normal" },
    { scoreA: 1, scoreB: 3, modifier: "normal" },
    { scoreA: 0, scoreB: 2, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 2, scoreB: 2, modifier: "normal" },
  ],
  "demo.eve@codecon.local": [
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 0, scoreB: 0, modifier: "normal" },
    { scoreA: 3, scoreB: 0, modifier: "normal" },
    { scoreA: 1, scoreB: 2, modifier: "normal" },
    { scoreA: 2, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 2, scoreB: 0, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 0, scoreB: 1, modifier: "normal" },
    { scoreA: 3, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 1, modifier: "normal" },
    { scoreA: 1, scoreB: 0, modifier: "normal" },
  ],
};

// Partidas pendentes da Rodada 1 (mesma ordem de demoBetsOnPending)
const demoPendingMatchPairs = [
  { teamA: "Catar", teamB: "Suíça" },
  { teamA: "Haiti", teamB: "Escócia" },
  { teamA: "Estados Unidos", teamB: "Paraguai" },
  { teamA: "Austrália", teamB: "Turquia" },
  { teamA: "Costa do Marfim", teamB: "Equador" },
  { teamA: "Holanda", teamB: "Japão" },
  { teamA: "Suécia", teamB: "Tunísia" },
  { teamA: "Bélgica", teamB: "Egito" },
  { teamA: "Irã", teamB: "Nova Zelândia" },
  { teamA: "Espanha", teamB: "Cabo Verde" },
  { teamA: "Arábia Saudita", teamB: "Uruguai" },
  { teamA: "Iraque", teamB: "Noruega" },
  { teamA: "Áustria", teamB: "Jordânia" },
  { teamA: "Portugal", teamB: "RD Congo" },
  { teamA: "Uzbequistão", teamB: "Colômbia" },
  { teamA: "Gana", teamB: "Panamá" },
];

function calcPoints(
  betA: number,
  betB: number,
  actualA: number,
  actualB: number,
  modifier: string,
): { basePoints: number; modifierPoints: number; totalPoints: number } {
  let basePoints: number;

  if (betA === actualA && betB === actualB) {
    basePoints = 3;
  } else {
    const betWinner = betA > betB ? "A" : betA < betB ? "B" : "draw";
    const actualWinner =
      actualA > actualB ? "A" : actualA < actualB ? "B" : "draw";
    basePoints = betWinner === actualWinner ? 1 : 0;
  }

  let modifierPoints: number;
  let totalPoints: number;

  switch (modifier) {
    case "double_points":
      modifierPoints = basePoints;
      totalPoints = basePoints * 2;
      break;
    case "half_points":
      totalPoints = Math.floor(basePoints / 2);
      modifierPoints = totalPoints - basePoints;
      break;
    case "lucky_duck":
      modifierPoints = 3;
      totalPoints = basePoints + 3;
      break;
    case "invalid_bet":
      modifierPoints = -basePoints;
      totalPoints = 0;
      break;
    default: // normal
      modifierPoints = 0;
      totalPoints = basePoints;
  }

  return { basePoints, modifierPoints, totalPoints };
}

try {
  const result = await db.transaction(async (tx) => {
    // ------------------------------------------------------------------
    // 1. Limpeza de dados de seed anteriores
    // ------------------------------------------------------------------
    const existingSeedUsers = await tx
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(
        inArray(
          user.email,
          seedUsers.map((u) => u.email),
        ),
      );

    if (existingSeedUsers.length > 0) {
      await tx.delete(ranking).where(
        inArray(
          ranking.userId,
          existingSeedUsers.map((u) => u.id),
        ),
      );
    }

    const existingSeedRounds = await tx
      .select({ id: round.id, title: round.title })
      .from(round)
      .where(
        inArray(
          round.title,
          seedRounds.map((r) => r.title),
        ),
      );

    if (existingSeedRounds.length > 0) {
      await tx.delete(match).where(
        inArray(
          match.roundId,
          existingSeedRounds.map((r) => r.id),
        ),
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

      if (teamAId === undefined)
        throw new Error(`Time não encontrado: ${m.teamA}`);
      if (teamBId === undefined)
        throw new Error(`Time não encontrado: ${m.teamB}`);
      if (roundId === undefined)
        throw new Error(`Rodada não encontrada: ${m.round}`);
      if (stadiumId === undefined)
        throw new Error(`Estádio não encontrado: ${m.stadiumName}`);

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
}

if (process.env.SEED_DEMO_DATA === "true") {
  try {
    const hashedPassword = await hashPassword(demoPassword);

    const demoResult = await db.transaction(async (tx) => {
      // Limpa usuários demo anteriores (cascade remove bets, ranking_log e ranking)
      const existingDemoUsers = await tx
        .select({ id: user.id })
        .from(user)
        .where(
          inArray(
            user.email,
            demoUsersData.map((u) => u.email),
          ),
        );

      if (existingDemoUsers.length > 0) {
        await tx.delete(user).where(
          inArray(
            user.id,
            existingDemoUsers.map((u) => u.id),
          ),
        );
      }

      // Cria usuários demo
      const createdUsers = await tx
        .insert(user)
        .values(
          demoUsersData.map((u) => ({
            id: randomBytes(16).toString("hex"),
            name: u.name,
            email: u.email,
            emailVerified: true,
            isAdmin: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        )
        .returning({ id: user.id, email: user.email });

      const userIdByEmail = new Map(createdUsers.map((u) => [u.email, u.id]));

      // Cria contas de autenticação (email+senha compatível com better-auth)
      await tx.insert(account).values(
        createdUsers.map((u) => ({
          id: randomBytes(16).toString("hex"),
          accountId: u.id,
          providerId: "credential",
          userId: u.id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );

      // Resolve teamId por nome
      const allDemoTeamNames = [
        ...demoFinishedMatches.flatMap((m) => [m.teamA, m.teamB]),
        ...demoPendingMatchPairs.flatMap((m) => [m.teamA, m.teamB]),
      ];

      const teamRows = await tx
        .select({ id: team.id, name: team.name })
        .from(team)
        .where(inArray(team.name, [...new Set(allDemoTeamNames)]));

      const teamIdByName = new Map(teamRows.map((t) => [t.name, t.id]));

      // Resolve matchId para partidas finalizadas e as marca como "complete"
      const finishedMatchIds: number[] = [];

      for (const m of demoFinishedMatches) {
        const teamAId = teamIdByName.get(m.teamA);
        const teamBId = teamIdByName.get(m.teamB);

        if (!teamAId || !teamBId) {
          throw new Error(`Time não encontrado: ${m.teamA} ou ${m.teamB}`);
        }

        const [matchRow] = await tx
          .update(match)
          .set({ scoreA: m.scoreA, scoreB: m.scoreB, status: "complete" })
          .where(and(eq(match.teamAId, teamAId), eq(match.teamBId, teamBId)))
          .returning({ id: match.id });

        if (!matchRow) {
          throw new Error(`Partida não encontrada: ${m.teamA} vs ${m.teamB}`);
        }

        finishedMatchIds.push(matchRow.id);
      }

      // Resolve matchId para partidas pendentes
      const pendingMatchIds: number[] = [];

      for (const m of demoPendingMatchPairs) {
        const teamAId = teamIdByName.get(m.teamA);
        const teamBId = teamIdByName.get(m.teamB);

        if (!teamAId || !teamBId) {
          throw new Error(`Time não encontrado: ${m.teamA} ou ${m.teamB}`);
        }

        const [matchRow] = await tx
          .select({ id: match.id })
          .from(match)
          .where(and(eq(match.teamAId, teamAId), eq(match.teamBId, teamBId)));

        if (!matchRow) {
          throw new Error(`Partida não encontrada: ${m.teamA} vs ${m.teamB}`);
        }

        pendingMatchIds.push(matchRow.id);
      }

      // Cria apostas e ranking_log para cada usuário
      const rankingByUserId = new Map<string, number>();

      for (const u of demoUsersData) {
        const userId = userIdByEmail.get(u.email)!;
        const betsOnFinished = demoBetsOnFinished[u.email]!;
        const betsOnPending = demoBetsOnPending[u.email]!;

        // Apostas nas partidas finalizadas
        const finishedBetValues = betsOnFinished.map((b, i) => ({
          userId,
          matchId: finishedMatchIds[i]!,
          scoreA: b.scoreA,
          scoreB: b.scoreB,
          modifier: b.modifier,
        }));

        // Apostas nas partidas pendentes
        const pendingBetValues = betsOnPending.map((b, i) => ({
          userId,
          matchId: pendingMatchIds[i]!,
          scoreA: b.scoreA,
          scoreB: b.scoreB,
          modifier: b.modifier,
        }));

        await tx
          .insert(bet)
          .values([...finishedBetValues, ...pendingBetValues]);

        // Ranking_log apenas para partidas finalizadas
        let totalUserPoints = 0;

        const rankingLogValues = betsOnFinished.map((b, i) => {
          const fm = demoFinishedMatches[i]!;
          const { basePoints, modifierPoints, totalPoints } = calcPoints(
            b.scoreA,
            b.scoreB,
            fm.scoreA,
            fm.scoreB,
            b.modifier,
          );
          totalUserPoints += totalPoints;
          return {
            userId,
            matchId: finishedMatchIds[i]!,
            basePoints,
            modifierPoints,
            totalPoints,
            modifier: b.modifier,
          };
        });

        await tx.insert(rankingLog).values(rankingLogValues);

        rankingByUserId.set(userId, totalUserPoints);
      }

      // Cria entradas de ranking
      await tx.insert(ranking).values(
        [...rankingByUserId.entries()].map(([userId, points]) => ({
          userId,
          points,
        })),
      );

      return {
        users: createdUsers.length,
        finishedMatches: finishedMatchIds.length,
        totalBets:
          demoUsersData.length *
          (finishedMatchIds.length + pendingMatchIds.length),
        rankingEntries: rankingByUserId.size,
      };
    });

    console.log("\n🎲 Seed de demonstração concluído!\n");
    console.table(demoResult);

    if (env.NODE_ENV !== "production") {
      console.log("\nCredenciais dos usuários de demonstração:");
      for (const u of demoUsersData) {
        console.log(`  ${u.name.padEnd(15)} | ${u.email}`);
      }
      console.log(`  Senha (todos): ${demoPassword}\n`);
    }
  } catch (error) {
    console.error("❌ Erro durante o seed de demonstração:", error);
    process.exit(1);
  }
}

await pool.end();
