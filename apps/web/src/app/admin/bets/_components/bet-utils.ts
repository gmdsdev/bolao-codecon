export const BET_MODIFIER_OPTIONS = [
  { value: "invert_bet", label: "Inverter aposta" },
  { value: "double_points", label: "Pontos em dobro" },
  { value: "half_points", label: "Metade dos pontos" },
  { value: "invalid_bet", label: "Aposta inválida" },
  { value: "lucky_duck", label: "Pato da sorte" },
  { value: "normal", label: "Sem efeito" },
] as const;

export function getBetModifierLabel(modifier: string) {
  return (
    BET_MODIFIER_OPTIONS.find((option) => option.value === modifier)?.label ??
    "Sem efeito"
  );
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTeam(flag: string, name: string) {
  return `${flag} ${name}`.trim();
}
