"use client";

import { useEffect, useState } from "react";
import { Check, Flame, Music2, Sparkles, TrendingUp, User, X } from "lucide-react";
import { useAuth, type UserAccountSafe } from "@/stores/auth";
import { cn } from "@/lib/utils";

const AVAILABLE_GENRES = [
  "punjabi",
  "hindi bollywood",
  "indie & lo-fi",
  "hip-hop",
  "sufi & acoustic",
  "english pop",
  "rock",
  "edm & dance",
];

function TasteProfileInner({ user }: { user: UserAccountSafe }) {
  const close = useAuth((s) => s.closeTasteModal);
  const updateTaste = useAuth((s) => s.updateTaste);

  const [genres, setGenres] = useState<string[]>(user.taste?.preferredGenres || []);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const taste = user.taste;
  const genreEntries = Object.entries(taste.genreWeights || {}).sort((a, b) => b[1] - a[1]);
  const artistEntries = Object.entries(taste.artistWeights || {}).sort((a, b) => b[1] - a[1]);
  const totalWeight = genreEntries.reduce((sum, [, w]) => sum + w, 0) || 1;

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateTaste(genres);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close dialog"
          className="absolute top-5 right-5 grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div
            className={cn(
              "grid size-14 shrink-0 place-items-center rounded-2xl bg-linear-to-tr text-xl font-black text-black shadow-lg",
              user.avatarColor || "from-brand to-emerald-400",
            )}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-white">{user.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                <Sparkles className="size-3" /> Music DNA
              </span>
            </div>
            <p className="truncate text-xs text-zinc-400">{user.email}</p>
            <p className="mt-1 text-xs text-zinc-400">
              <span className="font-semibold text-white">{taste.totalPlays}</span> tracks played & learned
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Learned Listening Distribution */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <TrendingUp className="size-4 text-brand" /> Learned Taste Breakdown
              </h3>
              <span className="text-[11px] text-zinc-400">Updates live as you listen</span>
            </div>

            {genreEntries.length > 0 ? (
              <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/5 p-4">
                {genreEntries.slice(0, 5).map(([genreName, weight]) => {
                  const pct = Math.round((weight / totalWeight) * 100);
                  return (
                    <div key={genreName} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-zinc-200">{genreName}</span>
                        <span className="text-brand font-semibold">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-brand to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-xs text-zinc-400">
                Play a few tracks and Resonance will automatically build your listening graph here!
              </div>
            )}
          </section>

          {/* Top Artists Discovered */}
          {artistEntries.length > 0 && (
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-white">
                <Flame className="size-4 text-amber-400" /> Your Top Artists
              </h3>
              <div className="flex flex-wrap gap-2">
                {artistEntries.slice(0, 8).map(([artistName, count]) => (
                  <span
                    key={artistName}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-zinc-300"
                  >
                    <User className="size-3 text-brand" />
                    {artistName}
                    <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-400">
                      {count}x
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Preferred Genres Customizer */}
          <section className="border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Music2 className="size-4 text-purple-400" /> Tune Your Preferred Genres
              </h3>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-xs text-brand animate-in fade-in">
                  <Check className="size-3" /> Saved!
                </span>
              )}
            </div>
            <p className="mb-3 text-xs text-zinc-400">
              Selected genres are directly infused into your autoplay queue and recommendations.
            </p>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((g) => {
                const selected = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all outline-none",
                      selected
                        ? "border-brand bg-brand/20 text-white ring-1 ring-brand/60"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {selected && <Check className="size-3 text-brand" />}
                    {g}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TasteProfileModal() {
  const isOpen = useAuth((s) => s.isTasteModalOpen);
  const user = useAuth((s) => s.user);

  if (!isOpen || !user) return null;

  return <TasteProfileInner key={user.taste?.lastUpdated || user.id} user={user} />;
}
