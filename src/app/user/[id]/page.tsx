"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Disc3, Music2, Share2, User } from "lucide-react";
import { ErrorState } from "@/components/media/ErrorState";
import { CollectionCard } from "@/components/media/MediaCard";
import { ShareButton } from "@/components/media/ShareButton";
import { Shelf } from "@/components/media/Shelf";
import { Skeleton } from "@/components/ui/skeleton";
import type { Collection, UserPlaylist } from "@/lib/types";

interface UserProfile {
  id: string;
  name: string;
  avatarColor?: string;
  createdAt: number;
  preferredGenres: string[];
  playlists: UserPlaylist[];
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfileView />
    </Suspense>
  );
}

function UserProfileView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/user/profile/${id}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "User not found");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Profile not found"
        message={error || "This user profile does not exist or has been removed."}
      />
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const collections: Collection[] = profile.playlists.map((cp) => ({
    id: `user:${cp.id}`,
    kind: "playlist",
    title: cp.name,
    description: cp.description,
    owner: { id: profile.id, name: profile.name },
    artwork: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
    artworkLarge: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
    trackCount: cp.tracks.length,
  }));

  const initial = profile.name.slice(0, 1).toUpperCase();

  return (
    <div className="space-y-10 pb-12">
      {/* Header Banner */}
      <header className="relative isolate overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-neutral-800/80 to-neutral-900/60 p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Avatar */}
          <div
            className={`grid size-28 sm:size-36 shrink-0 place-items-center rounded-full bg-gradient-to-br ${
              profile.avatarColor || "from-violet-500 to-fuchsia-600"
            } text-4xl sm:text-5xl font-black text-white shadow-2xl shadow-black/50 ring-4 ring-white/10`}
          >
            {initial}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Listener Profile
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white truncate">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" /> Joined {joinDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Disc3 className="size-4" /> {profile.playlists.length}{" "}
                {profile.playlists.length === 1 ? "public playlist" : "public playlists"}
              </span>
            </div>

            {/* Preferred Genres */}
            {profile.preferredGenres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                {profile.preferredGenres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200 capitalize"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0">
            <ShareButton
              title={`${profile.name}'s Profile on Resonance`}
              label="Share Profile"
              className="bg-white/10 hover:bg-white/20 text-white"
            />
          </div>
        </div>
      </header>

      {/* Public Playlists Shelf */}
      {collections.length > 0 ? (
        <Shelf title={`Public Playlists by ${profile.name}`}>
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </Shelf>
      ) : (
        <div className="rounded-xl border border-white/5 bg-neutral-900/40 p-8 text-center text-zinc-400">
          <Music2 className="mx-auto size-10 text-zinc-600 mb-2" />
          <p className="font-semibold text-white">No public playlists yet</p>
          <p className="text-sm mt-1">
            When {profile.name} creates and shares playlists, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-64 rounded-2xl bg-neutral-800" />
      <Skeleton className="h-48 rounded-xl bg-neutral-800" />
    </div>
  );
}
