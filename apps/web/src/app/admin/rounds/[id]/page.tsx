"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { Button } from "@codecon/ui/components/button";
import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Match = {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  hasBet: boolean;
  betScoreA: number | null;
  betScoreB: number | null;
  betModifier: string | null;
};

type BetModifier =
  | "invert_bet"
  | "double_points"
  | "half_points"
  | "invalid_bet"
  | "lucky_duck"
  | "normal";

const BET_WHEEL_OPTIONS: {
  value: BetModifier;
  label: string;
  description: string;
}[] = [
  {
    value: "invert_bet",
    label: "Inverter aposta",
    description: "Seu placar troca de lado antes de ser salvo.",
  },
  {
    value: "double_points",
    label: "Pontos em dobro",
    description: "Todos os pontos desta aposta são dobrados.",
  },
  {
    value: "half_points",
    label: "Metade dos pontos",
    description: "Todos os pontos desta aposta são reduzidos pela metade.",
  },
  {
    value: "invalid_bet",
    label: "Aposta inválida",
    description: "Esta aposta vale zero ponto.",
  },
  {
    value: "lucky_duck",
    label: "Pato da sorte",
    description: "Ganhe um ponto bônus se esta aposta pontuar.",
  },
  {
    value: "normal",
    label: "Sem efeito",
    description: "Sem surpresa. A aposta é salva como foi enviada.",
  },
];
const DUCK_SOUND_URL = new URL("../../../../assets/duck.mp3", import.meta.url)
  .href;
const WHEEL_SEGMENT_DEGREES = 360 / BET_WHEEL_OPTIONS.length;
const WHEEL_SPIN_DURATION_MS = 3000;
const WHEEL_FULL_TURNS = 7;

export default function Page() {
  const params = useParams<{ id: string }>();
  const roundId = Number(params.id);

  const matches = useQuery(
    trpc.match.getByRound.queryOptions({
      roundId,
    }),
  );

  if (matches.isError) {
    return <div>Erro</div>;
  }

  if (!matches.data?.length) {
    return <div>Nenhum dado</div>;
  }

  return <MatchList matches={matches.data} onBetCreated={matches.refetch} />;
}

