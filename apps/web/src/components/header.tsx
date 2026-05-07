"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const pathname = usePathname();
  const links = [
    { to: "/admin/rounds/1", label: "Rodadas" },
    { to: "/admin/ranking", label: "Classificação" },
    { to: "/admin/manager", label: "Manager" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-secondary">
      <div className="flex h-10 flex-row items-center justify-between px-3">
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="mr-3 rounded px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent"
          >
            codecon
          </Link>
          {links.map(({ to, label }) => {
            const isActive =
              pathname === to ||
              (to.startsWith("/admin/rounds") &&
                pathname.startsWith("/admin/rounds"));

            return (
              <Link
                key={to}
                href={to}
                data-active={isActive}
                className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
