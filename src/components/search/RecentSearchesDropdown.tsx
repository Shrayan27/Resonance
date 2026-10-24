"use client";

import { History, Search, Trash2, X } from "lucide-react";
import { Artwork } from "@/components/media/Artwork";
import { useHydrated } from "@/lib/use-hydrated";
import { useRecentSearches, type RecentSearchItem } from "@/stores/recent-searches";

interface Props {
  isOpen: boolean;
  filterText?: string;
  onSelect: (item: RecentSearchItem) => void;
  onClose: () => void;
}

export function RecentSearchesDropdown({ isOpen, filterText = "", onSelect, onClose }: Props) {
  const hydrated = useHydrated();
  const items = useRecentSearches((s) => s.items);
  const removeSearch = useRecentSearches((s) => s.removeSearch);
  const clearAll = useRecentSearches((s) => s.clearAll);

  if (!isOpen || !hydrated || !items || items.length === 0) {
    return null;
  }

  const query = filterText.trim().toLowerCase();
  const filtered = query
    ? items.filter((item) => item.title.toLowerCase().includes(query) || item.query.toLowerCase().includes(query))
    : items;

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      onMouseDown={(e) => {
        // Prevent search input from blurring when interacting with dropdown
        e.preventDefault();
      }}
      className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[380px] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs font-semibold text-zinc-400">
        <div className="flex items-center gap-1.5">
          <History className="size-3.5 text-brand" />
          <span>Recent searches</span>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="size-3" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="mt-1 space-y-0.5">
        {filtered.map((item) => {
          const isArtist = item.type === "artist";
          const isQuery = item.type === "query";

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(item);
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 focus-visible:bg-white/10 outline-none cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isQuery ? (
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 group-hover:text-white transition-colors">
                    <Search className="size-4" />
                  </div>
                ) : (
                  <Artwork
                    src={item.image}
                    round={isArtist}
                    fallback={isArtist ? "artist" : "track"}
                    className="size-8 shrink-0 shadow-sm"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-white group-hover:text-brand transition-colors">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-zinc-400 capitalize">
                    {item.subtitle || item.type}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Remove ${item.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearch(item.id);
                }}
                className="grid size-6 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-white/15 hover:text-white transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
