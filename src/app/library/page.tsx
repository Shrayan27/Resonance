"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { CoverTile } from "@/components/shell/CoverTile";
import { useCreatePlaylistDialog } from "@/components/shell/shell-store";
import { useHydrated } from "@/lib/use-hydrated";
import { useLibrary } from "@/stores/library";

function Card({ href, title, subtitle, cover }: { href: string; title: string; subtitle: string; cover: React.ReactNode }) {
  return (
    <Link href={href} className="group rounded-lg bg-elevated/50 p-3 transition-colors hover:bg-elevated">
      <div className="[&>*]:aspect-square [&>*]:size-full [&>*]:rounded-md [&_svg]:size-1/4">{cover}</div>
      <p className="mt-3 truncate text-sm font-semibold text-white">{title}</p>
      <p className="truncate text-[13px] text-subtle">{subtitle}</p>
    </Link>
  );
}

export default function LibraryPage() {
  const hydrated = useHydrated();
  const liked = useLibrary((s) => s.liked);
  const playlists = useLibrary((s) => s.playlists);
  const saved = useLibrary((s) => s.savedCollections);
  const show = useCreatePlaylistDialog((s) => s.show);

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Your Library</h1>
        <button
          type="button"
          onClick={() => show()}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
        >
          <Plus className="size-4" /> New playlist
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <Card
          href="/library/liked"
          title="Liked Songs"
          subtitle={hydrated ? `Playlist · ${liked.length} ${liked.length === 1 ? "song" : "songs"}` : "Playlist"}
          cover={<CoverTile kind="liked" />}
        />
        {hydrated &&
          playlists.map((p) => (
            <Card
              key={p.id}
              href={`/library/playlist/${p.id}`}
              title={p.name}
              subtitle={`Playlist · ${p.tracks.length} ${p.tracks.length === 1 ? "song" : "songs"}`}
              cover={<CoverTile src={p.tracks[0]?.artworkLarge || p.tracks[0]?.artwork} />}
            />
          ))}
        {hydrated &&
          saved.map((c) => (
            <Card
              key={c.id}
              href={`/playlist/${c.id}`}
              title={c.title}
              subtitle={`${c.kind === "album" ? "Album" : "Playlist"} · ${c.owner.name}`}
              cover={<CoverTile src={c.artworkLarge || c.artwork} />}
            />
          ))}
      </div>

      {hydrated && playlists.length === 0 && saved.length === 0 && (
        <div className="mt-8 rounded-lg bg-elevated p-5">
          <p className="font-semibold text-white">Create your first playlist</p>
          <p className="mt-1 text-sm text-subtle">Save songs you love and find them here anytime.</p>
        </div>
      )}
    </div>
  );
}
