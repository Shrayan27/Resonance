"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setName(""), 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pl = createPlaylist(name.trim() || `My Playlist #${count + 1}`, track);
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
