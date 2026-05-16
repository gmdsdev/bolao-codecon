import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codecon/ui/components/dropdown-menu";
import { cn } from "@codecon/ui/lib/utils";
import { Skeleton } from "@codecon/ui/components/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const userMenuItemClassName =
  "flex h-9 max-w-40 items-center gap-2 rounded-none p-3 text-xs font-medium outline-none transition-all hover:bg-muted focus:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-1 data-open:bg-muted/50 data-popup-open:bg-muted/50";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24 rounded-none" />;
  }

  if (!session) {
    return (
      <Link href="/sign-in" className={userMenuItemClassName}>
        Entrar
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(userMenuItemClassName, "justify-start")}
          />
        }
      >
        <span className="truncate">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/sign-in");
                  },
                },
              });
            }}
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
