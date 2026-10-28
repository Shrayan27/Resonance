"use client";

import { useEffect } from "react";
import { usePlayer, EQ_PRESETS, type EqPreset } from "@/stores/player";
import { Slider } from "@/components/ui/slider";
import {
  X,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Zap,
  Volume2,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { cn } from "cn";

export function EqualizerModal() {
  const show = usePlayer((s) => s.showEqModal);
  const setShow = usePlayer((s) => s.setShowEqModal);
  const eqPreset = usePlayer((s) => s.eqPreset);
  const customEq = usePlayer((s) => s.customEq);
  const setEqPreset = usePlayer((s) => s.setEqPreset);
  const setCustomEq = usePlayer((s) => s.setCustomEq);
  const volume = usePlayer((s) => s.volume);
  const setVolume = usePlayer((s) => s.setVolume);

  // Close on Escape key
  useEffect(() => {
    if (!show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, setShow]);

  if (!show) return null;

  const currentVolumePercent = Math.round(volume * 100);
  const isBoosted = currentVolumePercent > 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="eq-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => setShow(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-linear-to-b from-[#16181d] via-[#0f1115] to-[#0a0b0d] p-6 shadow-2xl text-white z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/30">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 id="eq-title" className="text-lg font-bold text-white tracking-tight">
                Resonance Sound Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Volume amplification & acoustic equalization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEqPreset("flat");
                setVolume(1.0, true);
              }}
              title="Reset all sound enhancements"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="grid size-9 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pt-5 pr-1 -mr-1">
          {/* Mobile Guidance Banner */}
          <div className="sm:hidden rounded-2xl bg-brand/10 border border-brand/20 p-3 text-xs text-zinc-300 flex items-start gap-2.5">
            <Smartphone className="size-4.5 shrink-0 text-brand mt-0.5" />
            <span className="leading-relaxed">
              <strong>Mobile Listening Tip:</strong> Use your phone's hardware volume rocker for overall loudness. Use the presets and preamp booster below to enrich bass, clarity, and quiet tracks.
            </span>
          </div>

          {/* Section 1: Sound Booster & Limiter */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "grid size-7 place-items-center rounded-lg transition-colors",
                    isBoosted ? "bg-amber-500/20 text-amber-400" : "bg-brand/20 text-brand",
                  )}
                >
                  {isBoosted ? <Zap className="size-4" /> : <Volume2 className="size-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Loudness & Volume Booster</h3>
                  <p className="text-[11px] text-zinc-400">
                    Boost quiet songs up to 200% with hardware-safe limiter
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-lg font-black tracking-tight",
                    isBoosted ? "text-amber-400" : "text-brand",
                  )}
                >
                  {currentVolumePercent}%
                </span>
                {isBoosted && (
                  <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-300 ring-1 ring-amber-400/40">
                    BOOST
                  </span>
                )}
              </div>
            </div>

            {/* Volume slider */}
            <div className="py-2">
              <Slider
                aria-label="Master Volume & Boost"
                min={0}
                max={2.0}
                step={0.01}
                value={[volume]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : (v as number);
                  setVolume(val, true);
                }}
                className={cn(
                  "w-full cursor-pointer",
                  isBoosted && "[&_[data-slot=slider-range]]:bg-linear-to-r [&_[data-slot=slider-range]]:from-brand [&_[data-slot=slider-range]]:to-amber-400",
                )}
              />
              <div className="mt-2 flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>0% (Silent)</span>
                <span className="text-zinc-300 font-semibold">100% (Studio Level)</span>
                <span className="text-amber-400 font-bold">200% (Max Boost)</span>
              </div>
            </div>

            {/* Quick boost shortcuts */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "100% Normal", val: 1.0 },
                { label: "125% Boost", val: 1.25 },
                { label: "150% Boost", val: 1.5 },
                { label: "200% Max Boost", val: 2.0 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() => setVolume(btn.val, true)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                    Math.abs(volume - btn.val) < 0.03
                      ? "bg-white text-black shadow-md scale-105"
                      : "bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Anti-clipping limiter badge */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] text-emerald-300">
              <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Smart Anti-Clipping Limiter active:</strong> Audio peaks are compressed smoothly to prevent distortion or speaker buzz.
              </span>
            </div>
          </div>

          {/* Section 2: Equalizer Presets */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="size-4 text-brand" />
                <span>Audio Presets</span>
              </h3>
              <span className="text-[11px] text-zinc-400">
                Optimized frequency profiles
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(EQ_PRESETS) as EqPreset[]).map((key) => {
                const item = EQ_PRESETS[key];
                const active = eqPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEqPreset(key)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-2xl text-left border transition-all",
                      active
                        ? "bg-brand/15 border-brand ring-1 ring-brand/50 shadow-lg shadow-brand/10 text-white"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-zinc-300",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold truncate">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: 3-Band Equalizer Fine Tuning */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Manual 3-Band Frequency Tuning</h3>
                <p className="text-[11px] text-zinc-400">
                  Precision adjust low-end punch, vocal presence, and brilliance
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Bass Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span>Bass / Sub-Low (120 Hz)</span>
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      customEq.bass > 0 ? "text-emerald-400" : customEq.bass < 0 ? "text-rose-400" : "text-zinc-400",
                    )}
                  >
                    {customEq.bass > 0 ? `+${customEq.bass}` : customEq.bass} dB
                  </span>
                </div>
                <Slider
                  aria-label="Bass"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[customEq.bass]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : (v as number);
                    setCustomEq({ bass: val });
                  }}
                  className="w-full"
                />
              </div>

              {/* Mid / Vocal Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="size-2 rounded-full bg-cyan-400" />
                    <span>Mids / Vocals (1.5 kHz)</span>
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      customEq.mid > 0 ? "text-cyan-400" : customEq.mid < 0 ? "text-rose-400" : "text-zinc-400",
                    )}
                  >
                    {customEq.mid > 0 ? `+${customEq.mid}` : customEq.mid} dB
                  </span>
                </div>
                <Slider
                  aria-label="Mid / Vocals"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[customEq.mid]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : (v as number);
                    setCustomEq({ mid: val });
                  }}
                  className="w-full"
                />
              </div>

              {/* Treble Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="size-2 rounded-full bg-purple-400" />
                    <span>Treble / Air (5.0 kHz)</span>
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      customEq.treble > 0 ? "text-purple-400" : customEq.treble < 0 ? "text-rose-400" : "text-zinc-400",
                    )}
                  >
                    {customEq.treble > 0 ? `+${customEq.treble}` : customEq.treble} dB
                  </span>
                </div>
                <Slider
                  aria-label="Treble"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[customEq.treble]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : (v as number);
                    setCustomEq({ treble: val });
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Active Preset: <strong className="text-white">{EQ_PRESETS[eqPreset]?.name || "Custom"}</strong></span>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
