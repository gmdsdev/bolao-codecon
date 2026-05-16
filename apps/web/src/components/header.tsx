"use client";

import logo from "@/assets/codecon.svg";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@codecon/ui/components/navigation-menu";

type HeaderLink = {
  to: "/" | "/admin/ranking" | "/admin/manager";
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
    { to: "/admin/manager", label: "Manager", adminOnly: true },
  ];

  return (
    <NavigationMenu className="sticky top-0 z-40 w-full max-w-full border-b border-border bg-secondary px-3">
      <NavigationMenuList className="w-full justify-start">
        <NavigationMenuItem>
          <Image src={logo} alt="Codecon logo" height={12} className="pr-3" />
        </NavigationMenuItem>

        {links
          .filter((link) => !link.adminOnly || isAdmin)
          .map(({ to, label }) => (
            <NavigationMenuItem key={to}>
              <NavigationMenuLink
                render={<Link href={to} />}
                data-active={pathname === to}
              >
                {label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

        <NavigationMenuItem className="ml-auto flex items-center">
          <ModeToggle />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <UserMenu />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
