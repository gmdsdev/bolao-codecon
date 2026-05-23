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
    | "/admin/ranking"
    | "/admin/manager"
    | "/admin/stadiums"
    | "/admin/teams";
  label: string;
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.isAdmin === true;
  const links: HeaderLink[] = [
    { to: "/", label: "Rodadas" },
    { to: "/admin/ranking", label: "Ranking" },
    { to: "/admin/manager", label: "Partidas" },
    { to: "/admin/stadiums", label: "Estádios" },
    { to: "/admin/teams", label: "Times" },
  ];
  const visibleLinks = isAdmin ? links : [];

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
              render={<Link href={to} />}
              data-active={pathname === to}
              className="px-2 sm:px-3"
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
