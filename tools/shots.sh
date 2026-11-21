#!/usr/bin/env bash
# Render the game's screenshot scenes with headless Chrome (node serve.ts on port 8093), then save
# each as a 1280x720 JPEG under 256 KiB in screenshots/. usage: bash tools/shots.sh [outdir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-screenshots}"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
TMP="$(mktemp -d)"
node serve.ts --port 8093 > "$TMP/serve.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1
for pair in "01-cover:cover" "02-title:title" "03-near-miss:nearmiss" "04-results:results"; do
  name="${pair%%:*}"; scene="${pair##*:}"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,720 \
    --virtual-time-budget=4000 --enable-logging=stderr --v=0 --user-data-dir="$TMP/profile" \
    --screenshot="$TMP/$name.png" "http://127.0.0.1:8093/index.html?shot=$scene" 2> "$TMP/$name.log" || true
  grep -i "console\|uncaught\|error" "$TMP/$name.log" | grep -v -i "gpu\|dbus\|sandbox\|crashpad" | head -5 || true
  python tools/to_jpeg.py "$TMP/$name.png" "$OUT/$name.jpg"
done
