import type { BetWheelOption } from "./types";

export const BET_WHEEL_OPTIONS: BetWheelOption[] = [
  {
    value: "invert_bet",
    label: "Inverter aposta",
    description: "Seu placar troca de lado antes de ser salvo.",
  },
  {
    value: "double_points",
    label: "Pontos em dobro",
    description: "Todos os pontos desta aposta são dobrados.",
  },
  {
    value: "half_points",
    label: "Metade dos pontos",
    description: "Todos os pontos desta aposta são reduzidos pela metade.",
  },
  {
    value: "invalid_bet",
    label: "Aposta inválida",
    description: "Esta aposta vale zero ponto.",
  },
  {
    value: "lucky_duck",
    label: "Pato da sorte",
    description: "Ganhe um ponto bônus se esta aposta pontuar.",
  },
  {
    value: "normal",
    label: "Sem efeito",
    description: "Sem surpresa. A aposta é salva como foi enviada.",
  },
];

export const WHEEL_SEGMENT_DEGREES = 360 / BET_WHEEL_OPTIONS.length;
export const WHEEL_SPIN_DURATION_MS = 3000;
export const WHEEL_FULL_TURNS = 7;
