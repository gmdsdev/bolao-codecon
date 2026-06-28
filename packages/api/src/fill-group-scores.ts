/**
 * fill-group-scores.ts
 * ---------------------------------------------------------------------------
 * Simula um administrador preenchendo os placares pela INTERFACE.
 *
 * Para cada partida da Fase de grupos (Rodadas 1, 2 e 3 -> round.number <= 3)
 * o script dispara EXATAMENTE o mesmo fluxo do formulário do admin
 * (handleSaveAndComplete em match-result-form.tsx):
 *
 *   1. match.updateResult  -> publica a partida (status "pending") com um
 *                             placar aleatorio SEM empate.
 *   2. match.complete      -> conclui a partida.
 *
 * Como tudo passa pelas mesmas procedures tRPC que a UI usa, todos os efeitos
 * colaterais do fluxo acontecem de verdade:
 *   - calculo de pontos das apostas + gravacao em ranking / ranking_log;
 *   - atualizacao de round.status (o round vira "complete" quando todas as
 *     suas partidas sao concluidas -> tryGenerateRoundOf32 / completeRoundIfDone);
 *   - geracao das partidas da fase eliminatoria (round of 32) quando os 3
 *     rounds de grupo terminam.
 *
 * Como rodar (a partir da raiz do repo):
 *   bun run db:fill-group-scores
 * ou direto:
 *   bun run packages/api/src/fill-group-scores.ts
 *
 * Flags / variaveis de ambiente:
 *   MAX_GOALS=5   Numero maximo de gols por time (padrao 5).
 *
 * Observacao: partidas ja concluidas (status "complete") nao podem ser
 * reeditadas (a propria API bloqueia, igual a interface). Para um teste limpo
 * do zero, rode antes: bun run db:seed
 * ---------------------------------------------------------------------------
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

import type { Context } from "./context";

// ---------------------------------------------------------------------------
// Carrega o .env ANTES de importar qualquer modulo que abra o banco
// (o pacote @codecon/db conecta no momento do import). Mesmo padrao do seed.ts.
// ---------------------------------------------------------------------------
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

// Imports dinamicos (depois do dotenv) para garantir DATABASE_URL no env.
const { t } = await import("./index");
const { appRouter } = await import("./routers");
const { db } = await import("@codecon/db");
const { user } = await import("@codecon/db/schema/auth");
const { eq } = await import("drizzle-orm");

const MAX_GOALS = Number(process.env.MAX_GOALS ?? 5);

/** Gera um placar aleatorio SEM empate (scoreA !== scoreB). */
function randomScore(max: number): { scoreA: number; scoreB: number } {
  const rnd = () => Math.floor(Math.random() * (max + 1)); // 0..max
  const scoreA = rnd();
  let scoreB = rnd();
  while (scoreA === scoreB) {
    scoreB = rnd();
  }
  return { scoreA, scoreB };
}

async function buildAdminContext(): Promise<Context> {
  // Usa um admin real do banco quando existir (mais fiel); senao, sintetico.
  const [adminUser] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.isAdmin, true))
    .limit(1);

  const id = adminUser?.id ?? "script-admin";

  // O contexto so precisa de session.user.isAdmin (adminProcedure) e de uma
  // session truthy (protectedProcedure). Demais campos sao preenchidos por
  // completude e o cast garante compatibilidade de tipos.
  return {
    auth: null,
    session: {
      user: {
        id,
        isAdmin: true,
        email: adminUser?.email ?? "script-admin@codecon.local",
        name: "Fill Group Scores Script",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "script-session",
        userId: id,
        token: "script",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  } as unknown as Context;
}

async function main() {
  const ctx = await buildAdminContext();
  const createCaller = t.createCallerFactory(appRouter);
  const caller = createCaller(ctx);

  // Rounds da fase de grupos (number <= 3)
  const rounds = await caller.round.getAll();
  const groupRoundIds = new Set(
    rounds.filter((r) => r.number <= 3).map((r) => r.id),
  );

  // Todas as partidas; filtra as da fase de grupos e ordena como na tela.
  const allMatches = await caller.match.getAll();
  const groupMatches = allMatches
    .filter((m) => groupRoundIds.has(m.roundId))
    .sort(
      (a, b) =>
        (a.matchNumber ?? a.id) - (b.matchNumber ?? b.id) || a.id - b.id,
    );

  if (groupMatches.length === 0) {
    console.warn(
      "Nenhuma partida da fase de grupos encontrada. Rodou o seed? (bun run db:seed)",
    );
    return;
  }

  console.log(
    `Encontradas ${groupMatches.length} partidas na fase de grupos (Rodadas 1-3).`,
  );
  console.log(
    `Simulando o fluxo da interface (updateResult + complete) com placares ` +
      `aleatorios sem empate (0..${MAX_GOALS} gols por time).\n`,
  );

  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (const m of groupMatches) {
    const label = `#${m.matchNumber ?? m.id}`;

    if (m.status === "complete") {
      skipped++;
      console.log(`  ${label.padEnd(6)} ja concluida -> pulada`);
      continue;
    }

    if (m.teamAId === null || m.teamBId === null) {
      skipped++;
      console.log(`  ${label.padEnd(6)} sem times definidos -> pulada`);
      continue;
    }

    const { scoreA, scoreB } = randomScore(MAX_GOALS);

    try {
      // Passo 1: publicar a partida com o placar (status "pending").
      await caller.match.updateResult({
        matchId: m.id,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        scoreA,
        scoreB,
        penaltyScoreA: null,
        penaltyScoreB: null,
        stadiumId: m.stadiumId,
        date: new Date(m.date).toISOString(),
        // expectedWinner omitido -> preserva o valor atual.
        status: "pending",
      });

      // Passo 2: concluir a partida (calcula ranking, atualiza round, gera chave).
      const result = await caller.match.complete({ matchId: m.id });

      completed++;
      const extra = result.bracketUpdated ? " [chaveamento atualizado]" : "";
      console.log(
        `  ${label.padEnd(6)} ${scoreA} x ${scoreB} -> concluida ` +
          `(${result.awardedUsers}/${result.betsFound} apostas pontuadas)${extra}`,
      );
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ${label.padEnd(6)} ERRO: ${message}`);
    }
  }

  // Estado final dos rounds de grupo (para confirmar o reflexo do status).
  const roundsAfter = await caller.round.getAll();
  console.log("\nStatus dos rounds de grupo apos a execucao:");
  for (const r of roundsAfter.filter((r) => r.number <= 3)) {
    console.log(`  Rodada ${r.number}: ${r.status}`);
  }

  console.log(
    `\nConcluido: ${completed} partidas finalizadas, ${skipped} puladas, ${failed} com erro.`,
  );
}

main()
  .catch((error) => {
    console.error("Erro ao preencher placares:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    // O pool interno do drizzle/pg mantem o processo vivo; encerra explicitamente.
    process.exit(process.exitCode ?? 0);
  });
