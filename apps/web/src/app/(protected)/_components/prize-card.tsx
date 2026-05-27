"use client";

import Image from "next/image";
import premio from "@/assets/images/bolao/premio.png";
import { Card, CardContent } from "@codecon/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { useState } from "react";

export function PrizeCard() {
  const [isPrizeOpen, setIsPrizeOpen] = useState(false);

  return (
    <Dialog open={isPrizeOpen} onOpenChange={setIsPrizeOpen}>
      <Card
        role="button"
        tabIndex={0}
        aria-label="Abrir imagem da premiação em tamanho maior"
        className="h-min w-full shrink-0 cursor-pointer transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-72"
        onClick={() => setIsPrizeOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsPrizeOpen(true);
          }
        }}
      >
        <CardContent className="p-0">
          <Image
            src={premio}
            sizes="(min-width: 1024px) 18rem, 100vw"
            className="h-auto w-full rounded-xs"
            alt="Premiação do bolão da Codecon"
            loading="eager"
          />
        </CardContent>
      </Card>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-hidden sm:max-h-[calc(100vh-2rem)] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Premiação do bolão da Codecon</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-auto">
          <Image
            src={premio}
            width={1165}
            height={1165}
            sizes="(min-width: 1024px) 56rem, calc(100vw - 2rem)"
            className="h-auto w-full rounded-xs"
            alt="Premiação do bolão da Codecon"
            loading="eager"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
