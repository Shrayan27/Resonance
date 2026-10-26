"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/stores/library";
import { useCreatePlaylistDialog } from "./shell-store";

export { useCreatePlaylistDialog };

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Controlled when `open`/`onOpenChange` are given; otherwise driven by the global
 * `useCreatePlaylistDialog()` store (`.getState().show(track?)`), which AppShell mounts once.
 */
export function CreatePlaylistDialog({ open, onOpenChange }: Props = {}) {
  const store = useCreatePlaylistDialog();
  const isOpen = open ?? store.open;
  const setOpen = onOpenChange ?? store.setOpen;
  const track = open === undefined ? store.track : undefined;

  const router = useRouter();
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const count = useLibrary((s) => s.playlists.length);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setName("");
      setIsPublic(true);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pl = createPlaylist(name.trim() || `My Playlist #${count + 1}`, track, isPublic);
    setOpen(false);
    router.push(`/library/playlist/${pl.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg">Create playlist</DialogTitle>
            <DialogDescription>
              {track ? `Starts with "${track.title}".` : "Give your playlist a name. You can add songs afterwards."}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`My Playlist #${count + 1}`}
            maxLength={80}
            aria-label="Playlist name"
            className="h-10"
          />

          {/* Privacy Switch */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm">
            <div className="space-y-0.5">
              <span className="font-medium text-white flex items-center gap-1.5">
                {isPublic ? <Globe className="size-4 text-brand" /> : <Lock className="size-4 text-zinc-400" />}
                {isPublic ? "Public Playlist" : "Private Playlist"}
              </span>
              <p className="text-xs text-zinc-400">
                {isPublic ? "Visible in search & community feed" : "Only visible to you in your library"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isPublic ? "bg-brand" : "bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-semibold">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
