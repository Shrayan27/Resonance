"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}
    >
      <div className="grid size-14 place-items-center rounded-full bg-neutral-800 text-muted-foreground">
        <WifiOff className="size-6" aria-hidden />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="lg" className="mt-2 h-10 gap-2 rounded-full px-5">
          <RefreshCw aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <div className="grid size-14 place-items-center rounded-full bg-neutral-800 text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      {children}
    </div>
  );
}
