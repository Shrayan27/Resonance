"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Library, PanelLeftClose, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/stores/library";
import { CoverTile } from "./CoverTile";
import { useCreatePlaylistDialog, useShell } from "./shell-store";

type Filter = "all" | "playlists" | "saved";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "playlists", label: "Playlists" },
  { id: "saved", label: "Saved" },
];

interface RowProps {
  href: string;
  active: boolean;
  collapsed: boolean;
  title: string;
  subtitle: string;
  cover: React.ReactNode;
}

function LibraryRow({ href, active, collapsed, title, subtitle, cover }: RowProps) {
  return (
    <Link
      href={href}
      title={collapsed ? title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-hover/70",
        active && "bg-hover",
        collapsed && "justify-center",
      )}
    >
      {cover}
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", active ? "text-brand" : "text-white")}>{title}</span>
          <span className="flex items-center gap-1 truncate text-[13px] text-subtle">{subtitle}</span>
        </span>
      )}
    </Link>
  );
}

function RenameDialog({ id, initial, onClose }: { id: string | null; initial: string; onClose: () => void }) {
  const rename = useLibrary((s) => s.renamePlaylist);
  const [name, setName] = useState(initial);
  return (
    <Dialog open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (id && name.trim()) rename(id, name.trim());
            onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">Rename playlist</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            maxLength={80}
            aria-label="Playlist name"
            className="h-10"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="font-semibold">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const storedCollapsed = useShell((s) => s.sidebarCollapsed);
  const toggle = useShell((s) => s.toggleSidebar);
  const showCreate = useCreatePlaylistDialog((s) => s.show);
  const liked = useLibrary((s) => s.liked);
  const playlists = useLibrary((s) => s.playlists);
  const saved = useLibrary((s) => s.savedCollections);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const [filter, setFilter] = useState<Filter>("all");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const collapsed = hydrated && storedCollapsed;
  const showLiked = filter !== "saved";
  const showPlaylists = filter !== "saved";
  const showSaved = filter !== "playlists";
  const empty = hydrated && playlists.length === 0 && saved.length === 0 && liked.length === 0;

  return (
    <aside
      aria-label="Your Library"
      className={cn(
        "hidden min-h-0 shrink-0 flex-col overflow-hidden rounded-lg bg-panel transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-[240px] lg:w-[280px] xl:w-[300px]",
      )}
    >
      <div className={cn("flex items-center gap-1 p-3 pb-2", collapsed ? "flex-col" : "justify-between pl-4")}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand Your Library" : "Collapse Your Library"}
          title={collapsed ? "Expand Your Library" : "Collapse Your Library"}
          className={cn(
            "flex items-center gap-2.5 rounded-md font-semibold text-subtle transition-colors hover:text-white",
            collapsed && "size-12 justify-center",
          )}
        >
          {collapsed ? <Library className="size-6" /> : <PanelLeftClose className="size-5" />}
          {!collapsed && <span className="text-[15px]">Your Library</span>}
        </button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Create playlist"
          title="Create playlist"
          onClick={() => showCreate()}
          className="rounded-full text-subtle hover:bg-hover hover:text-white"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {!collapsed && (
        <div className="flex gap-2 px-4 pb-2" role="group" aria-label="Filter library">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f.id ? "bg-white text-black" : "bg-elevated text-white hover:bg-hover",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {showLiked && (
          <LibraryRow
            href="/library/liked"
            active={pathname === "/library/liked"}
            collapsed={collapsed}
            title="Liked Songs"
            subtitle={hydrated ? `Playlist · ${liked.length} ${liked.length === 1 ? "song" : "songs"}` : "Playlist"}
            cover={<CoverTile kind="liked" />}
          />
        )}

        {hydrated && showPlaylists &&
          playlists.map((p) => {
            const href = `/library/playlist/${p.id}`;
            return (
              <ContextMenu key={p.id}>
                <ContextMenuTrigger render={<div />}>
                  <LibraryRow
                    href={href}
                    active={pathname === href}
                    collapsed={collapsed}
                    title={p.name}
                    subtitle={`Playlist · ${p.tracks.length} ${p.tracks.length === 1 ? "song" : "songs"}`}
                    cover={<CoverTile src={p.tracks[0]?.artwork} images={p.tracks.map((t) => t.artwork)} />}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setRenaming({ id: p.id, name: p.name })}>Rename</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => {
                      deletePlaylist(p.id);
                      if (pathname === href) router.push("/");
                    }}
                  >
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

        {hydrated && showSaved &&
          saved.map((c) => {
            const href = `/playlist/${c.id}`;
            return (
              <LibraryRow
                key={c.id}
                href={href}
                active={pathname === href}
                collapsed={collapsed}
                title={c.title}
                subtitle={`${c.kind === "album" ? "Album" : "Playlist"} · ${c.owner.name}`}
                cover={<CoverTile src={c.artwork} />}
              />
            );
          })}

        {hydrated && filter === "playlists" && playlists.length === 0 && !collapsed && (
          <p className="px-3 py-6 text-center text-sm text-subtle">No playlists yet.</p>
        )}
        {hydrated && filter === "saved" && saved.length === 0 && !collapsed && (
          <p className="px-3 py-6 text-center text-sm text-subtle">Nothing saved yet. Save a playlist or album to see it here.</p>
        )}

        {empty && !collapsed && filter === "all" && (
          <div className="mt-3 rounded-lg bg-elevated p-4">
            <p className="font-semibold text-white">Create your first playlist</p>
            <p className="mt-1 text-sm text-subtle">It&apos;s easy, we&apos;ll help you.</p>
            <Button onClick={() => showCreate()} className="mt-4 rounded-full px-4 font-semibold" size="lg">
              Create playlist
            </Button>
          </div>
        )}
      </nav>

      <RenameDialog
        key={renaming?.id ?? "none"}
        id={renaming?.id ?? null}
        initial={renaming?.name ?? ""}
        onClose={() => setRenaming(null)}
      />
    </aside>
  );
}
