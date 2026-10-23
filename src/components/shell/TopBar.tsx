"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Home, LogOut, Palette, Search, Sparkles, Trash2, User, X } from "lucide-react";
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
import { useAuth } from "@/stores/auth";
import { useLibrary } from "@/stores/library";
import { THEMES, useTheme } from "@/stores/theme";
import { Logo } from "./Logo";

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
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 sm:left-3.5 sm:size-5 -translate-y-1/2 text-subtle transition-colors group-focus-within:text-white" />
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
        className="h-9 sm:h-11 w-full rounded-full border border-transparent bg-elevated pr-8 pl-8 sm:pr-20 sm:pl-11 text-xs sm:text-sm text-white outline-none transition-colors placeholder:text-subtle hover:border-white/20 focus:border-white focus:bg-hover"
      />
      {value ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 grid size-6 sm:size-7 -translate-y-1/2 place-items-center rounded-full text-subtle hover:text-white"
        >
          <X className="size-3.5 sm:size-4" />
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
  return <div className="h-9 sm:h-11 w-full max-w-[460px] rounded-full bg-elevated" aria-hidden />;
}

function AccountMenu() {
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const openTasteModal = useAuth((s) => s.openTasteModal);
  const logout = useAuth((s) => s.logout);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  const clearLibrary = () => {
    if (!window.confirm("Clear all liked songs, playlists and saved items from this browser? This cannot be undone.")) return;
    useLibrary.setState({ liked: [], playlists: [], savedCollections: [] });
    useLibrary.persist.clearStorage();
    useLibrary.persist.rehydrate();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-sm"
        >
          <User className="size-3.5" />
          <span className="hidden sm:inline">Sign in</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Theme menu"
            className="grid size-9 place-items-center rounded-full bg-elevated text-subtle hover:text-white transition-transform hover:scale-105"
          >
            <Palette className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <Palette className="size-3.5" aria-hidden /> Color theme
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {THEMES.map((t) => (
              <DropdownMenuItem key={t.id} className="gap-2.5 py-2" onClick={() => setTheme(t.id)}>
                <span
                  aria-hidden
                  className="size-4 rounded-full ring-1 ring-white/20"
                  style={{ backgroundImage: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                />
                {t.label}
                {theme === t.id && <Check className="ml-auto size-4" aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="gap-2 py-2" onClick={clearLibrary}>
              <Trash2 /> Clear library data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const primaryGenre = user.taste?.preferredGenres?.[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "grid size-9 place-items-center rounded-full bg-linear-to-tr text-sm font-bold text-black outline-none ring-2 ring-brand/60 transition-transform hover:scale-105 focus-visible:ring-white/60 aria-expanded:scale-105 shadow-md",
          user.avatarColor || "from-brand to-emerald-400",
        )}
      >
        {user.name.charAt(0).toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup className="px-2 py-1.5">
          <p className="truncate text-sm font-bold text-white">{user.name}</p>
          <p className="truncate text-xs text-zinc-400">{user.email}</p>
          {primaryGenre && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-brand">
              <Sparkles className="size-2.5" /> {primaryGenre} Vibe
            </span>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2.5 py-2 cursor-pointer font-medium" onClick={openTasteModal}>
          <Sparkles className="size-4 text-brand" />
          <span>My Music Taste</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Palette className="size-3.5" aria-hidden /> Color theme
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} className="gap-2.5 py-2" onClick={() => setTheme(t.id)}>
            <span
              aria-hidden
              className="size-4 rounded-full ring-1 ring-white/20"
              style={{ backgroundImage: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
            />
            {t.label}
            {theme === t.id && <Check className="ml-auto size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 py-2 text-rose-400 hover:text-rose-300 cursor-pointer" onClick={() => logout()}>
          <LogOut className="size-4" />
          <span>Sign Out</span>
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
    <header className={cn("flex h-14 items-center justify-between gap-2 px-1 md:px-2", className)}>
      <div className="flex shrink-0 items-center">
        <Link href="/" aria-label="Resonance home" className="rounded-xl p-1 sm:p-1.5 transition-transform hover:scale-105">
          <Logo className="[&>span]:hidden xl:[&>span]:inline" />
        </Link>
      </div>
      <div className="flex w-full max-w-[560px] min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2 px-1">
        <Suspense fallback={<div className="hidden size-11 shrink-0 rounded-full bg-elevated sm:block" aria-hidden />}>
          <HomeLink />
        </Suspense>
        <Suspense fallback={<SearchFallback />}>
          <SearchBox />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        <AccountMenu />
      </div>
    </header>
  );
}
