import { cn } from "@/lib/utils";

const CSS = `
@keyframes rz-eq { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
.rz-eq-bar { transform-origin: bottom; animation: rz-eq 900ms ease-in-out infinite; }
.rz-eq-bar:nth-child(2) { animation-duration: 700ms; animation-delay: -200ms; }
.rz-eq-bar:nth-child(3) { animation-duration: 1100ms; animation-delay: -450ms; }
.rz-eq[data-paused="true"] .rz-eq-bar { animation-play-state: paused; transform: scaleY(.35); }
@media (prefers-reduced-motion: reduce) { .rz-eq-bar { animation: none; transform: scaleY(.6); } }
`;

export function Equalizer({ playing = true, className }: { playing?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      data-paused={!playing}
      className={cn("rz-eq inline-flex h-3.5 w-3.5 items-end justify-between gap-px", className)}
    >
      <style href="rz-eq" precedence="default">
        {CSS}
      </style>
      <span className="rz-eq-bar h-full w-[3px] rounded-[1px] bg-current" />
      <span className="rz-eq-bar h-full w-[3px] rounded-[1px] bg-current" />
      <span className="rz-eq-bar h-full w-[3px] rounded-[1px] bg-current" />
    </span>
  );
}
