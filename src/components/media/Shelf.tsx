"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ShelfProps {
  title: string;
  href?: string;
  children: ReactNode;
  className?: string;
}

const itemSizing =
  "[&>*]:w-[148px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[170px] lg:[&>*]:w-[184px]";

export function Shelf({ title, href, children, className }: ShelfProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const heading = `shelf-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={heading} className={cn("group/shelf relative", className)}>
      <div className="mb-2 flex items-end justify-between gap-4 px-1">
        <h2 id={heading} className="truncate text-xl font-bold tracking-tight sm:text-2xl">
          {href ? (
            <Link href={href} className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded-sm text-sm font-semibold text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={measure}
          className={cn(
            "-mx-1 flex snap-x snap-mandatory scroll-px-1 gap-1 overflow-x-auto overscroll-x-contain px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            itemSizing,
          )}
        >
          {children}
        </div>
        {(["left", "right"] as const).map((side) => {
          const visible = edges[side];
          const Icon = side === "left" ? ChevronLeft : ChevronRight;
          return (
            <button
              key={side}
              type="button"
              tabIndex={visible ? 0 : -1}
              aria-hidden={!visible}
              aria-label={side === "left" ? `Scroll ${title} left` : `Scroll ${title} right`}
              onClick={() => scrollBy(side === "left" ? -1 : 1)}
              className={cn(
                "absolute top-[38%] z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-neutral-900/90 text-foreground shadow-lg ring-1 ring-white/10 backdrop-blur transition-opacity outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-ring md:grid",
                side === "left" ? "-left-3" : "-right-3",
                visible
                  ? "pointer-events-none opacity-0 group-focus-within/shelf:pointer-events-auto group-focus-within/shelf:opacity-100 group-hover/shelf:pointer-events-auto group-hover/shelf:opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <Icon className="size-5" aria-hidden />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CardSkeleton({ round, className }: { round?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg p-3", className)} aria-hidden>
      <Skeleton className={cn("aspect-square w-full bg-neutral-800", round ? "rounded-full" : "rounded-md")} />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-3/4 bg-neutral-800" />
        <Skeleton className="h-3 w-1/2 bg-neutral-800" />
      </div>
    </div>
  );
}

export function ShelfSkeleton({ count = 8, round }: { count?: number; round?: boolean }) {
  return (
    <section aria-busy="true" aria-label="Loading" className="relative">
      <div className="mb-2 px-1">
        <Skeleton className="h-7 w-48 bg-neutral-800" />
      </div>
      <div className={cn("-mx-1 flex gap-1 overflow-hidden px-1 pb-2", itemSizing)}>
        {Array.from({ length: count }, (_, i) => (
          <CardSkeleton key={i} round={round} />
        ))}
      </div>
    </section>
  );
}
