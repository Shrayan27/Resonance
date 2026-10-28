
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
  result
    .then(() => {
      usePlayer.getState().setBuffering(false);
    })
    .catch((err: unknown) => {
      const name = err instanceof DOMException ? err.name : "";
      usePlayer.getState().setBuffering(false);
      if (name === "AbortError") return;
      if (name === "NotSupportedError") return;
      usePlayer.getState().pause();
    });
}

interface WebAudioGraph {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  bassFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  trebleFilter: BiquadFilterNode;
  gainNode: GainNode;
  compressor: DynamicsCompressorNode;
  active: boolean;
}

function calculatePerceptualGain(volume: number, muted: boolean): number {
  if (muted || volume <= 0) return 0;
  if (volume <= 1.0) {
    // Quadratic power curve for natural logarithmic volume perception
    return Math.pow(volume, 2);
  }
  // Loudness Boost (1.0 to 2.0):
  // At 1.0 -> 1.0 (0 dB)
  // At 1.5 -> 1.75 (+4.86 dB)
  // At 2.0 -> 2.5 (+7.96 dB)
  return 1.0 + (volume - 1.0) * 1.5;
}

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioGraph = useRef<WebAudioGraph | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const lastProgressAt = useRef(0);
  const errorStreak = useRef(0);
  const lastTrackId = useRef<string | null>(null);

  const track = usePlayer(selectCurrentTrack);
  const trackId = track?.id ?? null;
  const streamUrl = track?.streamUrl ?? null;
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const customEq = usePlayer((s) => s.customEq);
  const seekRequest = usePlayer((s) => s.seekRequest);
  const error = usePlayer((s) => s.error);

  const initWebAudio = () => {
    if (audioGraph.current || typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 120;

      const midFilter = ctx.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1500;
      midFilter.Q.value = 1.0;

      const trebleFilter = ctx.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.value = 5000;

      const gainNode = ctx.createGain();

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -3;
      compressor.knee.value = 6;
      compressor.ratio.value = 16;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      source.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(ctx.destination);

      audioGraph.current = {
        ctx,
        source,
        bassFilter,
        midFilter,
        trebleFilter,
        gainNode,
        compressor,
        active: true,
      };
    } catch (e) {
      console.warn("Web Audio API fallback to direct volume:", e);
    }
  };

  // Unified single playback and track transition controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!streamUrl || !trackId) {
      lastTrackId.current = null;
      pendingSeek.current = null;
      audio.removeAttribute("src");
      audio.load();
      usePlayer.getState().setBuffering(false);
      return;
    }

    const isNewTrack = lastTrackId.current !== trackId;

    if (isNewTrack) {
      lastTrackId.current = trackId;
      pendingSeek.current = null;
      audio.src = streamUrl;
      audio.load();
      if (isPlaying) {
        initWebAudio();
        if (audioGraph.current?.ctx.state === "suspended") {
          audioGraph.current.ctx.resume().catch(() => {});
        }
        usePlayer.getState().setBuffering(true);
        tryPlay(audio);
      } else {
        usePlayer.getState().setBuffering(false);
      }
    } else {
      // Same track: purely handle play / pause toggling
      if (isPlaying) {
        initWebAudio();
        if (audioGraph.current?.ctx.state === "suspended") {
          audioGraph.current.ctx.resume().catch(() => {});
        }
        if (audio.paused) {
          tryPlay(audio);
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
        usePlayer.getState().setBuffering(false);
        const current = selectCurrentTrack(usePlayer.getState());
        const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (current?.durationSec ?? 0);
        if (Number.isFinite(audio.currentTime)) {
          usePlayer.getState().setProgress(audio.currentTime, duration);
        }
      }
    }
  }, [streamUrl, trackId, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetGain = calculatePerceptualGain(volume, muted);

    if (audioGraph.current && audioGraph.current.active) {
      const { ctx, gainNode, bassFilter, midFilter, trebleFilter } = audioGraph.current;
      if (ctx.state === "suspended" && isPlaying) {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      gainNode.gain.setTargetAtTime(targetGain, now, 0.02);
      bassFilter.gain.setTargetAtTime(customEq.bass, now, 0.04);
      midFilter.gain.setTargetAtTime(customEq.mid, now, 0.04);
      trebleFilter.gain.setTargetAtTime(customEq.treble, now, 0.04);

      // Keep underlying media element fully open when passing through audio graph
      audio.volume = 1.0;
      audio.muted = false;
    } else {
      audio.volume = Math.min(1, Math.max(0, volume <= 1 ? Math.pow(volume, 2) : 1));
      audio.muted = muted;
    }
  }, [volume, muted, customEq, isPlaying]);

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
      if (Number.isFinite(audio.currentTime)) {
        store.getState().setProgress(audio.currentTime, duration);
      }
    };

    const onTimeUpdate = () => {
      if (store.getState().buffering) {
        store.getState().setBuffering(false);
      }
      reportProgress();
    };

    const onLoadedMetadata = () => {
      if (pendingSeek.current !== null) {
        audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
      reportProgress(true);
    };

    const onLoadedData = () => {
      store.getState().setBuffering(false);
    };

    const onDurationChange = () => reportProgress(true);

    const onWaiting = () => {
      if (store.getState().isPlaying) {
        store.getState().setBuffering(true);
      }
    };

    const onStalled = () => {
      if (store.getState().isPlaying && audio.readyState < 2) {
        store.getState().setBuffering(true);
      }
    };

    const onPlaying = () => {
      errorStreak.current = 0;
      const s = store.getState();
      s.setBuffering(false);
      if (s.error) s.setError(null);
      if (!s.isPlaying) {
        s.play();
      }
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    };

    const onCanPlay = () => store.getState().setBuffering(false);
    const onCanPlayThrough = () => store.getState().setBuffering(false);
    const onSeeked = () => {
      store.getState().setBuffering(false);
      reportProgress(true);
    };

    const onPause = () => {
      store.getState().setBuffering(false);
      reportProgress(true);
      if (store.getState().isPlaying) {
        store.getState().pause();
      }
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    };

    const onEnded = () => {
      store.getState().setBuffering(false);
      const s = store.getState();
      const current = selectCurrentTrack(s);
      const trackDuration = current?.durationSec ?? 0;
      const actualDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : trackDuration;

      // Guard: Ignore premature 'ended' events triggered if network stream closed prematurely mid-song
      if (actualDuration > 5 && audio.currentTime < actualDuration - 2) {
        return;
      }

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
      ["loadeddata", onLoadedData],
      ["durationchange", onDurationChange],
      ["waiting", onWaiting],
      ["stalled", onStalled],
      ["playing", onPlaying],
      ["canplay", onCanPlay],
      ["canplaythrough", onCanPlayThrough],
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
    set("stop", () => s().pause());
    set("previoustrack", () => s().previous());
    set("nexttrack", () => s().next());
    set("seekbackward", (d) => s().seek(Math.max(0, s().position - (d.seekOffset ?? SEEK_STEP))));
    set("seekforward", (d) => s().seek(Math.min(s().duration || Infinity, s().position + (d.seekOffset ?? SEEK_STEP))));
    set("seekto", (d) => {
      if (typeof d.seekTime === "number") s().seek(d.seekTime);
    });
    return () => {
      for (const a of ["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"] as const) {
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
        // Earphone tap & Bluetooth headset media buttons
        case "MediaPlayPause":
        case "MediaPause":
        case "MediaStop":
        case "AudioPause":
        case "AudioPlayPause":
        case " ":
        case "Spacebar":
          if (isInteractive(e.target)) return;
          e.preventDefault();
          s.toggle();
          return;
        case "MediaPlay":
        case "AudioPlay":
          e.preventDefault();
          s.play();
          return;
        case "MediaTrackNext":
          e.preventDefault();
          if (hasTrack) s.next();
          return;
        case "MediaTrackPrevious":
          e.preventDefault();
          if (hasTrack) s.previous();
          return;
        case "ArrowRight":
        case "ArrowLeft": {
          if (e.shiftKey || isEditable(e.target) || !hasTrack) return;
          e.preventDefault();
          const audio = audioRef.current;
          const currentPos = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : s.position;
          const delta = e.key === "ArrowRight" ? SEEK_STEP : -SEEK_STEP;
          const max = s.duration > 0 ? s.duration : Infinity;
          s.seek(Math.min(max, Math.max(0, currentPos + delta)));
          return;
        }
        case "j":
        case "J": {
          if (isEditable(e.target) || !hasTrack) return;
          e.preventDefault();
          const audio = audioRef.current;
          const currentPos = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : s.position;
          s.seek(Math.max(0, currentPos - SEEK_STEP));
          return;
        }
        case "l":
        case "L": {
          if (isEditable(e.target) || !hasTrack) return;
          e.preventDefault();
          const audio = audioRef.current;
          const currentPos = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : s.position;
          const max = s.duration > 0 ? s.duration : Infinity;
          s.seek(Math.min(max, currentPos + SEEK_STEP));
          return;
        }
        case "ArrowUp":
        case "ArrowDown": {
          if (e.shiftKey || isInteractive(e.target)) return;
          e.preventDefault();
          const delta = e.key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP;
          s.changeVolumeBy(delta);
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

  return <audio ref={audioRef} crossOrigin="anonymous" preload="auto" className="hidden" aria-hidden="true" />;
}
