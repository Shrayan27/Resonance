"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArtistDetail, CollectionDetail, HomeFeed, SearchResults } from "@/lib/types";

const TTL_MS = 5 * 60_000;

interface CacheEntry {
  data: unknown;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function readCache<T>(url: string): T | undefined {
  const hit = cache.get(url);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(url);
    return undefined;
  }
  return hit.data as T;
}

/** Fetch JSON with in-memory caching and request de-duplication. */
export function fetchJson<T>(url: string): Promise<T> {
  const cached = readCache<T>(url);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const request = fetch(url)
    .then(async (res) => {
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : `Request failed (${res.status})`;
        throw new Error(message);
      }
      cache.set(url, { data: body, at: Date.now() });
      return body as T;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, request);
  return request;
}

export const fetchHome = () => fetchJson<HomeFeed>("/api/catalog/home");
export const fetchSearch = (q: string) =>
  fetchJson<SearchResults>(`/api/catalog/search?q=${encodeURIComponent(q)}`);
export const fetchCollection = (id: string) =>
  fetchJson<CollectionDetail>(`/api/catalog/playlists/${encodeURIComponent(id)}`);
export const fetchArtist = (id: string) =>
  fetchJson<ArtistDetail>(`/api/catalog/artists/${encodeURIComponent(id)}`);

export interface QueryState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  retry: () => void;
}

interface Settled<T> {
  url: string;
  data?: T;
  error?: string;
}

function useQuery<T>(url: string | null): QueryState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return;
    if (readCache<T>(url) !== undefined) return;
    let cancelled = false;
    fetchJson<T>(url).then(
      (data) => {
        if (!cancelled) setSettled({ url, data });
      },
      (err: unknown) => {
        if (!cancelled) setSettled({ url, error: err instanceof Error ? err.message : "Something went wrong" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  const retry = useCallback(() => {
    if (url) cache.delete(url);
    setSettled(null);
    setAttempt((n) => n + 1);
  }, [url]);

  if (!url) return { data: undefined, error: undefined, loading: false, retry };

  const data = readCache<T>(url) ?? (settled?.url === url ? settled.data : undefined);
  const error = data === undefined && settled?.url === url ? settled.error : undefined;
  return { data, error, loading: data === undefined && error === undefined, retry };
}

export function useHome() {
  return useQuery<HomeFeed>("/api/catalog/home");
}

export function useSearch(q: string) {
  const trimmed = q.trim();
  return useQuery<SearchResults>(trimmed ? `/api/catalog/search?q=${encodeURIComponent(trimmed)}` : null);
}

export function useCollection(id: string | undefined) {
  return useQuery<CollectionDetail>(id ? `/api/catalog/playlists/${encodeURIComponent(id)}` : null);
}

export function useArtist(id: string | undefined) {
  return useQuery<ArtistDetail>(id ? `/api/catalog/artists/${encodeURIComponent(id)}` : null);
}
