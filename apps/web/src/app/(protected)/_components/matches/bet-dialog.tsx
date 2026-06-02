import { Button } from "@codecon/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { Loader2 } from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useId,
} from "react";

import { getUserErrorMessage } from "@/lib/error-message";

import { BetWheel } from "./bet-wheel";
import { ScoreInputs } from "./score-inputs";
import type { BetWheelOption, Match } from "./types";

type BetDialogProps = {
  match: Match | null;
  scoreA: string;
  scoreB: string;
  wheelOption: BetWheelOption | null;
  wheelRotation: number;
  isWheelSpinning: boolean;
  canSubmit: boolean;
  createBet: {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: { message: string } | null;
  };
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onScoreAChange: Dispatch<SetStateAction<string>>;
  onScoreBChange: Dispatch<SetStateAction<string>>;
};

export function BetDialog({
  match,
  scoreA,
  scoreB,
  wheelOption,
  wheelRotation,
  isWheelSpinning,
  canSubmit,
  createBet,
  onClose,
  onSubmit,
  onScoreAChange,
  onScoreBChange,
}: BetDialogProps) {
  const scoreAId = useId();
  const scoreBId = useId();

  return (
    <Dialog
      open={match !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      {match && (
        <DialogContent
          showCloseButton={!createBet.isPending && !isWheelSpinning}
        >
          <form onSubmit={onSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {wheelOption ? "Roleta da sorte" : "Adicionar aposta"}
              </DialogTitle>
              <DialogDescription>
                {wheelOption
                  ? "Sua aposta está recebendo uma consequência."
                  : `${match.teamAName} x ${match.teamBName}`}
              </DialogDescription>
            </DialogHeader>

            {wheelOption ? (
              <BetWheel
                selectedOption={wheelOption}
                rotation={wheelRotation}
                isSpinning={isWheelSpinning}
              />
            ) : (
              <ScoreInputs
                match={match}
                scoreA={scoreA}
                scoreB={scoreB}
                scoreAId={scoreAId}
                scoreBId={scoreBId}
                disabled={createBet.isPending}
                onScoreAChange={onScoreAChange}
                onScoreBChange={onScoreBChange}
              />
            )}

            {createBet.isError && (
              <p className="text-xs text-destructive">
                {getUserErrorMessage(
                  createBet.error,
                  "Não foi possível salvar sua aposta. Tente novamente.",
                )}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createBet.isPending || isWheelSpinning}
              >
                {createBet.isSuccess ? "Fechar" : "Cancelar"}
              </Button>
              {!createBet.isSuccess && (
                <Button
                  type="submit"
                  disabled={!canSubmit || createBet.isPending || isWheelSpinning}
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
  );
}
