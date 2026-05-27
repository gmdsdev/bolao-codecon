"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { AddMatchForm } from "./add-match-form";
import { MatchResultForm } from "./match-result-form";
import { MatchesTable } from "./matches-table";
import type { Match, Round, Stadium, Team } from "./types";

export function RoundMatches({
  round,
  teams,
  stadiums,
}: {
  round: Round;
  teams: Team[];
  stadiums: Stadium[];
}) {
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const matches = useQuery(
    trpc.match.getByRound.queryOptions({ roundId: round.id }),
  );

  const isRoundComplete = round.status === "complete";

  const handleEditMatch = (match: Match) => {
    if (isRoundComplete || match.status === "complete") return;
    setSelectedMatch(match);
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <CardTitle>{round.title}</CardTitle>
          <CardDescription>
            Status: {isRoundComplete ? "concluída" : round.status}
          </CardDescription>
        </div>
        {!isRoundComplete && (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsAddMatchOpen(true)}
          >
            Adicionar partida
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <MatchesTable
          matches={matches.data}
          isLoading={matches.isLoading}
          errorMessage={matches.error?.message}
          roundComplete={isRoundComplete}
          onEditMatch={handleEditMatch}
        />

        <Dialog open={isAddMatchOpen} onOpenChange={setIsAddMatchOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar partida</DialogTitle>
              <DialogDescription>{round.title}</DialogDescription>
            </DialogHeader>
            <AddMatchForm
              roundId={round.id}
              teams={teams}
              stadiums={stadiums}
              onCancel={() => setIsAddMatchOpen(false)}
              onCreated={() => {
                matches.refetch();
                setIsAddMatchOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={selectedMatch !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedMatch(null);
          }}
        >
          {selectedMatch && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar partida</DialogTitle>
                <DialogDescription>
                  {`${selectedMatch.teamAFlag ?? ""} ${
                    selectedMatch.teamAName ?? "A definir"
                  }`.trim()}{" "}
                  x{" "}
                  {`${selectedMatch.teamBName ?? "A definir"} ${
                    selectedMatch.teamBFlag ?? ""
                  }`.trim()}
                </DialogDescription>
              </DialogHeader>
              <MatchResultForm
                match={selectedMatch}
                teams={teams}
                stadiums={stadiums}
                onCancel={() => setSelectedMatch(null)}
                onSaved={() => {
                  matches.refetch();
                  setSelectedMatch(null);
                }}
              />
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
