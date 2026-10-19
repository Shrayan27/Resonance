"use client";

import { isValidElement } from "react";
import { Check, ListPlus, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from "@/lib/use-hydrated";
import type { Track } from "@/lib/types";
import { useLibrary } from "@/stores/library";
import { useCreatePlaylistDialog } from "./shell-store";

export function AddToPlaylistMenu({ track, children }: { track: Track; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);
  const showCreate = useCreatePlaylistDialog((s) => s.show);

  const trigger = (
    <DropdownMenuTrigger
      render={isValidElement(children) ? children : <button type="button">{children}</button>}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-64"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem className="gap-2 py-2" onClick={() => showCreate(track)}>
          <Plus /> New playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hydrated && playlists.length === 0 && (
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
            <ListPlus className="size-4" /> No playlists yet
          </div>
        )}
        {hydrated &&
          playlists.map((p) => {
            const has = p.trackIds.includes(track.id);
            return (
              <DropdownMenuItem
                key={p.id}
                className="gap-2 py-2"
                onClick={() => (has ? removeFromPlaylist(p.id, track.id) : addToPlaylist(p.id, track))}
              >
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {has && <Check className="size-4 text-brand" />}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
