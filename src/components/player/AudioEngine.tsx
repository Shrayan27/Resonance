"use client";

import { useEffect, useRef } from "react";
import { selectCurrentTrack, usePlayer } from "@/stores/player";

const SEEK_STEP = 5;
const VOLUME_STEP = 0.05;

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(
    'button, a[href], summary, [role="button"], [role="slider"], [role="menuitem"], [role="option"], [role="dialog"], [role="menu"]',
  );
}

function tryPlay(audio: HTMLAudioElement) {
  const result = audio.play();
  if (!result) return;
  result.catch((err: unknown) => {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "AbortError") return;
    if (name === "NotSupportedError") return;
    usePlayer.getState().pause();
  });
}

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const lastProgressAt = useRef(0);
  const errorStreak = useRef(0);

  const track = usePlayer(selectCurrentTrack);
  const trackId = track?.id ?? null;
  const streamUrl = track?.streamUrl ?? null;
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekRequest = usePlayer((s) => s.seekRequest);
  const error = usePlayer((s) => s.error);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    pendingSeek.current = null;
    if (!streamUrl) {
      audio.removeAttribute("src");
      audio.load();
      usePlayer.getState().setBuffering(false);
      return;
    }
    audio.src = streamUrl;
    audio.load();
    usePlayer.getState().setBuffering(true);
    if (usePlayer.getState().isPlaying) tryPlay(audio);
  }, [streamUrl, trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;
    if (isPlaying) tryPlay(audio);
    else audio.pause();
  }, [isPlaying, streamUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !seekRequest) return;
    const to = Math.max(0, seekRequest.to);
    if (audio.readyState >= 1) {
      audio.currentTime = to;
    } else {
      pendingSeek.current = to;
    }
  }, [seekRequest]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const store = usePlayer;

    const reportProgress = (force = false) => {
      const now = performance.now();
      if (!force && now - lastProgressAt.current < 200) return;
      lastProgressAt.current = now;
      const current = selectCurrentTrack(store.getState());
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (current?.durationSec ?? 0);
      store.getState().setProgress(audio.currentTime, duration);
    };

    const onTimeUpdate = () => reportProgress();
    const onLoadedMetadata = () => {
      if (pendingSeek.current !== null) {
        audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
      reportProgress(true);
    };
    const onDurationChange = () => reportProgress(true);
    const onWaiting = () => store.getState().setBuffering(true);
    const onPlaying = () => {
      errorStreak.current = 0;
      const s = store.getState();
      s.setBuffering(false);
      if (s.error) s.setError(null);
    };
    const onCanPlay = () => store.getState().setBuffering(false);
    const onSeeked = () => reportProgress(true);
    const onPause = () => {
      if (audio.paused && !audio.ended && !audio.seeking && store.getState().isPlaying) {
        store.getState().pause();
      }
    };

    const onEnded = () => {
      const s = store.getState();
      if (s.repeat === "one") {
        audio.currentTime = 0;
        tryPlay(audio);
        return;
      }
      const before = s.index;
      s.next();
      const after = store.getState();
      if (after.index === before && after.isPlaying) {
        audio.currentTime = 0;
        tryPlay(audio);
      }
    };

    const onError = () => {
      if (!audio.getAttribute("src")) return;
      const s = store.getState();
      const current = selectCurrentTrack(s);
      if (!current) return;
      errorStreak.current += 1;
      s.setBuffering(false);
      s.setError(`Couldn't play "${current.title}". Skipping to the next track.`);
      if (errorStreak.current >= Math.max(1, s.queue.length)) {
        errorStreak.current = 0;
        s.pause();
        s.setError(`Couldn't play "${current.title}". Playback stopped.`);
        return;
      }
      const before = s.index;
      s.next();
      const after = store.getState();
      if (after.index === before) {
        s.pause();
        s.setError(`Couldn't play "${current.title}".`);
      } else {
        s.setError(`Couldn't play "${current.title}". Skipped to the next track.`);
      }
    };

    const events: [string, () => void][] = [
      ["timeupdate", onTimeUpdate],
      ["loadedmetadata", onLoadedMetadata],
      ["durationchange", onDurationChange],
      ["waiting", onWaiting],
      ["stalled", onWaiting],
      ["playing", onPlaying],
      ["canplay", onCanPlay],
      ["seeked", onSeeked],
      ["pause", onPause],
      ["ended", onEnded],
      ["error", onError],
    ];
    for (const [name, fn] of events) audio.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of events) audio.removeEventListener(name, fn);
    };
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => {
      if (usePlayer.getState().error === error) usePlayer.getState().setError(null);
    }, 6000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const artwork = [track.artwork, track.artworkLarge]
      .filter(Boolean)
      .map((src, i) => ({ src, sizes: i === 0 ? "150x150" : "480x480" }));
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist.name,
      album: track.album ?? "",
      artwork,
    });
  }, [track]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = track ? (isPlaying ? "playing" : "paused") : "none";
  }, [isPlaying, track]);

  const duration = usePlayer((s) => s.duration);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!track || !Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(usePlayer.getState().position, duration),
        playbackRate: 1,
      });
    } catch {
      // Some browsers reject inconsistent position state; it is purely informational.
    }
  }, [track, duration, seekRequest]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const s = () => usePlayer.getState();
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Unsupported action in this browser.
      }
    };
    set("play", () => s().play());
    set("pause", () => s().pause());
    set("previoustrack", () => s().previous());
    set("nexttrack", () => s().next());
    set("seekbackward", (d) => s().seek(Math.max(0, s().position - (d.seekOffset ?? SEEK_STEP))));
    set("seekforward", (d) => s().seek(Math.min(s().duration || Infinity, s().position + (d.seekOffset ?? SEEK_STEP))));
    set("seekto", (d) => {
      if (typeof d.seekTime === "number") s().seek(d.seekTime);
    });
    return () => {
      for (const a of ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"] as const) {
        set(a, null);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditable(e.target)) return;
      const s = usePlayer.getState();
      const hasTrack = s.index >= 0;

      switch (e.key) {
        case " ":
        case "Spacebar":
          if (isInteractive(e.target)) return;
          e.preventDefault();
          s.toggle();
          return;
        case "ArrowRight":
        case "ArrowLeft": {
          if (e.shiftKey || isInteractive(e.target) || !hasTrack) return;
          e.preventDefault();
          const delta = e.key === "ArrowRight" ? SEEK_STEP : -SEEK_STEP;
          const max = s.duration > 0 ? s.duration : Infinity;
          s.seek(Math.min(max, Math.max(0, s.position + delta)));
          return;
        }
        case "ArrowUp":
        case "ArrowDown": {
          if (e.shiftKey || isInteractive(e.target)) return;
          e.preventDefault();
          const delta = e.key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP;
          const base = s.muted ? 0 : s.volume;
          s.setVolume(Math.min(1, Math.max(0, Math.round((base + delta) * 100) / 100)));
          return;
        }
        case "m":
        case "M":
          s.toggleMute();
          return;
        case "n":
        case "N":
          if (hasTrack) s.next();
          return;
        case "p":
        case "P":
          if (hasTrack) s.previous();
          return;
        case "s":
        case "S":
          s.toggleShuffle();
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <audio ref={audioRef} preload="auto" className="hidden" aria-hidden="true" />;
}
