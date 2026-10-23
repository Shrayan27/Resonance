"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Lock, Mail, Music, Sparkles, User, X } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

const ONBOARDING_GENRES = [
  { id: "punjabi", label: "Punjabi Hits", icon: "🔥", desc: "Aujla, Sidhu, Diljit, Shubh" },
  { id: "hindi bollywood", label: "Bollywood / Hindi", icon: "🎬", desc: "Arijit, Atif, Pritam, Shreya" },
  { id: "indie & lo-fi", label: "Indie & Lo-Fi", icon: "🌙", desc: "Abdul Hannan, Zaeden, Late Night" },
  { id: "hip-hop", label: "Desi Hip-Hop", icon: "🎤", desc: "Divine, Seedhe Maut, KR$NA" },
  { id: "sufi & acoustic", label: "Sufi & Acoustic", icon: "🕊️", desc: "Nusrat, Rahat, Coke Studio" },
  { id: "english pop", label: "English Pop", icon: "🌍", desc: "The Weeknd, Taylor, Billie" },
  { id: "rock", label: "Rock & Alternative", icon: "🎸", desc: "Local Train, Parvaaz, Strings" },
  { id: "edm & dance", label: "EDM & Club", icon: "⚡", desc: "Nucleya, Ritviz, Electronic" },
];

function AuthModalInner({ tab }: { tab: "login" | "signup" }) {
  const close = useAuth((s) => s.closeAuthModal);
  const setTab = useAuth((s) => s.setAuthModalTab);
  const login = useAuth((s) => s.login);
  const signup = useAuth((s) => s.signup);

  const [step, setStep] = useState<"form" | "onboarding">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "signup" && step === "form") {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setStep("onboarding");
      return;
    }

    if (tab === "signup" && step === "onboarding") {
      setLoading(true);
      const res = await signup({
        name,
        email,
        password,
        preferredGenres: selectedGenres,
      });
      setLoading(false);
      if (!res.success) {
        setStep("form");
        setError(res.error || "Failed to create account");
      }
      return;
    }

    // Login flow
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to log in");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-60 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 size-60 rounded-full bg-purple-500/20 blur-3xl"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close dialog"
          className="absolute top-5 right-5 grid size-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {step === "form" ? (
          <>
            {/* Header / Tabs */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-linear-to-tr from-brand to-purple-500 shadow-lg shadow-brand/25">
                <Music className="size-6 text-black" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {tab === "login" ? "Welcome back" : "Join Resonance"}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {tab === "login"
                  ? "Log in to tune your queue and taste recommendations"
                  : "Create an account to learn your music taste and smart autoplay"}
              </p>
            </div>

            {/* Tab switch pills */}
            <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-all outline-none",
                  tab === "login"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-all outline-none",
                  tab === "signup"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "signup" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Shrayan"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-500 transition-colors outline-none focus:border-brand focus:bg-white/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-500 transition-colors outline-none focus:border-brand focus:bg-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-10 text-sm text-white placeholder-zinc-500 transition-colors outline-none focus:border-brand focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-linear-to-r from-brand to-emerald-400 py-3 text-sm font-bold text-black shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : tab === "login"
                    ? "Sign In"
                    : "Continue to Personalize →"}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: Onboarding - Choose Initial Music Vibe */
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <Sparkles className="size-3.5" /> Music Taste Setup
              </div>
              <h2 className="text-xl font-bold text-white">What music moves you?</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Pick 2 or more genres you enjoy so we can tune your recommendations immediately.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {ONBOARDING_GENRES.map((g) => {
                const selected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                      selected
                        ? "border-brand bg-brand/15 text-white shadow-md shadow-brand/10 ring-1 ring-brand/50"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-lg">{g.icon}</span>
                      {selected && <Check className="size-4 text-brand" />}
                    </div>
                    <span className="text-xs font-bold leading-tight">{g.label}</span>
                    <span className="line-clamp-1 text-[10px] text-zinc-400">{g.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-linear-to-r from-brand to-emerald-400 py-2.5 text-xs font-bold text-black shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading
                  ? "Setting up your vibe..."
                  : selectedGenres.length > 0
                    ? `Start Listening with ${selectedGenres.length} Genres`
                    : "Skip & Learn as I Listen →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthModal() {
  const isOpen = useAuth((s) => s.isAuthModalOpen);
  const activeTab = useAuth((s) => s.authModalTab);

  if (!isOpen) return null;

  return <AuthModalInner key={activeTab} tab={activeTab} />;
}
