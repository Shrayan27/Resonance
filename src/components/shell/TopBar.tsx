"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Search, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/stores/library";
import { LogoMark } from "./Logo";

function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQuery = pathname === "/search" ? (params.get("q") ?? "") : "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(urlQuery);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  const [lastSent, setLastSent] = useState(urlQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    if (urlQuery !== lastSent) {
      setLastSent(urlQuery);
      setValue(urlQuery);
    }
  }

  const navigate = (q: string) => {
    const trimmed = q.trim();
    if (trimmed === lastSent) return;
    setLastSent(trimmed);
    if (!trimmed) {
      if (pathname === "/search") router.replace("/search");
      return;
    }
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onChange = (q: string) => {
    setValue(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(q), 300);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = () => {
    clearTimeout(timer.current);
    setValue("");
    navigate("");
    inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        navigate(value);
      }}
      className="group relative w-full max-w-[460px]"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-subtle transition-colors group-focus-within:text-white" />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (value ? clear() : e.currentTarget.blur())}
        placeholder="What do you want to play?"
        aria-label="Search"
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-full border border-transparent bg-elevated pr-20 pl-11 text-sm text-white outline-none transition-colors placeholder:text-subtle hover:border-white/20 focus:border-white focus:bg-hover"
      />
      {value ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-subtle hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-3.5 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 text-[11px] font-medium text-subtle sm:block">
          Ctrl K
        </kbd>
      )}
    </form>
  );
}

function SearchFallback() {
  return <div className="h-11 w-full max-w-[460px] rounded-full bg-elevated" aria-hidden />;
}

function AccountMenu() {
  const clearLibrary = () => {
    if (!window.confirm("Clear all liked songs, playlists and saved items from this browser? This cannot be undone.")) return;
    useLibrary.setState({ liked: [], playlists: [], savedCollections: [] });
    useLibrary.persist.clearStorage();
    useLibrary.persist.rehydrate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full bg-linear-to-br from-brand to-sky-400 text-sm font-bold text-brand-foreground outline-none ring-4 ring-black/60 transition-transform hover:scale-105 focus-visible:ring-white/60 aria-expanded:scale-105"
      >
        R
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Local profile</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="gap-2 py-2" onClick={clearLibrary}>
          <Trash2 /> Clear library data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HomeLink() {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      aria-label="Home"
      aria-current={pathname === "/" ? "page" : undefined}
      className={cn(
        "hidden size-11 shrink-0 place-items-center rounded-full bg-elevated transition-all hover:scale-105 hover:bg-hover sm:grid",
        pathname === "/" ? "text-white" : "text-subtle hover:text-white",
      )}
    >
      <Home className={cn("size-6", pathname === "/" && "fill-current")} />
    </Link>
  );
}

export function TopBar({ className }: { className?: string }) {
  return (
    <header className={cn("flex h-14 items-center gap-2 px-1 md:px-2", className)}>
      <div className="flex min-w-0 flex-1 items-center">
        <Link href="/" aria-label="Resonance home" className="rounded-full p-1.5 transition-transform hover:scale-105">
          <LogoMark className="size-8" />
        </Link>
      </div>
      <div className="flex w-full max-w-[560px] min-w-0 shrink items-center gap-2">
        <Suspense fallback={<div className="hidden size-11 shrink-0 rounded-full bg-elevated sm:block" aria-hidden />}>
          <HomeLink />
        </Suspense>
        <Suspense fallback={<SearchFallback />}>
          <SearchBox />
        </Suspense>
      </div>
      <div className="flex flex-1 items-center justify-end">
        <AccountMenu />
      </div>
    </header>
  );
}
