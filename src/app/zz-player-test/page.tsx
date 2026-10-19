"use client";
import { useEffect } from "react";
import { AudioEngine } from "@/components/player/AudioEngine";
import { PlayerBar } from "@/components/player/PlayerBar";
import { RightPanel } from "@/components/player/RightPanel";
import { usePlayer } from "@/stores/player";
import type { HomeFeed } from "@/lib/types";

export default function Page() {
  useEffect(() => {
    fetch("/api/catalog/home").then((r) => r.json()).then((h: HomeFeed) => {
      usePlayer.setState({ queue: h.trending.slice(0, 6), index: 1, panel: new URLSearchParams(location.search).get("panel") === "now" ? "nowPlaying" : "queue", duration: 200, position: 60 });
    });
  }, []);
  return (
    <div className="dark flex h-screen bg-black p-3 pb-[100px] text-white">
      <div className="flex-1">test</div>
      <RightPanel />
      <AudioEngine />
      <PlayerBar />
    </div>
  );
}
