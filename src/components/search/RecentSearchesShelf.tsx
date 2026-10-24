"use client";

import { useRouter } from "next/navigation";
import { History, Search, Trash2, X } from "lucide-react";
import { Artwork } from "@/components/media/Artwork";
import { useHydrated } from "@/lib/use-hydrated";
import { useRecentSearches, type RecentSearchItem } from "@/stores/recent-searches";

export function RecentSearchesShelf() {
  const hydrated = useHydrated();
  const items = useRecentSearches((s) => s.items);
  const removeSearch = useRecentSearches((s) => s.removeSearch);
  const clearAll = useRecentSearches((s) => s.clearAll);
  const router = useRouter();

  if (!hydrated || !items || items.length === 0) {
    return null;
  }

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
        {items.map((item) => (
          <RecentSearchCard
            key={item.id}
            item={item}
            onRemove={() => removeSearch(item.id)}
            onSelect={() => router.push(item.targetUrl)}
          />
        ))}
      </div>
    </section>
  );
}

function RecentSearchCard({
  item,
  onRemove,
  onSelect,
}: {
  item: RecentSearchItem;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const isArtist = item.type === "artist";
  const isQuery = item.type === "query";

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
      {isQuery ? (
        <div className="grid size-20 sm:size-24 place-items-center rounded-2xl border border-white/10 bg-white/5 text-brand shadow-inner transition-transform group-hover:scale-105 group-hover:bg-brand/10">
          <Search className="size-8" />
        </div>
      ) : (
        <Artwork
          src={item.image}
          round={isArtist}
          fallback={isArtist ? "artist" : "track"}
          className="size-20 sm:size-24 shadow-md transition-transform group-hover:scale-105"
        />
      )}

      {/* Content */}
      <div className="w-full min-w-0">
        <span className="block truncate text-sm font-semibold text-white transition-colors group-hover:text-brand">
          {item.title}
        </span>
        <span className="block truncate text-xs text-zinc-400 capitalize mt-0.5">
          {item.subtitle || item.type}
        </span>
      </div>
    </div>
  );
}
