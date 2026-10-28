"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer, EQ_PRESETS } from "@/stores/player";
import { Volume1, Volume2, VolumeX, Zap } from "lucide-react";
import { cn } from "cn";

export function VolumeHud() {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const volumeHudNonce = usePlayer((s) => s.volumeHudNonce);
  const eqPreset = usePlayer((s) => s.eqPreset);

  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid showing HUD on initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 1400);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [volumeHudNonce, volume, muted]);

  const effective = muted ? 0 : volume;
  const percent = Math.round(effective * 100);
  const isBoosted = percent > 100;

  // Icon selection
  let Icon = Volume2;
  if (effective === 0) Icon = VolumeX;
  else if (isBoosted) Icon = Zap;
  else if (effective < 0.5) Icon = Volume1;

  const presetInfo = EQ_PRESETS[eqPreset] || EQ_PRESETS.flat;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "pointer-events-none fixed top-6 left-1/2 z-[80] -translate-x-1/2 transition-all duration-300 ease-out",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-3 scale-95 pointer-events-none",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl border transition-colors",
          isBoosted
            ? "bg-[#120e06]/90 border-amber-500/40 shadow-amber-500/10 text-amber-100"
            : "bg-[#0c0d10]/90 border-white/15 shadow-black/60 text-white",
        )}
      >
        <div
          className={cn(
            "grid size-9 place-items-center rounded-xl transition-colors",
            isBoosted ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-brand",
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="flex flex-col gap-1 min-w-[170px]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm">
                {muted ? "Muted" : `${percent}%`}
              </span>
              {isBoosted && !muted && (
                <span className="flex items-center gap-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-black tracking-wider shadow-xs">
                  <Zap className="size-2.5 fill-current" />
                  BOOST
                </span>
              )}
            </div>

            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[110px]">
              {presetInfo.name}
            </span>
          </div>

          {/* Progress Bar (0% to 200%) */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            {/* 100% threshold marker line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 z-10" />

            <div
              className={cn(
                "h-full transition-all duration-100 rounded-full",
                isBoosted
                  ? "bg-linear-to-r from-brand via-amber-400 to-orange-500 shadow-sm shadow-amber-400/50"
                  : "bg-linear-to-r from-brand to-emerald-400",
              )}
              style={{
                width: `${Math.min(100, Math.max(0, (effective / 2.0) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
