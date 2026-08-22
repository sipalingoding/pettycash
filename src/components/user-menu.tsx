"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions";

export function UserMenu() {
  const [loggingOut, startLogout] = useTransition();

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="fixed top-2.5 right-4 z-40 md:top-5 md:right-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              title="Akun"
              className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d89aa6] to-[#b4697a] text-lg shadow-[0_6px_16px_rgba(180,105,122,0.32)] ring-2 ring-card transition-transform hover:scale-105 dark:from-[#e7a0b0] dark:to-[#c97f92]"
            >
              🧕
            </button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-[190px]">
          <div className="px-2 py-1.5">
            <div className="text-sm font-medium text-foreground">Karima Urfa Wardiani</div>
            <div className="text-xs text-muted-foreground">Sedang masuk</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={handleLogout}>
            {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            {loggingOut ? "Keluar…" : "Keluar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
