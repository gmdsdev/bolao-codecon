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
  adminOnly?: boolean;
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.isAdmin === true;
  const links: HeaderLink[] = [
    { to: "/", label: "Rodadas" },
    { to: "/admin/ranking", label: "Ranking", adminOnly: true },
    { to: "/admin/manager", label: "Partidas", adminOnly: true },
    { to: "/admin/stadiums", label: "Estádios", adminOnly: true },
    { to: "/admin/teams", label: "Times", adminOnly: true },
  ];

  return (
    <NavigationMenu className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-border bg-secondary px-2 sm:px-3">
      <NavigationMenuList className="w-full min-w-0 justify-start overflow-x-auto">
        <NavigationMenuItem className="shrink-0">
          <CodeconLogo height={12} width={69} className="mr-1.5 sm:mr-3" />
        </NavigationMenuItem>

        {links
          .filter((link) => !link.adminOnly || isAdmin)
          .map(({ to, label }) => (
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
