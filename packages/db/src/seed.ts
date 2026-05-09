import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  account,
  match,
  ranking,
  round,
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

const seedUsers = [
  seedLogin,
  {
    name: "Ada Seed",
    email: "ada.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Bruno Seed",
    email: "bruno.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Carla Seed",
    email: "carla.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Davi Seed",
    email: "davi.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Elisa Seed",
    email: "elisa.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Felipe Seed",
    email: "felipe.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Giovana Seed",
    email: "giovana.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Hugo Seed",
    email: "hugo.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
  {
    name: "Isabela Seed",
    email: "isabela.seed@codecon.local",
    password: `CodeCon-${randomBytes(8).toString("hex")}`,
  },
];

const seedGroupNames = Array.from(
  { length: 12 },
  (_, index) => `Grupo ${String.fromCharCode(65 + index)}`,
);

const legacySeedGroupNames = Array.from(
  { length: 12 },
  (_, index) => `Group ${index + 1}`,
);

const seedTeams = [
  { name: "Mexico", flag: "🇲🇽", groupName: "Grupo A" },
  { name: "South Africa", flag: "🇿🇦", groupName: "Grupo A" },
  { name: "South Korea", flag: "🇰🇷", groupName: "Grupo A" },
  { name: "Czech Republic", flag: "🇨🇿", groupName: "Grupo A" },
  { name: "Canada", flag: "🇨🇦", groupName: "Grupo B" },
  {
    name: "Bosnia and Herzegovina",
    flag: "🇧🇦",
    groupName: "Grupo B",
  },
  { name: "Qatar", flag: "🇶🇦", groupName: "Grupo B" },
  { name: "Switzerland", flag: "🇨🇭", groupName: "Grupo B" },
  { name: "Brazil", flag: "🇧🇷", groupName: "Grupo C" },
  { name: "Morocco", flag: "🇲🇦", groupName: "Grupo C" },
  { name: "Haiti", flag: "🇭🇹", groupName: "Grupo C" },
  {
    name: "Scotland",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    groupName: "Grupo C",
  },
  { name: "United States", flag: "🇺🇸", groupName: "Grupo D" },
  { name: "Paraguay", flag: "🇵🇾", groupName: "Grupo D" },
  { name: "Australia", flag: "🇦🇺", groupName: "Grupo D" },
  { name: "Turkey", flag: "🇹🇷", groupName: "Grupo D" },
  { name: "Germany", flag: "🇩🇪", groupName: "Grupo E" },
  { name: "Curacao", flag: "🇨🇼", groupName: "Grupo E" },
  { name: "Ivory Coast", flag: "🇨🇮", groupName: "Grupo E" },
  { name: "Ecuador", flag: "🇪🇨", groupName: "Grupo E" },
  { name: "Netherlands", flag: "🇳🇱", groupName: "Grupo F" },
  { name: "Japan", flag: "🇯🇵", groupName: "Grupo F" },
  { name: "Sweden", flag: "🇸🇪", groupName: "Grupo F" },
  { name: "Tunisia", flag: "🇹🇳", groupName: "Grupo F" },
  { name: "Belgium", flag: "🇧🇪", groupName: "Grupo G" },
  { name: "Egypt", flag: "🇪🇬", groupName: "Grupo G" },
  { name: "Iran", flag: "🇮🇷", groupName: "Grupo G" },
  { name: "New Zealand", flag: "🇳🇿", groupName: "Grupo G" },
  { name: "Spain", flag: "🇪🇸", groupName: "Grupo H" },
  { name: "Cape Verde", flag: "🇨🇻", groupName: "Grupo H" },
  { name: "Saudi Arabia", flag: "🇸🇦", groupName: "Grupo H" },
  { name: "Uruguay", flag: "🇺🇾", groupName: "Grupo H" },
  { name: "France", flag: "🇫🇷", groupName: "Grupo I" },
  { name: "Senegal", flag: "🇸🇳", groupName: "Grupo I" },
  { name: "Iraq", flag: "🇮🇶", groupName: "Grupo I" },
  { name: "Norway", flag: "🇳🇴", groupName: "Grupo I" },
  { name: "Argentina", flag: "🇦🇷", groupName: "Grupo J" },
  { name: "Algeria", flag: "🇩🇿", groupName: "Grupo J" },
  { name: "Austria", flag: "🇦🇹", groupName: "Grupo J" },
  { name: "Jordan", flag: "🇯🇴", groupName: "Grupo J" },
  { name: "Portugal", flag: "🇵🇹", groupName: "Grupo K" },
  { name: "DR Congo", flag: "🇨🇩", groupName: "Grupo K" },
  { name: "Uzbekistan", flag: "🇺🇿", groupName: "Grupo K" },
  { name: "Colombia", flag: "🇨🇴", groupName: "Grupo K" },
  {
    name: "England",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    groupName: "Grupo L",
  },
  { name: "Croatia", flag: "🇭🇷", groupName: "Grupo L" },
  { name: "Ghana", flag: "🇬🇭", groupName: "Grupo L" },
  { name: "Panama", flag: "🇵🇦", groupName: "Grupo L" },
];

const seedTeamNames = seedTeams.map((seedTeam) => seedTeam.name);

const legacySeedTeamNames = [
  "Aurora FC",
  "Byte United",
  "Syntax City",
  "Runtime FC",
  "Neon Forge",
  "Pixel Town",
  "Vector Club",
  "Token City",
];

const legacySeedRoundTitles = ["Seed Round 1", "Seed Round 2", "Seed Round 3"];

const seedRounds = [
  {
    number: 1,
    title: "Fase de grupos - Rodada 1",
    status: "pending",
  },
  {
    number: 2,
    title: "Fase de grupos - Rodada 2",
    status: "pending",
  },
  {
    number: 3,
    title: "Fase de grupos - Rodada 3",
    status: "pending",
  },
  {
    number: 4,
    title: "Dezesseis avos de final",
    status: "pending",
  },
  {
    number: 5,
    title: "Oitavas de final",
    status: "pending",
  },
  {
    number: 6,
    title: "Quartas de final",
    status: "pending",
  },
  {
    number: 7,
    title: "Semifinal",
    status: "pending",
  },
  {
    number: 8,
    title: "Disputa pelo terceiro lugar",
    status: "pending",
  },
  {
    number: 9,
    title: "Final",
    status: "pending",
  },
];

const knockoutMatchCountsByRoundNumber = new Map([
  [4, 16],
  [5, 8],
  [6, 4],
  [7, 2],
  [8, 1],
  [9, 1],
]);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, {
  schema: {
    account,
    match,
    ranking,
    round,
    team,
    teamGroup,
    user,
  },
});

