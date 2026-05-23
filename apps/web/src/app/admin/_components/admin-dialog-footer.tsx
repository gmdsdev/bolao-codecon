import { Button } from "@codecon/ui/components/button";
import { DialogFooter } from "@codecon/ui/components/dialog";

export function AdminDialogFooter({
  cancelLabel = "Cancelar",
  submitLabel,
  submitType = "submit",
  submitVariant,
  isPending,
  submitPending = isPending,
  canSubmit = true,
  pendingContent,
  onCancel,
  onSubmit,
  children,
}: {
  cancelLabel?: string;
  submitLabel?: React.ReactNode;
  submitType?: "button" | "submit";
  submitVariant?: React.ComponentProps<typeof Button>["variant"];
  isPending: boolean;
  submitPending?: boolean;
  canSubmit?: boolean;
  pendingContent: React.ReactNode;
  onCancel: () => void;
  onSubmit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
      >
        {cancelLabel}
      </Button>
      {submitLabel ? (
        <Button
          type={submitType}
          variant={submitVariant}
          onClick={onSubmit}
          disabled={!canSubmit || isPending}
        >
          {submitPending ? pendingContent : submitLabel}
        </Button>
      ) : null}
      {children}
    </DialogFooter>
  );
}
