"use client";

import { Button } from "@codecon/ui/components/button";
import { Calendar } from "@codecon/ui/components/calendar";
import { Input } from "@codecon/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@codecon/ui/components/popover";
import { CalendarIcon } from "lucide-react";

import {
  formatDateTimeDisplay,
  formatDatetimeLocalFromDate,
  isValidDatetimeLocal,
} from "./match-utils";

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedDate = isValidDatetimeLocal(value) ? new Date(value) : undefined;
  const timeValue = selectedDate ? value.slice(11, 16) : "";

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const [hours = "00", minutes = "00"] = timeValue
      ? timeValue.split(":")
      : [];
    const nextDate = new Date(date);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);

    onChange(formatDatetimeLocalFromDate(nextDate));
  };

  const handleTimeChange = (time: string) => {
    if (!selectedDate || time === "") return;

    const [hours = "00", minutes = "00"] = time.split(":");
    const nextDate = new Date(selectedDate);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);

    onChange(formatDatetimeLocalFromDate(nextDate));
  };

  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
      <Popover>
        <PopoverTrigger
          id={id}
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-0 justify-start text-left font-normal"
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="size-4" />
          <span
            className={
              selectedDate
                ? "min-w-0 truncate"
                : "min-w-0 truncate text-muted-foreground"
            }
          >
            {selectedDate
              ? formatDateTimeDisplay(selectedDate)
              : "Selecione uma data"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>

      <Input
        className="min-w-0"
        type="time"
        value={timeValue}
        onChange={(event) => handleTimeChange(event.target.value)}
        disabled={disabled || !selectedDate}
        required
      />
    </div>
  );
}
