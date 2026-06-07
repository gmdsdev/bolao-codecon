import type { CSSProperties } from "react";
import { GitBranchIcon, TrophyIcon } from "lucide-react";

import { LogoCard } from "@/components/bolao/logo-card";
import { cn } from "@codecon/ui/lib/utils";

import type { BracketPageData } from "./bracket-page-data";

type RoundBlock = BracketPageData["rounds"][number];
type BracketMatch = RoundBlock["matches"][number];

type BracketPageProps = {
  data: BracketPageData;
};

type MatchPosition = {
  match: BracketMatch;
  x: number;
  y: number;
};

type Connector = {
  source: MatchPosition;
  target: MatchPosition;
};

type BracketLayout = {
  matches: MatchPosition[];
  connectors: Connector[];
  thirdPlaceMatch?: MatchPosition;
  height: number;
};

const MAIN_ROUND_NUMBERS = [4, 5, 6, 7, 9] as const;
const THIRD_PLACE_ROUND_NUMBER = 8;
const BOARD_MIN_WIDTH = 1480;
const BOARD_PADDING_X = 12;
const BOARD_PADDING_Y = 28;
const COLUMN_WIDTH = 256;
const COLUMN_GAP = 32;
const MATCH_HEIGHT = 88;
const MATCH_GAP = 52;
const THIRD_PLACE_OFFSET_Y = 280;

const ROUND_COLUMN_INDEX: Record<number, number> = {
  4: 0,
  5: 1,
  6: 2,
  7: 3,
  9: 4,
};

const ADVANCEMENT_LINKS = [
  [73, 90],
  [74, 89],
  [75, 90],
  [76, 91],
  [77, 89],
  [78, 91],
  [79, 92],
  [80, 92],
  [81, 94],
  [82, 94],
  [83, 93],
  [84, 93],
  [85, 96],
  [86, 95],
  [87, 96],
  [88, 95],
  [89, 97],
  [90, 97],
  [91, 99],
  [92, 99],
  [93, 98],
  [94, 98],
  [95, 100],
  [96, 100],
  [97, 101],
  [98, 101],
  [99, 102],
  [100, 102],
  [101, 104],
  [102, 104],
] as const;

const BRACKET_LEAF_ORDER = [
  74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87,
] as const;

