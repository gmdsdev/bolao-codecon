import { Loader2 } from "lucide-react";

export function TableLoadingState() {
  return (
    <div className="flex justify-center py-4">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

export function TableErrorState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center text-sm text-destructive">
      Erro: {message}
    </div>
  );
}

export function TableEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
