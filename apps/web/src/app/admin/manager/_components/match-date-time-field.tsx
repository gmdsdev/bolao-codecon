"use client";

import { Label } from "@codecon/ui/components/label";

import { DateTimePicker } from "./date-time-picker";

export function MatchDateTimeField({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>Data e hora</Label>
      <DateTimePicker
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
