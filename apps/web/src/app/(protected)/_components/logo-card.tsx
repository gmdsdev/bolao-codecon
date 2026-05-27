import Image from "next/image";
import { Card, CardContent } from "@codecon/ui/components/card";
import logo from "@/assets/images/bolao/bolao-logo.png";

export function LogoCard() {
  return (
    <Card className="h-min w-full shrink-0 lg:w-56">
      <CardContent className="p-0">
        <Image
          src={logo}
          sizes="(min-width: 1024px) 18rem, 100vw"
          className="h-auto w-full rounded-xs"
          alt="Premiação do bolão da Codecon"
          loading="eager"
        />
      </CardContent>
    </Card>
  );
}
