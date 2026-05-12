"use client";

import { Toaster } from "@codecon/ui/components/sonner";
import { TooltipProvider } from "@codecon/ui/components/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/utils/trpc";

import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeAwareToaster() {
  const { resolvedTheme } = useTheme();

  return <Toaster richColors theme={resolvedTheme} />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="codecon-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <ThemeAwareToaster />
    </ThemeProvider>
  );
}
