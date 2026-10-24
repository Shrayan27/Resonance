"use client";

import { History, Pause, Play, Trash2, X } from "lucide-react";
import { Artwork } from "@/components/media/Artwork";
import { useHydrated } from "@/lib/use-hydrated";
import { useRecentSearches, type RecentSearchItem } from "@/stores/recent-searches";
import { selectCurrentTrack, usePlayer } from "@/stores/player";

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

  const currentTrack = usePlayer(selectCurrentTrack);
  const isPlaying = usePlayer((s) => s.isPlaying);

  if (!isOpen || !hydrated || !items || items.length === 0) {
    return null;
  }

  const query = filterText.trim().toLowerCase();
  const filtered = query
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query)
      )
    : items;

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      onMouseDown={(e) => {
        // Prevent search input from blurring when clicking inside dropdown
        e.preventDefault();
      }}
      className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs font-semibold text-zinc-400">
        <div className="flex items-center gap-1.5">
          <History className="size-3.5 text-brand" />
          <span>Recent items</span>
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
          const isCurrentSong = item.type === "track" && currentTrack?.id === item.trackData?.id;
          const isSongPlaying = isCurrentSong && isPlaying;

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
                <div className="relative shrink-0">
                  <Artwork
                    src={item.image}
                    round={isArtist}
                    fallback={isArtist ? "artist" : "track"}
                    className="size-9 shadow-sm"
                  />
                  {item.type === "track" && (
                    <div
                      className={`absolute inset-0 grid place-items-center rounded bg-black/60 text-white transition-opacity ${
                        isSongPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isSongPlaying ? (
                        <Pause className="size-3.5 fill-current" />
                      ) : (
                        <Play className="size-3.5 fill-current translate-x-px" />
                      )}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`truncate font-medium transition-colors ${
                      isCurrentSong ? "text-brand" : "text-white group-hover:text-brand"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {item.subtitle}
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
