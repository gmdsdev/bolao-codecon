import logo from "@/assets/codecon.svg";
import { cn } from "@codecon/ui/lib/utils";
import type { CSSProperties, ComponentPropsWithoutRef } from "react";

type CodeconLogoProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  height?: number;
  label?: string;
  width?: number;
};

const logoUrl = typeof logo === "string" ? logo : logo.src;

export function CodeconLogo({
  className,
  height = 21,
  label = "Codecon logo",
  style,
  width = 120,
  ...props
}: CodeconLogoProps) {
  const maskStyle = {
    "--codecon-logo-url": `url("${logoUrl}")`,
    WebkitMaskImage: "var(--codecon-logo-url)",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    backgroundColor: "currentColor",
    height,
    maskImage: "var(--codecon-logo-url)",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
    width,
    ...style,
  } as CSSProperties;

  return (
    <span
      aria-label={label}
      className={cn("block shrink-0 text-foreground", className)}
      role="img"
      style={maskStyle}
      {...props}
    />
  );
}
