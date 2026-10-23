"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/library", label: "Your Library", icon: Library, match: (p: string) => p.startsWith("/library") || p.startsWith("/playlist") },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-[calc(var(--player-h)+env(safe-area-inset-bottom,0px))] z-30 flex h-14 items-center justify-around border-t border-white/10 bg-black/90 backdrop-blur md:hidden"
    >
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
              active ? "text-white" : "text-subtle",
            )}
          >
            <Icon className={cn("size-6", active && "text-brand")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