export function BracketPage({ data }: BracketPageProps) {
  const roundsByNumber = new Map(
    data.rounds.map((roundBlock) => [roundBlock.round.number, roundBlock]),
  );
  const mainRounds = MAIN_ROUND_NUMBERS.map((roundNumber) =>
    roundsByNumber.get(roundNumber),
  ).filter(Boolean) as RoundBlock[];
  const thirdPlaceRound = roundsByNumber.get(THIRD_PLACE_ROUND_NUMBER);
  const totalMatches = data.rounds.reduce(
    (sum, roundBlock) => sum + roundBlock.matches.length,
    0,
  );
  const layout = createBracketLayout(roundsByNumber, thirdPlaceRound);

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-3 p-2 sm:p-3">
      <header className="grid min-w-0 gap-3 lg:grid-cols-[14rem_1fr]">
        <LogoCard className="hidden lg:flex" />
        <div className="flex min-w-0 flex-col justify-end border border-border bg-secondary p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex size-7 shrink-0 items-center justify-center border border-border bg-background text-foreground">
              <GitBranchIcon className="size-4" />
            </span>
            <h1 className="text-lg font-semibold tracking-normal text-foreground sm:text-xl">
              Chaveamento
            </h1>
            <span className="border border-border px-2 py-1 text-xs text-muted-foreground">
              {totalMatches} jogos
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Mata-mata da Copa do Mundo FIFA 2026</span>
            <span aria-hidden="true">/</span>
            <span>Atualizado em {formatRenderedAt(data.renderedAt)}</span>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-hidden border border-border bg-muted">
        <div className="overflow-x-auto">
          <div style={{ width: "100%", minWidth: BOARD_MIN_WIDTH }}>
            <div className="border-b border-border bg-secondary px-3 py-2">
              <div className="grid grid-cols-[repeat(5,16rem)] gap-8">
                {mainRounds.map((roundBlock) => (
                  <div
                    key={roundBlock.round.id}
                    className="border border-border bg-background px-2 py-1 text-center text-xs font-medium text-foreground"
                  >
                    {roundBlock.round.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className="relative"
            style={{
              width: "100%",
              minWidth: BOARD_MIN_WIDTH,
              height: layout.height,
            }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0"
              width={BOARD_MIN_WIDTH}
              height={layout.height}
              viewBox={`0 0 ${BOARD_MIN_WIDTH} ${layout.height}`}
            >
              {layout.connectors.map((connector) => (
                <path
                  key={`${connector.source.match.matchNumber}-${connector.target.match.matchNumber}`}
                  className="text-border"
                  d={getConnectorPath(connector)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
              ))}
            </svg>

            {layout.matches.map((matchPosition) => (
              <BracketMatchBox
                key={matchPosition.match.id}
                match={matchPosition.match}
                isFinal={matchPosition.match.roundNumber === 9}
                style={{
                  left: matchPosition.x,
                  top: matchPosition.y,
                  width: COLUMN_WIDTH,
                  height: MATCH_HEIGHT,
                }}
              />
            ))}

            {layout.thirdPlaceMatch && (
              <ThirdPlaceBlock matchPosition={layout.thirdPlaceMatch} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function BracketMatchBox({
  match,
  isFinal,
  style,
}: {
  match: BracketMatch;
  isFinal?: boolean;
  style?: CSSProperties;
}) {
  const teamA = getTeamLabel(match, "A");
  const teamB = getTeamLabel(match, "B");
  const scoreA = match.scoreA ?? "";
  const scoreB = match.scoreB ?? "";

  return (
    <article
      className={cn(
        "absolute z-10 border border-border bg-background text-xs text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
        isFinal && "border-foreground/60 bg-secondary",
      )}
      style={style}
    >
      <div className="grid h-full min-h-0 grid-rows-[1.5rem_1fr_1fr]">
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border bg-secondary px-2 text-[11px] leading-none text-muted-foreground">
          <span className="min-w-0 truncate">{getCityLabel(match)}</span>
          <span className="shrink-0">{formatDate(match.date)}</span>
        </div>
        <TeamRow flag={teamA.flag} name={teamA.name} score={scoreA} />
        <TeamRow flag={teamB.flag} name={teamB.name} score={scoreB} />
      </div>
    </article>
  );
}

function TeamRow({
  flag,
  name,
  score,
}: {
  flag: string;
  name: string;
  score: number | "";
}) {
  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_2.5rem] border-b border-border last:border-b-0">
      <div className="flex min-w-0 items-center px-2">
        {flag && <span className="mr-1 shrink-0">{flag}</span>}
        <span className="min-w-0 truncate">{name}</span>
      </div>
      <div className="flex items-center justify-center border-l border-border px-2 font-medium">
        {score}
      </div>
    </div>
  );
}

function ThirdPlaceBlock({
  matchPosition,
}: {
  matchPosition: MatchPosition;
}) {
  return (
    <aside
      className="absolute z-20 border border-border bg-background"
      style={{
        left: matchPosition.x,
        top: matchPosition.y,
        width: COLUMN_WIDTH,
        height: MATCH_HEIGHT + 32,
      }}
    >
      <div className="flex h-8 items-center gap-2 border-b border-border bg-secondary px-2 text-xs font-medium text-foreground">
        <TrophyIcon className="size-3.5" />
        Disputa pelo terceiro lugar
      </div>
      <BracketMatchBox
        match={matchPosition.match}
        isFinal={false}
        style={{
          position: "relative",
          left: 0,
          top: 0,
          width: COLUMN_WIDTH,
          height: MATCH_HEIGHT,
          borderLeft: 0,
          borderRight: 0,
          borderBottom: 0,
        }}
      />
    </aside>
  );
}

function createBracketLayout(
  roundsByNumber: Map<number, RoundBlock>,
  thirdPlaceRound?: RoundBlock,
): BracketLayout {
  const positionsByMatchNumber = new Map<number, MatchPosition>();
  const matches: MatchPosition[] = [];
  const targetSources = getTargetSources();

  const roundOf32 = sortRoundOf32Matches(roundsByNumber.get(4)?.matches ?? []);

  roundOf32.forEach((match, matchIndex) => {
    addPosition(match, getRoundX(4), getInitialRoundY(matchIndex));
  });

  [5, 6, 7, 9].forEach((roundNumber) => {
    const roundMatches = sortMatches(
      roundsByNumber.get(roundNumber)?.matches ?? [],
    );

    roundMatches.forEach((match, matchIndex) => {
      const matchNumber = match.matchNumber;
      const sourceNumbers =
        matchNumber === null ? undefined : targetSources.get(matchNumber);
      const sourcePositions = sourceNumbers
        ?.map((sourceNumber) => positionsByMatchNumber.get(sourceNumber))
        .filter(Boolean) as MatchPosition[] | undefined;
      const hasAllSources =
        sourceNumbers !== undefined &&
        sourcePositions !== undefined &&
        sourcePositions.length === sourceNumbers.length;
      const y = hasAllSources
        ? getAverageCenterY(sourcePositions) - MATCH_HEIGHT / 2
        : getFallbackRoundY(roundNumber, matchIndex);

      addPosition(match, getRoundX(roundNumber), y);
    });
  });

  const connectors = ADVANCEMENT_LINKS.map(([sourceNumber, targetNumber]) => {
    const source = positionsByMatchNumber.get(sourceNumber);
    const target = positionsByMatchNumber.get(targetNumber);

    if (!source || !target) {
      return null;
    }

    return { source, target };
  }).filter(Boolean) as Connector[];

  const finalMatch = positionsByMatchNumber.get(104);
  const thirdPlaceMatch = sortMatches(thirdPlaceRound?.matches ?? [])[0];
  const thirdPlacePosition =
    thirdPlaceMatch === undefined
      ? undefined
      : {
          match: thirdPlaceMatch,
          x: getRoundX(9),
          y: (finalMatch?.y ?? getFallbackRoundY(9, 0)) + THIRD_PLACE_OFFSET_Y,
        };
  const maxMatchY = Math.max(
    ...matches.map((matchPosition) => matchPosition.y + MATCH_HEIGHT),
    thirdPlacePosition
      ? thirdPlacePosition.y + MATCH_HEIGHT + 32
      : BOARD_PADDING_Y,
  );

  return {
    matches,
    connectors,
    thirdPlaceMatch: thirdPlacePosition,
    height: Math.ceil(maxMatchY + BOARD_PADDING_Y),
  };

  function addPosition(match: BracketMatch, x: number, y: number) {
    const position = { match, x, y };

    matches.push(position);

    if (match.matchNumber !== null) {
      positionsByMatchNumber.set(match.matchNumber, position);
    }
  }
}

function getTargetSources() {
  const targetSources = new Map<number, number[]>();

  ADVANCEMENT_LINKS.forEach(([sourceNumber, targetNumber]) => {
    const sources = targetSources.get(targetNumber) ?? [];

    sources.push(sourceNumber);
    targetSources.set(targetNumber, sources);
  });

  return targetSources;
}

function getConnectorPath({ source, target }: Connector) {
  const sourceX = source.x + COLUMN_WIDTH;
  const sourceY = source.y + MATCH_HEIGHT / 2;
  const targetX = target.x;
  const targetY = target.y + MATCH_HEIGHT / 2;
  const middleX = sourceX + (targetX - sourceX) / 2;

  return `M ${sourceX} ${sourceY} H ${middleX} V ${targetY} H ${targetX}`;
}

function getRoundX(roundNumber: number) {
  const columnIndex = ROUND_COLUMN_INDEX[roundNumber] ?? 0;

  return BOARD_PADDING_X + columnIndex * (COLUMN_WIDTH + COLUMN_GAP);
}

function getInitialRoundY(matchIndex: number) {
  return BOARD_PADDING_Y + matchIndex * (MATCH_HEIGHT + MATCH_GAP);
}

function getFallbackRoundY(roundNumber: number, matchIndex: number) {
  const roundOffset = Math.max(0, (roundNumber - 4) * MATCH_HEIGHT);

  return BOARD_PADDING_Y + roundOffset + matchIndex * (MATCH_HEIGHT + MATCH_GAP);
}

function getAverageCenterY(positions: MatchPosition[]) {
  const centerSum = positions.reduce(
    (sum, position) => sum + position.y + MATCH_HEIGHT / 2,
    0,
  );

  return centerSum / positions.length;
}

function sortRoundOf32Matches(matches: BracketMatch[]) {
  const orderByMatchNumber: Map<number, number> = new Map(
    BRACKET_LEAF_ORDER.map((matchNumber, index) => [matchNumber, index]),
  );

  return [...matches].sort((matchA, matchB) => {
    const orderA =
      matchA.matchNumber === null
        ? Number.MAX_SAFE_INTEGER
        : (orderByMatchNumber.get(matchA.matchNumber) ??
          Number.MAX_SAFE_INTEGER);
    const orderB =
      matchB.matchNumber === null
        ? Number.MAX_SAFE_INTEGER
        : (orderByMatchNumber.get(matchB.matchNumber) ??
          Number.MAX_SAFE_INTEGER);

    return (
      orderA - orderB || getMatchSortNumber(matchA) - getMatchSortNumber(matchB)
    );
  });
}

function sortMatches(matches: BracketMatch[]) {
  return [...matches].sort((matchA, matchB) => {
    return getMatchSortNumber(matchA) - getMatchSortNumber(matchB);
  });
}

function getMatchSortNumber(match: BracketMatch) {
  return match.matchNumber ?? match.id;
}

function getTeamLabel(match: BracketMatch, side: "A" | "B") {
  if (side === "A") {
    return {
      flag: match.teamAFlag,
      name: match.teamAName || match.teamASource || "A definir",
    };
  }

  return {
    flag: match.teamBFlag,
    name: match.teamBName || match.teamBSource || "A definir",
  };
}

function getCityLabel(match: BracketMatch) {
  const city = match.stadiumCity?.split(",")[0]?.trim();

  if (!city) {
    return match.stadiumName ?? "";
  }

  return city;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function formatRenderedAt(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}
