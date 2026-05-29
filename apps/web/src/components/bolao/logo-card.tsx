import Image from "next/image";
import { Card, CardContent } from "@codecon/ui/components/card";
import { cn } from "@codecon/ui/lib/utils";

import logo from "@/assets/images/bolao/bolao-logo.png";

type LogoCardProps = {
  className?: string;
};

export function LogoCard({ className }: LogoCardProps) {
  return (
    <Card className={cn("h-min w-full shrink-0 lg:w-56", className)}>
      <CardContent className="p-0">
        <Image
          src={logo}
          sizes="(min-width: 1024px) 18rem, 100vw"
          className="h-auto w-full rounded-xs"
          alt="Logo do bolão da Codecon"
          loading="eager"
        />
      </CardContent>
    </Card>
  );
}
