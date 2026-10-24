"use client";

import { useRouter } from "next/navigation";
import { History, Pause, Play, Trash2, X } from "lucide-react";
import { Artwork } from "@/components/media/Artwork";
import { useHydrated } from "@/lib/use-hydrated";
import { useRecentSearches, type RecentSearchItem } from "@/stores/recent-searches";
import { selectCurrentTrack, usePlayer } from "@/stores/player";

export function RecentSearchesShelf() {
  const hydrated = useHydrated();
  const items = useRecentSearches((s) => s.items);
  const removeSearch = useRecentSearches((s) => s.removeSearch);
  const clearAll = useRecentSearches((s) => s.clearAll);
  const router = useRouter();

  const playTrackWithSmartQueue = usePlayer((s) => s.playTrackWithSmartQueue);
  const toggle = usePlayer((s) => s.toggle);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTrack = usePlayer(selectCurrentTrack);

  if (!hydrated || !items || items.length === 0) {
    return null;
  }

  const handleSelect = (item: RecentSearchItem) => {
    if (item.type === "track" && item.trackData) {
      if (currentTrack?.id === item.trackData.id) {
        toggle();
      } else {
        playTrackWithSmartQueue(item.trackData);
      }
      return;
    }
    router.push(item.targetUrl);
  };

  return (
    <section aria-labelledby="recent-searches" className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-searches" className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
          <History className="size-5 text-brand" />
          <span>Recent searches</span>
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="size-3.5" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
        {items.map((item) => {
          const isCurrentSong = item.type === "track" && currentTrack?.id === item.trackData?.id;
          const isSongPlaying = isCurrentSong && isPlaying;

          return (
            <RecentSearchCard
              key={item.id}
              item={item}
              isPlaying={isSongPlaying}
              isCurrent={isCurrentSong}
              onRemove={() => removeSearch(item.id)}
              onSelect={() => handleSelect(item)}
            />
          );
        })}
      </div>
    </section>
  );
}

function RecentSearchCard({
  item,
  isPlaying,
  isCurrent,
  onRemove,
  onSelect,
}: {
  item: RecentSearchItem;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const isArtist = item.type === "artist";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group relative flex flex-col items-center sm:items-start gap-3 rounded-2xl border border-white/5 bg-neutral-900/60 p-3 sm:p-4 text-left transition-all duration-200 hover:border-white/10 hover:bg-neutral-800/80 hover:shadow-xl hover:shadow-black/40 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {/* Remove button */}
      <button
        type="button"
        aria-label={`Remove ${item.title} from recent searches`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-20 grid size-6 sm:size-7 place-items-center rounded-full bg-black/70 text-zinc-400 backdrop-blur-md transition-all hover:bg-black hover:scale-105 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>

      {/* Visual representation */}
      <div className="relative">
        <Artwork
          src={item.image}
          round={isArtist}
          fallback={isArtist ? "artist" : "track"}
          className="size-24 sm:size-28 shadow-lg shadow-black/50 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Play overlay for tracks */}
        {item.type === "track" && (
          <div
            className={`absolute right-1 bottom-1 grid size-9 place-items-center rounded-full bg-brand text-black shadow-lg transition-all duration-200 ${
              isPlaying
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90 sm:group-hover:opacity-100 sm:group-hover:scale-100"
            }`}
          >
            {isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current translate-x-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full min-w-0">
        <span
          className={`block truncate text-sm font-semibold transition-colors ${
            isCurrent ? "text-brand" : "text-white group-hover:text-brand"
          }`}
        >
          {item.title}
        </span>
        <span className="block truncate text-xs text-zinc-400 mt-0.5">
          {item.subtitle}
        </span>
      </div>
    </div>
  );
}
