"use client";

import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
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
  onBetCreated: () => void;
};

export function MatchList({ matches, onBetCreated }: MatchListProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [savedBets, setSavedBets] = useState<Map<number, SavedBet>>(new Map());
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [wheelOption, setWheelOption] = useState<
    (typeof BET_WHEEL_OPTIONS)[number] | null
  >(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);

  const createBet = useMutation(
    trpc.bet.create.mutationOptions({
      onSuccess: (bet) => {
        toast.success("Aposta salva");
        setSavedBets((bets) =>
          new Map(bets).set(bet.matchId, {
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            modifier: bet.modifier as BetModifier,
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

  const matchGroups = getGroupStageMatchGroups(matches);

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
          onOpenBet={openBetModal}
        />
      )}

      <BetDialog
        match={selectedMatch}
        scoreA={scoreA}
        scoreB={scoreB}
        wheelOption={wheelOption}
        wheelRotation={wheelRotation}
        isWheelSpinning={isWheelSpinning}
        canSubmit={canSubmit}
        createBet={createBet}
        onClose={closeBetModal}
        onSubmit={handleSubmit}
        onScoreAChange={setScoreA}
        onScoreBChange={setScoreB}
      />
    </>
  );
}
