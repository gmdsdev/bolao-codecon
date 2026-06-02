"use client";

import { Button } from "@codecon/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BetLogsData } from "./types";

export function BetLogsPagination({
  data,
  isLoading,
  onPageChange,
}: {
  data: BetLogsData | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (!data || data.total === 0) {
    return null;
  }

  const firstRecord = (data.page - 1) * data.pageSize + 1;
  const lastRecord = Math.min(data.page * data.pageSize, data.total);
  const canGoPrevious = data.page > 1;
  const canGoNext = data.page < data.pageCount;

  return (
    <div className="flex flex-col gap-3 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Exibindo {firstRecord}-{lastRecord} de {data.total} apostas
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onPageChange(data.page - 1)}
          disabled={isLoading || !canGoPrevious}
        >
          <ChevronLeft className="size-3.5" />
          Anterior
        </Button>
        <span className="shrink-0 text-xs text-muted-foreground">
          Página {data.page} de {data.pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onPageChange(data.page + 1)}
          disabled={isLoading || !canGoNext}
        >
          Próxima
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
