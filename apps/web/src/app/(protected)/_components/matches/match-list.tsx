"use client";

import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import {
  BET_WHEEL_OPTIONS,
  WHEEL_FULL_TURNS,
  WHEEL_SEGMENT_DEGREES,
  WHEEL_SPIN_DURATION_MS,
} from "./bet-wheel-options";
import { BetDialog } from "./bet-dialog";
import { playDuckSound } from "./duck-sound";
import { MatchGroupCard } from "./match-group-card";
import { getGroupStageMatchGroups } from "./match-utils";
import type { BetModifier, Match, SavedBet } from "./types";

type MatchListProps = {
  matches: Match[];
  renderedAt: string;
  onBetCreated: () => void;
};

export function MatchList({
  matches,
  renderedAt,
  onBetCreated,
}: MatchListProps) {
  const [currentTimeMs, setCurrentTimeMs] = useState(() =>
    Date.parse(renderedAt),
  );
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [savedBets, setSavedBets] = useState<Map<number, SavedBet>>(new Map());
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [penaltyScoreA, setPenaltyScoreA] = useState("");
  const [penaltyScoreB, setPenaltyScoreB] = useState("");
  const [wheelOption, setWheelOption] = useState<
    (typeof BET_WHEEL_OPTIONS)[number] | null
  >(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);

  const createBet = useMutation(
    trpc.bet.create.mutationOptions({
      onSuccess: (bet) => {
        const foundOptionIndex = BET_WHEEL_OPTIONS.findIndex(
          (option) => option.value === bet.modifier,
        );
        const optionIndex = foundOptionIndex >= 0 ? foundOptionIndex : 0;
        const option =
          BET_WHEEL_OPTIONS[optionIndex] ?? BET_WHEEL_OPTIONS[0];
        const landingRotation =
          360 * WHEEL_FULL_TURNS -
          (optionIndex * WHEEL_SEGMENT_DEGREES + WHEEL_SEGMENT_DEGREES / 2);

        setWheelOption(option);
        setWheelRotation(0);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setWheelRotation(landingRotation);
          });
        });
        window.setTimeout(() => {
          setIsWheelSpinning(false);
        }, WHEEL_SPIN_DURATION_MS);

        toast.success("Aposta salva");
        setSavedBets((bets) =>
          new Map(bets).set(bet.matchId, {
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            penaltyScoreA: bet.penaltyScoreA,
            penaltyScoreB: bet.penaltyScoreB,
            modifier: bet.modifier as BetModifier,
          }),
        );
        onBetCreated();
      },
      onError: () => {
        setWheelOption(null);
        setIsWheelSpinning(false);
      },
    }),
  );

  useEffect(() => {
    setCurrentTimeMs(Date.now());
  }, []);

  const requiresPenaltyScore =
    selectedMatch !== null &&
    selectedMatch.roundNumber >= 4 &&
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number(scoreA) === Number(scoreB);
  const penaltyScoresAreValid =
    !requiresPenaltyScore ||
    (penaltyScoreA.trim() !== "" &&
      penaltyScoreB.trim() !== "" &&
      Number(penaltyScoreA) >= 0 &&
      Number(penaltyScoreB) >= 0 &&
      Number.isInteger(Number(penaltyScoreA)) &&
      Number.isInteger(Number(penaltyScoreB)) &&
      Number(penaltyScoreA) !== Number(penaltyScoreB));
  const canSubmit =
    selectedMatch !== null &&
    selectedMatch.status !== "draft" &&
    getMatchDateMs(selectedMatch) > currentTimeMs &&
    selectedMatch.scoreA === null &&
    selectedMatch.scoreB === null &&
    !selectedMatch.hasBet &&
    !savedBets.has(selectedMatch.id) &&
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number(scoreA) >= 0 &&
    Number(scoreB) >= 0 &&
    Number.isInteger(Number(scoreA)) &&
    Number.isInteger(Number(scoreB)) &&
    penaltyScoresAreValid;

  const matchGroups = getGroupStageMatchGroups(matches);

  const openBetModal = (match: Match) => {
    if (match.status === "draft") {
      return;
    }

    const isScored = match.scoreA !== null || match.scoreB !== null;
    const isClosed = isScored || getMatchDateMs(match) <= currentTimeMs;

    if (isClosed || match.hasBet || savedBets.has(match.id)) {
      return;
    }

    playDuckSound();
    createBet.reset();
    setSelectedMatch(match);
    setScoreA("");
    setScoreB("");
    setPenaltyScoreA("");
    setPenaltyScoreB("");
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
    setPenaltyScoreA("");
    setPenaltyScoreB("");
    createBet.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMatch || !canSubmit) {
      return;
    }

    setIsWheelSpinning(true);
    setWheelOption(null);
    setWheelRotation(0);
    createBet.mutate({
      matchId: selectedMatch.id,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      penaltyScoreA: requiresPenaltyScore ? Number(penaltyScoreA) : null,
      penaltyScoreB: requiresPenaltyScore ? Number(penaltyScoreB) : null,
    });
  };

  return (
    <>
      {matchGroups ? (
        <div className="grid gap-3">
          {matchGroups.map((group) => (
            <MatchGroupCard
              key={group.id}
              title={group.name}
              matches={group.matches}
              savedBets={savedBets}
              isBetPending={createBet.isPending}
              currentTimeMs={currentTimeMs}
              onOpenBet={openBetModal}
            />
          ))}
        </div>
      ) : (
        <MatchGroupCard
          title="Partidas"
          matches={matches}
          savedBets={savedBets}
          isBetPending={createBet.isPending}
          currentTimeMs={currentTimeMs}
          onOpenBet={openBetModal}
        />
      )}

      <BetDialog
        match={selectedMatch}
        scoreA={scoreA}
        scoreB={scoreB}
        penaltyScoreA={penaltyScoreA}
        penaltyScoreB={penaltyScoreB}
        wheelOption={wheelOption}
        wheelRotation={wheelRotation}
        isWheelSpinning={isWheelSpinning}
        canSubmit={canSubmit}
        createBet={createBet}
        onClose={closeBetModal}
        onSubmit={handleSubmit}
        onScoreAChange={setScoreA}
        onScoreBChange={setScoreB}
        onPenaltyScoreAChange={setPenaltyScoreA}
        onPenaltyScoreBChange={setPenaltyScoreB}
      />
    </>
  );
}

function getMatchDateMs(match: Match) {
  return new Date(match.date).getTime();
}
