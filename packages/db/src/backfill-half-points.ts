/**
 * Backfill: recalcula a pontuação das apostas já encerradas após a correção do
 * modificador `half_points` (que antes aplicava `Math.floor(points / 2)` e
 * truncava valores fracionários como 1.5 -> 1).
 *
 * O script reconstrói `ranking_log` e `ranking` a partir da fonte de verdade
 * (a aposta salva + o placar final da partida), exatamente como o router de
 * finalização de partida faz. É idempotente: rodar várias vezes converge para o
 * mesmo resultado correto.
 *
 * Uso:
 *   bun run src/backfill-half-points.ts          # dry-run (não grava nada)
 *   bun run src/backfill-half-points.ts --apply  # aplica as correções
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";

import { bet, match, ranking, rankingLog } from "./schema";

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

const APPLY = process.argv.includes("--apply");

// --- Lógica de pontuação (espelho fiel de packages/api/src/lib/bet-scoring.ts) ---
// Mantida inline para evitar dependência circular db -> api.

type Score = { scoreA: number; scoreB: number };
type Outcome = "teamA" | "teamB" | "draw";

function getOutcome(score: Score): Outcome {
  if (score.scoreA > score.scoreB) return "teamA";
  if (score.scoreB > score.scoreA) return "teamB";
  return "draw";
}

function calculateBasePoints(betScore: Score, matchScore: Score): number {
  const gotCorrectScore =
    betScore.scoreA === matchScore.scoreA &&
    betScore.scoreB === matchScore.scoreB;

  if (gotCorrectScore) return 3;

  return getOutcome(betScore) === getOutcome(matchScore) ? 1 : 0;
}

function applyModifier(points: number, modifier: string): number {
  if (points === 0) return 0;
  if (modifier === "double_points") return points * 2;
  if (modifier === "half_points") return points / 2; // <- correção: sem Math.floor
  if (modifier === "invalid_bet") return 0;
  if (modifier === "lucky_duck") return points + 1;
  return points;
}

function calculatePoints(betScore: Score, matchScore: Score, modifier: string) {
  const basePoints = calculateBasePoints(betScore, matchScore);
  const totalPoints = applyModifier(basePoints, modifier);
  return {
    basePoints,
    modifierPoints: totalPoints - basePoints,
    totalPoints,
  };
}

// Tolerância para comparar floats (real).
function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6;
}

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema: { bet, match, ranking, rankingLog } });

  console.log(
    `\n=== Backfill half_points ===\nModo: ${APPLY ? "APPLY (vai gravar)" : "DRY-RUN (somente simulação)"}\n`,
  );

  try {
    // 1. Carrega todos os logs de pontuação existentes.
    const logs = await db
      .select({
        id: rankingLog.id,
        userId: rankingLog.userId,
        matchId: rankingLog.matchId,
        modifier: rankingLog.modifier,
        basePoints: rankingLog.basePoints,
        modifierPoints: rankingLog.modifierPoints,
        totalPoints: rankingLog.totalPoints,
      })
      .from(rankingLog);

    // 2. Carrega as apostas (fonte do placar apostado) e partidas (placar final).
    const bets = await db
      .select({
        userId: bet.userId,
        matchId: bet.matchId,
        scoreA: bet.scoreA,
        scoreB: bet.scoreB,
        modifier: bet.modifier,
      })
      .from(bet);

    const matches = await db
      .select({
        id: match.id,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
      })
      .from(match);

    const betByKey = new Map(bets.map((b) => [`${b.userId}:${b.matchId}`, b]));
    const matchById = new Map(matches.map((m) => [m.id, m]));

    // 3. Recalcula cada log e coleta as diferenças.
    const logUpdates: Array<{
      id: number;
      basePoints: number;
      modifierPoints: number;
      totalPoints: number;
    }> = [];
    const orphanLogs: number[] = [];
    // Soma correta de totalPoints por usuário (= ranking.points esperado).
    const expectedPointsByUser = new Map<string, number>();

    for (const log of logs) {
      const betRow = betByKey.get(`${log.userId}:${log.matchId}`);
      const matchRow = matchById.get(log.matchId);

      if (!betRow || !matchRow || matchRow.scoreA == null || matchRow.scoreB == null) {
        orphanLogs.push(log.id);
        // Sem fonte para recalcular: mantém o valor atual no total esperado.
        expectedPointsByUser.set(
          log.userId,
          (expectedPointsByUser.get(log.userId) ?? 0) + log.totalPoints,
        );
        continue;
      }

      const recomputed = calculatePoints(
        { scoreA: betRow.scoreA, scoreB: betRow.scoreB },
        { scoreA: matchRow.scoreA, scoreB: matchRow.scoreB },
        betRow.modifier,
      );

      expectedPointsByUser.set(
        log.userId,
        (expectedPointsByUser.get(log.userId) ?? 0) + recomputed.totalPoints,
      );

      const changed =
        !approxEqual(recomputed.basePoints, log.basePoints) ||
        !approxEqual(recomputed.modifierPoints, log.modifierPoints) ||
        !approxEqual(recomputed.totalPoints, log.totalPoints);

      if (changed) {
        logUpdates.push({ id: log.id, ...recomputed });
        console.log(
          `log#${log.id} user=${log.userId} match=${log.matchId} mod=${betRow.modifier}: ` +
            `total ${log.totalPoints} -> ${recomputed.totalPoints} ` +
            `(base ${log.basePoints}->${recomputed.basePoints}, ` +
            `mod ${log.modifierPoints}->${recomputed.modifierPoints})`,
        );
      }
    }

    // 4. Recalcula os totais de ranking a partir da soma correta.
    const rankingRows = await db
      .select({ userId: ranking.userId, points: ranking.points })
      .from(ranking);

    const rankingUpdates: Array<{ userId: string; points: number }> = [];
    for (const row of rankingRows) {
      const expected = expectedPointsByUser.get(row.userId) ?? 0;
      if (!approxEqual(expected, row.points)) {
        rankingUpdates.push({ userId: row.userId, points: expected });
        console.log(
          `ranking user=${row.userId}: pontos ${row.points} -> ${expected}`,
        );
      }
    }

    // Usuários com logs mas sem linha em ranking. Isso acontece porque a
    // finalização só cria linha em `ranking` quando totalPoints > 0. Com a
    // correção do half_points, quem antes fazia 0 (ex.: floor(1/2)) pode agora
    // ter total > 0 (ex.: 0.5) e precisa de uma linha NOVA.
    const rankingUserSet = new Set(rankingRows.map((r) => r.userId));
    const rankingInserts: Array<{ userId: string; points: number }> = [];
    let benignMissingRanking = 0;
    for (const userId of expectedPointsByUser.keys()) {
      if (rankingUserSet.has(userId)) continue;
      const expected = expectedPointsByUser.get(userId) ?? 0;
      if (expected > 1e-6) {
        rankingInserts.push({ userId, points: expected });
        console.log(`ranking user=${userId}: criar linha com ${expected} pts`);
      } else {
        // Total continua 0 -> não precisa de linha (comportamento original).
        benignMissingRanking += 1;
      }
    }

    console.log(`\n--- Resumo ---`);
    console.log(`Logs analisados:            ${logs.length}`);
    console.log(`Logs a corrigir:            ${logUpdates.length}`);
    console.log(`Rankings a corrigir:        ${rankingUpdates.length}`);
    console.log(`Rankings a criar:           ${rankingInserts.length}`);
    if (orphanLogs.length > 0) {
      console.log(
        `Logs sem aposta/placar (preservados): ${orphanLogs.length} -> ids ${orphanLogs.join(", ")}`,
      );
    }
    if (benignMissingRanking > 0) {
      console.log(
        `Usuários sem linha em ranking e com total 0 (ok, ignorados): ${benignMissingRanking}`,
      );
    }

    if (!APPLY) {
      console.log(
        `\nDry-run concluído. Nenhuma alteração gravada. Rode com --apply para aplicar.\n`,
      );
      return;
    }

    if (
      logUpdates.length === 0 &&
      rankingUpdates.length === 0 &&
      rankingInserts.length === 0
    ) {
      console.log(`\nNada a corrigir. Banco já está consistente.\n`);
      return;
    }

    // 5. Aplica tudo numa única transação.
    await db.transaction(async (tx) => {
      for (const u of logUpdates) {
        await tx
          .update(rankingLog)
          .set({
            basePoints: u.basePoints,
            modifierPoints: u.modifierPoints,
            totalPoints: u.totalPoints,
          })
          .where(eq(rankingLog.id, u.id));
      }

      for (const u of rankingUpdates) {
        await tx
          .update(ranking)
          .set({ points: u.points })
          .where(eq(ranking.userId, u.userId));
      }

      if (rankingInserts.length > 0) {
        // A sequência do serial pode estar defasada / sem vínculo de ownership
        // (comum em cópias de dump), fazendo o id auto-gerado colidir.
        // Atribuímos ids explícitos (MAX+1, +2, ...) para inserir com segurança.
        const maxRes = await tx.execute(
          sql`SELECT COALESCE(MAX(id), 0)::int AS max_id FROM ranking`,
        );
        const maxId = Number(maxRes.rows[0]?.max_id ?? 0);
        const rowsWithIds = rankingInserts.map((r, i) => ({
          id: maxId + 1 + i,
          userId: r.userId,
          points: r.points,
        }));
        await tx.insert(ranking).values(rowsWithIds);

        // Ressincroniza a sequência real (extraída do default da coluna) para
        // que inserts futuros do app não colidam.
        const defRes = await tx.execute(
          sql`SELECT pg_get_expr(d.adbin, d.adrelid) AS def
              FROM pg_attrdef d
              JOIN pg_attribute a
                ON a.attrelid = d.adrelid AND a.attnum = d.adnum
              WHERE d.adrelid = 'ranking'::regclass AND a.attname = 'id'`,
        );
        const seqName = String(defRes.rows[0]?.def ?? "").match(
          /nextval\('([^']+)'/,
        )?.[1];
        if (seqName) {
          await tx.execute(
            sql`SELECT setval(${seqName}, (SELECT MAX(id) FROM ranking))`,
          );
          console.log(`Sequência ${seqName} ressincronizada.`);
        }
      }
    });

    console.log(
      `\nAplicado: ${logUpdates.length} logs atualizados, ` +
        `${rankingUpdates.length} rankings atualizados, ` +
        `${rankingInserts.length} rankings criados.\n`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Backfill falhou:", error);
  process.exit(1);
});
