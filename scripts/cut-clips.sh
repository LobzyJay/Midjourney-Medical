#!/usr/bin/env bash
# Cut + transcode the section clips from the announcement master.
# Uses the project-local ffmpeg-static binary (no system ffmpeg / brew needed).
# Source of truth: Website_PRD.md §9. Capped to 1080p for web weight.
set -euo pipefail

cd "$(dirname "$0")/.."
FF="node_modules/ffmpeg-static/ffmpeg"
SRC="announce.mp4"
OUT="public/clips"
mkdir -p "$OUT"

# name  start  end
clips=(
  "descent 12 30"      # S1 hero descent (platform → golden ring → body into water)
  "machine 40 50"      # S3 the machine (operator, monitor wall)
  "void_detail 6 12"   # S0 macro detail texture loop
)

VF="scale=-2:'min(1080,ih)'"

for entry in "${clips[@]}"; do
  read -r name ss to <<<"$entry"
  echo "→ $name ($ss-$to s)"
  # mp4 (h264)
  "$FF" -y -ss "$ss" -to "$to" -i "$SRC" -an \
    -vf "$VF" -c:v libx264 -crf 20 -preset veryfast -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$name.mp4" -loglevel error
  # webm (vp9)
  "$FF" -y -i "$OUT/$name.mp4" -an \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 \
    "$OUT/$name.webm" -loglevel error
  # poster (first frame)
  "$FF" -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 3 "$OUT/$name.jpg" -loglevel error
done

echo "done:"
ls -lh "$OUT"
