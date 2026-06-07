"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CodeconLogo } from "./codecon-logo";
import UserMenu from "./user-menu";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@codecon/ui/components/navigation-menu";

type HeaderLink = {
  to:
    | "/"
    | "/chaveamento"
    | "/ranking"
    | "/admin/manager"
    | "/admin/stadiums"
    | "/admin/teams"
    | "/admin/users"
    | "/admin/bets";
  label: string;
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.isAdmin === true;
  const commonLinks: HeaderLink[] = [
    { to: "/", label: "Rodadas" },
    { to: "/chaveamento", label: "Chaveamento" },
    { to: "/ranking", label: "Ranking" },
  ];
  const adminLinks: HeaderLink[] = [
    { to: "/admin/manager", label: "Partidas" },
    { to: "/admin/stadiums", label: "Estádios" },
    { to: "/admin/teams", label: "Times" },
    { to: "/admin/users", label: "Usuários" },
    { to: "/admin/bets", label: "Apostas" },
  ];
  const visibleLinks = isAdmin ? [...commonLinks, ...adminLinks] : commonLinks;

  return (
    <NavigationMenu className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-border bg-secondary px-2 sm:px-3">
      <NavigationMenuList className="w-full min-w-0 justify-start overflow-x-auto">
        <NavigationMenuItem className="shrink-0">
          <Link
            href="/"
            aria-label="Ir para a tela inicial"
            className="mr-1.5 block text-foreground sm:mr-3"
          >
            <CodeconLogo height={12} width={69} />
          </Link>
        </NavigationMenuItem>

        {visibleLinks.map(({ to, label }) => (
          <NavigationMenuItem key={to} className="shrink-0">
            <NavigationMenuLink
              render={<Link href={to as never} />}
              data-active={pathname === to}
              className="relative px-2 after:absolute after:right-2 after:bottom-0 after:left-2 after:h-0.5 after:bg-transparent data-active:after:bg-foreground/40 sm:px-3 sm:after:right-3 sm:after:left-3"
            >
              {label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        <NavigationMenuItem className="ml-auto shrink-0">
          <UserMenu />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
