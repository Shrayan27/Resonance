"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const subscribe = () => () => {};

/** True after hydration; guards persisted (localStorage) state against SSR mismatches. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Equalizer({ active, className }: { active: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex h-3.5 items-end gap-[2px] ${className ?? ""}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-brand"
          style={{
            height: active ? undefined : "35%",
            animation: active ? `resonance-eq 0.9s ease-in-out ${i * 0.18}s infinite alternate` : undefined,
          }}
        />
      ))}
      <style>{`@keyframes resonance-eq{from{height:20%}to{height:100%}}`}</style>
    </span>
  );
}
