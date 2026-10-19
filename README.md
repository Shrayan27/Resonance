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
