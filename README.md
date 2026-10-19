# Reverse engineering workspace

This workspace uses [REA](https://github.com/morluto/rea) (`rea-agents` on npm) with [Ghidra](https://ghidra-sre.org/) as the native analysis engine.

## Install

```bash
bash scripts/install-rea-ghidra.sh
```

This downloads Ghidra 12.1.4 (SHA-256 verified) into `~/tools/ghidra`, installs the `rea` CLI globally, and registers the REA MCP server and skill with Cursor. Prerequisites: Node.js 20+, a full JDK 21+, `curl`, `unzip`.

Environment variables (add to your shell profile):

```bash
export GHIDRA_INSTALL_DIR="$HOME/tools/ghidra"
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

## Verify

```bash
rea doctor --provider ghidra --json
rea analyze /bin/true --provider ghidra --json
```

## Use

- In Cursor (after restart), ask the agent to investigate a binary, Electron app or website with REA.
- JavaScript/Electron apps and websites need no Ghidra: `rea analyze-javascript-application <dir> --json`, `rea analyze-web-bundle`.
- Hopper, IDA, JADX and Kuna providers are optional and not installed.

## Resonance (web music player)

An original, Spotify-web-player-style app built from the REA analysis in `docs/REVERSE_ENGINEERING.md`: library rail, shelf-based home, search, playlist and artist pages, queue and now-playing panels, bottom transport bar, keyboard shortcuts and Media Session support.

- Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, zustand.
- Catalog and audio: the public Audius API, proxied by `/api/catalog/*` and `/api/stream/:id`. No account or API key needed.
- Library (liked songs, playlists) is stored in the browser's localStorage.

```bash
npm install
npm run build && npx next start -p 47321   # or: npx next dev -p 47321
```

Shortcuts: Space play/pause, Left/Right seek 5s, Up/Down volume, `m` mute, `n` next, `p` previous, `s` shuffle, `/` or Ctrl/Cmd+K search.
