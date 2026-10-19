#!/usr/bin/env bash
# Installs Ghidra (checksum-verified) and REA (rea-agents), then registers REA with Cursor.
# Requires: Node.js/npm, a full JDK 21+ (java + javac), curl, unzip.
set -euo pipefail

GHIDRA_VERSION="${GHIDRA_VERSION:-12.1.4}"
GHIDRA_DATE="${GHIDRA_DATE:-20260921}"
GHIDRA_SHA256="${GHIDRA_SHA256:-ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db}"
TOOLS_DIR="${TOOLS_DIR:-$HOME/tools}"
JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")}"

mkdir -p "$TOOLS_DIR"
cd "$TOOLS_DIR"

if [ ! -d "ghidra_${GHIDRA_VERSION}_PUBLIC" ]; then
  zip="ghidra_${GHIDRA_VERSION}_PUBLIC_${GHIDRA_DATE}.zip"
  curl -fL -o "$zip" "https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/${zip}"
  echo "${GHIDRA_SHA256}  ${zip}" | sha256sum -c -
  unzip -q "$zip"
  rm "$zip"
fi
ln -sfn "$TOOLS_DIR/ghidra_${GHIDRA_VERSION}_PUBLIC" "$TOOLS_DIR/ghidra"

npm install --global rea-agents

export GHIDRA_INSTALL_DIR="$TOOLS_DIR/ghidra"
export JAVA_HOME

rea doctor --provider ghidra --json >/dev/null
rea setup --yes --client cursor --json >/dev/null

cat <<EOF
Done. Add to your shell profile:
  export GHIDRA_INSTALL_DIR="$GHIDRA_INSTALL_DIR"
  export JAVA_HOME="$JAVA_HOME"
Restart Cursor to load the REA MCP server.
EOF
