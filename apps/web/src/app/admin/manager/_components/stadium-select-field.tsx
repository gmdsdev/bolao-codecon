"use client";

import { Label } from "@codecon/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codecon/ui/components/select";

import { getStadiumOptions } from "./match-utils";
import type { Stadium } from "./types";

export function StadiumSelectField({
  id,
  value,
  stadiums,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  stadiums: Stadium[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>Estádio</Label>
      <Select
        id={id}
        items={getStadiumOptions(stadiums)}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue ?? "")}
        disabled={disabled || stadiums.length === 0}
        required
      >
        <SelectTrigger className="w-full min-w-0" size="default">
          <SelectValue
            className="min-w-0 truncate"
            placeholder="Selecione um estádio"
          />
        </SelectTrigger>
        <SelectContent align="start">
          {stadiums.map((stadium) => (
            <SelectItem
              key={stadium.id}
              value={String(stadium.id)}
              className="min-w-0"
            >
              <span className="block min-w-0 truncate">
                {stadium.name} - {stadium.city}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
