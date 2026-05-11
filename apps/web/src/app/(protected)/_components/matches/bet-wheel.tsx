import { BET_WHEEL_OPTIONS, WHEEL_SPIN_DURATION_MS } from "./bet-wheel-options";
import { getWheelBackground, getWheelLabelStyle } from "./match-utils";
import type { BetWheelOption } from "./types";

type BetWheelProps = {
  selectedOption: BetWheelOption;
  rotation: number;
  isSpinning: boolean;
};

export function BetWheel({
  selectedOption,
  rotation,
  isSpinning,
}: BetWheelProps) {
  return (
    <div className="grid gap-3">
      <div className="grid justify-items-center gap-3">
        <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-foreground" />
        <div
          className="relative size-56 rounded-full border bg-background shadow-sm transition-transform"
          style={{
            background: getWheelBackground(),
            transform: `rotate(${rotation}deg)`,
            transitionDuration: `${WHEEL_SPIN_DURATION_MS}ms`,
            transitionTimingFunction: "cubic-bezier(.12,.78,.18,1)",
          }}
        >
          {BET_WHEEL_OPTIONS.map((option, index) => (
            <div
              key={option.value}
              className="absolute left-1/2 top-1/2 flex h-8 w-20 items-center justify-center text-center text-[10px] font-semibold leading-tight text-background"
              style={getWheelLabelStyle(index)}
            >
              <span>{option.label}</span>
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background" />
        </div>
      </div>
      {!isSpinning && (
        <div className="border p-3">
          <p className="text-sm font-semibold">{selectedOption.label}</p>
          <p className="text-xs text-muted-foreground">
            {selectedOption.description}
          </p>
        </div>
      )}
    </div>
  );
}
