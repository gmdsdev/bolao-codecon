import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@codecon/ui/components/empty";
import { RankingTable } from "@/components/ranking-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertCircleIcon, Loader2Icon, TrophyIcon } from "lucide-react";

type User = {
  id: number;
  userName: string;
  points: number;
};

type TableRankingProps = {
  ranking: UseQueryResult<User[]>;
};

export function TableRanking({ ranking }: TableRankingProps) {
  return (
    <Card className="w-full h-min shrink-0 lg:w-72">
      <CardHeader>
        <CardTitle>Classificação</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TableRankingContent ranking={ranking} />
      </CardContent>
    </Card>
  );
}

function TableRankingContent({ ranking }: TableRankingProps) {
  if (ranking.isLoading) {
    return <TableRankingLoadingState />;
  }

  if (ranking.isError) {
    return <TableRankingErrorState />;
  }

  if (ranking.isFetched) {
    if (ranking?.data?.length) {
      return <TableRankingData data={ranking.data} />;
    } else {
      return <TableRankingEmptyState />;
    }
  }

  return null;
}

function TableRankingData({ data }: { data: User[] }) {
  return <RankingTable ranking={data} />;
}

function TableRankingEmptyState() {
  return (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia>
          <TrophyIcon className="size-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Nenhuma classificação ainda</EmptyTitle>
        <EmptyDescription>
          As pontuações aparecerão aqui conforme as apostas forem resolvidas.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function TableRankingLoadingState() {
  return (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia>
          <Loader2Icon className="size-8 text-muted-foreground animate-spin" />
        </EmptyMedia>
        <EmptyTitle>Carregando classificação...</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

function TableRankingErrorState() {
  return (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia>
          <AlertCircleIcon className="size-8 text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Erro ao carregar</EmptyTitle>
        <EmptyDescription>
          Não foi possível carregar a classificação. Tente novamente.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