try {
  const result = await db.transaction(async (tx) => {
    const existingSeedUsers = await tx
      .select({
        id: user.id,
        email: user.email,
      })
      .from(user)
      .where(
        inArray(
          user.email,
          seedUsers.map((seedUser) => seedUser.email),
        ),
      );

    if (existingSeedUsers.length > 0) {
      await tx
        .delete(ranking)
        .where(
          inArray(
            ranking.userId,
            existingSeedUsers.map((seedUser) => seedUser.id),
          ),
        );
    }

    const existingSeedRounds = await tx
      .select({
        id: round.id,
        title: round.title,
      })
      .from(round)
      .where(
        inArray(
          round.title,
          [
            ...seedRounds.map((seedRound) => seedRound.title),
            ...legacySeedRoundTitles,
          ],
        ),
      );

    if (existingSeedRounds.length > 0) {
      await tx
        .delete(match)
        .where(
          inArray(
            match.roundId,
            existingSeedRounds.map((seedRound) => seedRound.id),
          ),
        );
    }

    await tx.delete(round).where(inArray(round.title, legacySeedRoundTitles));
    await tx.delete(team).where(inArray(team.name, legacySeedTeamNames));

    const usersByEmail = new Map<string, string>();

    for (const seedUser of seedUsers) {
      const now = new Date();
      const passwordHash = await hashPassword(seedUser.password);
      const existingUser = existingSeedUsers.find(
        (row) => row.email === seedUser.email,
      );
      const userId = existingUser?.id ?? randomUUID();

      if (existingUser) {
        await tx
          .update(user)
          .set({
            name: seedUser.name,
            emailVerified: true,
            isAdmin: true,
            updatedAt: now,
          })
          .where(eq(user.id, userId));
      } else {
        await tx.insert(user).values({
          id: userId,
          name: seedUser.name,
          email: seedUser.email,
          emailVerified: true,
          isAdmin: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      const existingAccounts = await tx
        .select({
          id: account.id,
        })
        .from(account)
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "credential")),
        )
        .limit(1);

      const existingAccount = existingAccounts[0];

      if (existingAccount) {
        await tx
          .update(account)
          .set({
            accountId: userId,
            password: passwordHash,
            updatedAt: now,
          })
          .where(eq(account.id, existingAccount.id));
      } else {
        await tx.insert(account).values({
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        });
      }

      usersByEmail.set(seedUser.email, userId);
    }

    const existingSeedGroups = await tx
      .select({
        id: teamGroup.id,
        name: teamGroup.name,
      })
      .from(teamGroup)
      .where(inArray(teamGroup.name, seedGroupNames));

    const groupIdByName = new Map(
      existingSeedGroups.map((existingGroup) => [
        existingGroup.name,
        existingGroup.id,
      ]),
    );
    const missingGroupNames = seedGroupNames.filter(
      (groupName) => !groupIdByName.has(groupName),
    );

    if (missingGroupNames.length > 0) {
      const insertedGroups = await tx
        .insert(teamGroup)
        .values(missingGroupNames.map((name) => ({ name })))
        .returning({
          id: teamGroup.id,
          name: teamGroup.name,
        });

      for (const insertedGroup of insertedGroups) {
        groupIdByName.set(insertedGroup.name, insertedGroup.id);
      }
    }

    const existingSeedTeams = await tx
      .select({
        id: team.id,
        name: team.name,
      })
      .from(team)
      .where(inArray(team.name, seedTeamNames));

    const teamIdByName = new Map<string, number>();

    for (const existingTeam of existingSeedTeams) {
      if (!teamIdByName.has(existingTeam.name)) {
        teamIdByName.set(existingTeam.name, existingTeam.id);
      }
    }

    const missingTeamNames = seedTeamNames.filter(
      (name) => !teamIdByName.has(name),
    );

    for (const seedTeam of seedTeams) {
      const teamId = teamIdByName.get(seedTeam.name);
      const groupId = groupIdByName.get(seedTeam.groupName);

      if (teamId === undefined || groupId === undefined) {
        continue;
      }

      await tx
        .update(team)
        .set({
          flag: seedTeam.flag,
          teamGroupId: groupId,
        })
        .where(eq(team.id, teamId));
    }

    if (missingTeamNames.length > 0) {
      const insertedTeams = await tx
        .insert(team)
        .values(
          missingTeamNames.map((name) => {
            const seedTeam = getSeedTeam(name);
            const groupId = groupIdByName.get(seedTeam.groupName);

            if (groupId === undefined) {
              throw new Error(`Missing seed group ${seedTeam.groupName}`);
            }

            return {
              name: seedTeam.name,
              flag: seedTeam.flag,
              teamGroupId: groupId,
            };
          }),
        )
        .returning({
          id: team.id,
          name: team.name,
        });

      for (const insertedTeam of insertedTeams) {
        teamIdByName.set(insertedTeam.name, insertedTeam.id);
      }
    }

    await tx
      .delete(teamGroup)
      .where(inArray(teamGroup.name, legacySeedGroupNames));

    const existingRoundByTitle = new Map(
      existingSeedRounds.map((existingRound) => [
        existingRound.title,
        existingRound.id,
      ]),
    );
    const roundIdByNumber = new Map<number, number>();

    for (const seedRound of seedRounds) {
      const existingRoundId = existingRoundByTitle.get(seedRound.title);

      if (existingRoundId !== undefined) {
        await tx
          .update(round)
          .set({
            number: seedRound.number,
            status: seedRound.status,
          })
          .where(eq(round.id, existingRoundId));
        roundIdByNumber.set(seedRound.number, existingRoundId);
      } else {
        const insertedRounds = await tx
          .insert(round)
          .values(seedRound)
          .returning({
            id: round.id,
            number: round.number,
          });
        const insertedRound = insertedRounds[0];

        if (!insertedRound) {
          throw new Error("Failed to create seed round");
        }

        roundIdByNumber.set(insertedRound.number, insertedRound.id);
      }
    }

    const matchRows = seedRounds.flatMap((seedRound) =>
      createRoundMatches(seedRound.number),
    );

    await tx.insert(match).values(matchRows);

    const rankingRows = [
      {
        userId: usersByEmail.get(seedLogin.email),
        points: 12,
      },
      {
        userId: usersByEmail.get("ada.seed@codecon.local"),
        points: 18,
      },
      {
        userId: usersByEmail.get("bruno.seed@codecon.local"),
        points: 15,
      },
      {
        userId: usersByEmail.get("carla.seed@codecon.local"),
        points: 9,
      },
      {
        userId: usersByEmail.get("davi.seed@codecon.local"),
        points: 6,
      },
      {
        userId: usersByEmail.get("elisa.seed@codecon.local"),
        points: 21,
      },
      {
        userId: usersByEmail.get("felipe.seed@codecon.local"),
        points: 4,
      },
      {
        userId: usersByEmail.get("giovana.seed@codecon.local"),
        points: 16,
      },
      {
        userId: usersByEmail.get("hugo.seed@codecon.local"),
        points: 11,
      },
      {
        userId: usersByEmail.get("isabela.seed@codecon.local"),
        points: 13,
      },
    ].flatMap((row) =>
      row.userId === undefined
        ? []
        : [{ userId: row.userId, points: row.points }],
    );

    await tx.insert(ranking).values(rankingRows);

    return {
      users: seedUsers.length,
      teams: teamIdByName.size,
      groups: groupIdByName.size,
      rounds: roundIdByNumber.size,
      matches: matchRows.length,
      rankingRows: rankingRows.length,
    };

    function getSeedTeam(name: string) {
      const seedTeam = seedTeams.find((teamSeed) => teamSeed.name === name);

      if (seedTeam === undefined) {
        throw new Error(`Missing seed team ${name}`);
      }

      return seedTeam;
    }

    function createRoundMatches(roundNumber: number) {
      if (roundNumber <= 3) {
        return createGroupStageMatches(roundNumber);
      }

      const teamCount = seedTeamNames.length;
      const matchCount = knockoutMatchCountsByRoundNumber.get(roundNumber);
      const offset = roundNumber - 1;

      if (matchCount === undefined) {
        throw new Error(`Missing match count for round ${roundNumber}`);
      }

      return Array.from({ length: matchCount }, (_, index) => {
        const step = roundNumber * 3;
        const teamAName = getSeedTeamName((index * 2 + offset) % teamCount);
        const teamBName = getSeedTeamName(
          (teamCount - 1 - index * 2 - step + teamCount) % teamCount,
        );

        return createMatch(teamAName, teamBName, roundNumber);
      });
    }

    function createGroupStageMatches(roundNumber: number) {
      return seedGroupNames.flatMap((groupName) => {
        const teamsInGroup = seedTeams.filter(
          (seedTeam) => seedTeam.groupName === groupName,
        );

        if (teamsInGroup.length !== 4) {
          throw new Error(`${groupName} must have exactly 4 teams`);
        }

        const [team1, team2, team3, team4] = teamsInGroup;

        if (!team1 || !team2 || !team3 || !team4) {
          throw new Error(`${groupName} must have exactly 4 teams`);
        }

        const fixturesByGroupRound = getGroupStageFixtures(roundNumber, [
          team1.name,
          team2.name,
          team3.name,
          team4.name,
        ]);

        if (fixturesByGroupRound === undefined) {
          throw new Error(`Missing group-stage fixtures for round ${roundNumber}`);
        }

        return fixturesByGroupRound.map(([teamAName, teamBName]) =>
          createMatch(teamAName, teamBName, roundNumber),
        );
      });
    }

    function getGroupStageFixtures(
      roundNumber: number,
      [team1, team2, team3, team4]: [string, string, string, string],
    ): [string, string][] | undefined {
      if (roundNumber === 1) {
        return [
          [team1, team2],
          [team3, team4],
        ];
      }

      if (roundNumber === 2) {
        return [
          [team4, team2],
          [team1, team3],
        ];
      }

      if (roundNumber === 3) {
        return [
          [team4, team1],
          [team2, team3],
        ];
      }

      return undefined;
    }

    function getSeedTeamName(index: number) {
      const teamName = seedTeamNames[index];

      if (teamName === undefined) {
        throw new Error(`Missing seed team at index ${index}`);
      }

      return teamName;
    }

    function createMatch(
      teamAName: string,
      teamBName: string,
      roundNumber: number,
      scoreA?: number,
      scoreB?: number,
    ) {
      const teamAId = teamIdByName.get(teamAName);
      const teamBId = teamIdByName.get(teamBName);
      const roundId = roundIdByNumber.get(roundNumber);

      if (
        teamAId === undefined ||
        teamBId === undefined ||
        roundId === undefined
      ) {
        throw new Error("Seed match references missing team or round");
      }

      const expectedWinnerId =
        scoreA === undefined || scoreB === undefined
          ? null
          : scoreA > scoreB
            ? teamAId
            : scoreB > scoreA
              ? teamBId
              : null;

      return {
        teamAId,
        teamBId,
        roundId,
        scoreA: scoreA ?? null,
        scoreB: scoreB ?? null,
        expectedWinnerId,
      };
    }
  });

  console.log("Seed completed");
  console.table(result);
  console.log("Login credentials");
  console.log(`Email: ${seedLogin.email}`);
  console.log(`Password: ${seedLogin.password}`);
} finally {
  await pool.end();
}
