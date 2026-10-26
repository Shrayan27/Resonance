"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  url?: string;
  label?: string;
  className?: string;
}

export function ShareButton({ title, url, label = "Share", className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (!shareUrl) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out "${title}" on Resonance!`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or aborted native share, fallback to copy
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleShare}
      aria-label={copied ? "Link copied" : `Share ${title}`}
      className={cn(
        "h-10 gap-2 rounded-full px-4 text-muted-foreground transition-all duration-200 hover:text-foreground",
        copied && "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4 animate-in zoom-in-75 duration-150" />
          <span className="text-sm font-medium">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </Button>
  );
}
