"use client";

import { Suspense } from "react";
import { AudioEngine } from "@/components/player/AudioEngine";
import { PlayerBar } from "@/components/player/PlayerBar";
import { RightPanel } from "@/components/player/RightPanel";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 pb-[calc(var(--player-h)+3.5rem)] [--player-h:66px] md:[--player-h:88px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:pb-(--player-h)"
    >
      <TopBar className="col-span-full" />
      <Suspense fallback={<aside aria-hidden className="hidden w-[300px] rounded-lg bg-panel md:block" />}>
        <Sidebar />
      </Suspense>
      <main
        id="main-scroll"
        className="col-start-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-lg bg-panel md:col-start-2"
      >
        {children}
      </main>
      <div className="hidden min-h-0 md:block md:empty:hidden">
        <RightPanel />
      </div>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <PlayerBar />
      <AudioEngine />
      <CreatePlaylistDialog />
    </div>
  );
}