function MatchList({
  matches,
  onBetCreated,
}: {
  matches: Match[];
  onBetCreated: () => void;
}) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [savedBets, setSavedBets] = useState<
    Map<number, { scoreA: number; scoreB: number; modifier: BetModifier }>
  >(new Map());
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [wheelOption, setWheelOption] = useState<
    (typeof BET_WHEEL_OPTIONS)[number] | null
  >(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const scoreAId = useId();
  const scoreBId = useId();

  const createBet = useMutation(
    trpc.bet.create.mutationOptions({
      onSuccess: (bet) => {
        toast.success("Aposta salva");
        setSavedBets((bets) =>
          new Map(bets).set(bet.matchId, {
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            modifier: bet.modifier,
          }),
        );
        onBetCreated();
        setIsWheelSpinning(false);
      },
      onError: () => {
        setIsWheelSpinning(false);
      },
    }),
  );

  const openBetModal = (match: Match) => {
    const isScored = match.scoreA !== null || match.scoreB !== null;

    if (isScored || match.hasBet || savedBets.has(match.id)) {
      return;
    }

    playDuckSound();
    createBet.reset();
    setSelectedMatch(match);
    setScoreA("");
    setScoreB("");
    setWheelOption(null);
    setWheelRotation(0);
    setIsWheelSpinning(false);
  };

  const closeBetModal = () => {
    if (createBet.isPending || isWheelSpinning) {
      return;
    }

    setSelectedMatch(null);
    setWheelOption(null);
    setWheelRotation(0);
    setScoreA("");
    setScoreB("");
    createBet.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMatch || !canSubmit) {
      return;
    }

    const optionIndex = Math.floor(Math.random() * BET_WHEEL_OPTIONS.length);
    const option = BET_WHEEL_OPTIONS[optionIndex];
    const landingRotation =
      360 * WHEEL_FULL_TURNS -
      (optionIndex * WHEEL_SEGMENT_DEGREES + WHEEL_SEGMENT_DEGREES / 2);

    setWheelOption(option);
    setIsWheelSpinning(true);
    setWheelRotation(0);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setWheelRotation(landingRotation);
      });
    });

    window.setTimeout(() => {
      createBet.mutate({
        matchId: selectedMatch.id,
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        modifier: option.value,
      });
    }, WHEEL_SPIN_DURATION_MS + 500);
  };

  const canSubmit =
    selectedMatch !== null &&
    selectedMatch.scoreA === null &&
    selectedMatch.scoreB === null &&
    !selectedMatch.hasBet &&
    !savedBets.has(selectedMatch.id) &&
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number(scoreA) >= 0 &&
    Number(scoreB) >= 0 &&
    Number.isInteger(Number(scoreA)) &&
    Number.isInteger(Number(scoreB));

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partida</TableHead>
            <TableHead>Sua aposta</TableHead>
            <TableHead>Roleta</TableHead>
            <TableHead>Placar final</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const savedBet = savedBets.get(match.id);
            const betScoreA = savedBet?.scoreA ?? match.betScoreA;
            const betScoreB = savedBet?.scoreB ?? match.betScoreB;
            const betModifier = savedBet?.modifier ?? match.betModifier;
            const isScored = match.scoreA !== null || match.scoreB !== null;
            const hasBet = match.hasBet || savedBet !== undefined;
            const betLabel =
              hasBet && betScoreA !== null && betScoreB !== null
                ? `${betScoreA} - ${betScoreB}`
                : "-";
            const modifierLabel =
              hasBet && betModifier ? getBetModifierLabel(betModifier) : "-";
            const finalScoreLabel = isScored
              ? `${match.scoreA ?? "-"} - ${match.scoreB ?? "-"}`
              : "-";

            return (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.teamAName} x {match.teamBName}
                </TableCell>
                <TableCell>{betLabel}</TableCell>
                <TableCell>{modifierLabel}</TableCell>
                <TableCell>{finalScoreLabel}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => openBetModal(match)}
                    disabled={isScored || hasBet || createBet.isPending}
                  >
                    {isScored
                      ? "Encerrada"
                      : hasBet
                        ? "Aposta feita"
                        : "Apostar"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={selectedMatch !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeBetModal();
          }
        }}
      >
        {selectedMatch && (
          <DialogContent
            showCloseButton={!createBet.isPending && !isWheelSpinning}
          >
            <form onSubmit={handleSubmit} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>
                  {wheelOption ? "Roleta da sorte" : "Adicionar aposta"}
                </DialogTitle>
                <DialogDescription>
                  {wheelOption
                    ? "Sua aposta está recebendo uma consequência."
                    : `${selectedMatch.teamAName} x ${selectedMatch.teamBName}`}
                </DialogDescription>
              </DialogHeader>

              {wheelOption ? (
                <div className="grid gap-3">
                  <div className="grid justify-items-center gap-3">
                    <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-foreground" />
                    <div
                      className="relative size-56 rounded-full border bg-background shadow-sm transition-transform"
                      style={{
                        background: getWheelBackground(),
                        transform: `rotate(${wheelRotation}deg)`,
                        transitionDuration: `${WHEEL_SPIN_DURATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(.12,.78,.18,1)",
                      }}
                    >
                      {BET_WHEEL_OPTIONS.map((option, index) => (
                        <div
                          key={option.value}
                          className="absolute left-1/2 top-1/2 flex h-8 w-20 items-center justify-center text-center text-[10px] font-semibold leading-tight text-background"
                          style={getWheelLabelStyle(index)}
                        >
                          <span>{option.label}</span>
                        </div>
                      ))}
                      <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background" />
                    </div>
                  </div>
                  {!isWheelSpinning && (
                    <div className="border p-3">
                      <p className="text-sm font-semibold">
                        {wheelOption.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wheelOption.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={scoreAId}>{selectedMatch.teamAName}</Label>
                    <Input
                      id={scoreAId}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={scoreA}
                      onChange={(event) => setScoreA(event.target.value)}
                      disabled={createBet.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={scoreBId}>{selectedMatch.teamBName}</Label>
                    <Input
                      id={scoreBId}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={scoreB}
                      onChange={(event) => setScoreB(event.target.value)}
                      disabled={createBet.isPending}
                      required
                    />
                  </div>
                </div>
              )}

              {createBet.isError && (
                <p className="text-xs text-destructive">
                  {createBet.error.message}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeBetModal}
                  disabled={createBet.isPending || isWheelSpinning}
                >
                  {createBet.isSuccess ? "Fechar" : "Cancelar"}
                </Button>
                {!createBet.isSuccess && (
                  <Button
                    type="submit"
                    disabled={
                      !canSubmit || createBet.isPending || isWheelSpinning
                    }
                  >
                    {createBet.isPending || isWheelSpinning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Salvar aposta"
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function playDuckSound() {
  const audio = new Audio(DUCK_SOUND_URL);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function getBetModifierLabel(modifier: string) {
  return (
    BET_WHEEL_OPTIONS.find((option) => option.value === modifier)?.label ??
    "Sem efeito"
  );
}

function getWheelBackground() {
  const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

  return `conic-gradient(${BET_WHEEL_OPTIONS.map((_, index) => {
    const start = index * WHEEL_SEGMENT_DEGREES;
    const end = start + WHEEL_SEGMENT_DEGREES;

    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(", ")})`;
}

function getWheelLabelStyle(index: number) {
  const radius = 64;
  const angle = index * WHEEL_SEGMENT_DEGREES + WHEEL_SEGMENT_DEGREES / 2;
  const radians = angle * (Math.PI / 180);
  const x = Math.sin(radians) * radius;
  const y = -Math.cos(radians) * radius;

  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${
      angle + 90
    }deg)`,
  };
}
