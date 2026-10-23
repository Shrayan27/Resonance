"use client";

import { Suspense, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { TasteProfileModal } from "@/components/auth/TasteProfileModal";
import { AudioEngine } from "@/components/player/AudioEngine";
import { PlayerBar } from "@/components/player/PlayerBar";
import { RightPanel } from "@/components/player/RightPanel";
import { useAuth } from "@/stores/auth";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuth((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div
      className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 pb-[calc(var(--player-h)+3.5rem+env(safe-area-inset-bottom,0px))] [--player-h:66px] md:[--player-h:88px] md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] md:pb-[calc(var(--player-h)+env(safe-area-inset-bottom,0px))]"
    >
      <TopBar className="col-span-full" />
      <Suspense fallback={<aside aria-hidden className="hidden w-[240px] lg:w-[280px] xl:w-[300px] rounded-lg bg-panel md:block" />}>
        <Sidebar />
      </Suspense>
      <main
        id="main-scroll"
        className="col-start-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-lg bg-panel md:col-start-2"
      >
        {children}
      </main>
      <RightPanel />
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <PlayerBar />
      <AudioEngine />
      <CreatePlaylistDialog />
      <AuthModal />
      <TasteProfileModal />
    </div>
  );
}
