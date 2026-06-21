#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# extract_frames.sh  —  Video → reference frames, for design reference building
# Author note: built for Adewale / Layout Studio. Run on your Mac.
#
# WHAT IT DOES
#   Given a YouTube URL (or a local video, or a direct CDN .mp4/.webm), it:
#     1. downloads the highest sensible quality (YouTube only)
#     2. extracts DISTINCT SHOTS via scene-change detection  -> frames/key_*
#     3. extracts a TIMELINE GRID (one frame every N seconds) -> frames/grid_*
#     4. builds contact sheets so you can scan everything at once
#     5. dumps a color palette (PNG swatch + hex list) from all frames
#
# REQUIREMENTS (install once, Homebrew):
#     brew install yt-dlp ffmpeg imagemagick python
#     python3 -m pip install pillow
#
# USAGE
#     ./extract_frames.sh "https://www.youtube.com/watch?v=ai4YvYV_gW8"
#     ./extract_frames.sh ./local_clip.mp4
#     ./extract_frames.sh "https://cdn.midjourney.com/.../spa_renders_sidebyside-XXXX.mp4"
#
# OPTIONS (env vars)
#     OUT=mydir          output folder            (default: ./frames_out)
#     EVERY=2            grid frame every N sec    (default: 2)
#     SCENE=0.30         scene sensitivity 0-1     (default: 0.30; lower = more shots)
#     MAXRES=1440        cap download height       (default: 1440)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SRC="${1:?Pass a YouTube URL, a local file, or a direct video URL}"
OUT="${OUT:-frames_out}"
EVERY="${EVERY:-2}"
SCENE="${SCENE:-0.30}"
MAXRES="${MAXRES:-1440}"

mkdir -p "$OUT/frames" "$OUT/contact_sheets"
VID="$OUT/source.mp4"

# ── 1. ACQUIRE ───────────────────────────────────────────────────────────────
if [[ -f "$SRC" ]]; then
  echo "→ Using local file: $SRC"; cp "$SRC" "$VID"
elif [[ "$SRC" == *youtube.com* || "$SRC" == *youtu.be* ]]; then
  echo "→ Downloading from YouTube (cap ${MAXRES}p)…"
  yt-dlp -S "res:${MAXRES},ext:mp4:m4a" -f "bv*+ba/b" -o "$VID" "$SRC"
else
  # Direct CDN/asset URL. A real browser session usually passes Cloudflare;
  # the -H headers below mimic one. If you still get a 403, download it manually
  # in your browser (right-click the video on the page) and re-run on the file.
  echo "→ Fetching direct URL…"
  curl -L --fail -o "$VID" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
    -H "Referer: https://www.midjourney.com/medical" \
    "$SRC"
fi

# ── 2. SCENE-CHANGE KEYFRAMES (distinct shots) ───────────────────────────────
echo "→ Extracting distinct shots (scene > $SCENE)…"
ffmpeg -hide_banner -loglevel error -i "$VID" \
  -vf "select='gt(scene,${SCENE})'" -vsync vfr -q:v 2 "$OUT/frames/key_%03d.jpg"

# ── 3. TIMELINE GRID (one frame every EVERY seconds) ─────────────────────────
echo "→ Extracting timeline grid (every ${EVERY}s)…"
ffmpeg -hide_banner -loglevel error -i "$VID" \
  -vf "fps=1/${EVERY},scale=1280:-1" -q:v 2 "$OUT/frames/grid_%03d.jpg"

KN=$(ls "$OUT"/frames/key_*.jpg 2>/dev/null | wc -l | tr -d ' ')
GN=$(ls "$OUT"/frames/grid_*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "   keyframes: $KN | grid: $GN"

# ── 4. CONTACT SHEETS ────────────────────────────────────────────────────────
echo "→ Building contact sheets…"
montage "$OUT"/frames/key_*.jpg  -tile 5x -geometry 360x203+5+5 -background "#0a0a0a" "$OUT/contact_sheets/keyframes.jpg"  || true
montage "$OUT"/frames/grid_*.jpg -tile 6x -geometry 300x169+4+4 -background "#0a0a0a" "$OUT/contact_sheets/grid_timeline.jpg" || true

# ── 5. COLOR PALETTE ─────────────────────────────────────────────────────────
echo "→ Extracting color palette…"
python3 - "$OUT" << 'PY'
import sys, glob, colorsys
from PIL import Image
out = sys.argv[1]
imgs = sorted(glob.glob(f"{out}/frames/*.jpg"))
if not imgs:
    print("   no frames"); sys.exit()
strip = Image.new("RGB", (120*len(imgs), 120))
for i, p in enumerate(imgs):
    strip.paste(Image.open(p).convert("RGB").resize((120,120)), (120*i, 0))
q = strip.quantize(colors=16, method=Image.FASTOCTREE).convert("RGB")
cols = sorted(q.getcolors(10**8), reverse=True)
total = sum(n for n,_ in cols)
sw = Image.new("RGB", (16*80, 120))
lines = []
for i,(n,c) in enumerate(cols):
    sw.paste(c, (i*80,0,(i+1)*80,120))
    h,s,v = colorsys.rgb_to_hsv(*[x/255 for x in c])
    lines.append(f"{100*n/total:5.1f}%  #{c[0]:02X}{c[1]:02X}{c[2]:02X}  HSV({round(h*360)},{round(s*100)}%,{round(v*100)}%)")
sw.save(f"{out}/palette_swatch.png")
open(f"{out}/palette.txt","w").write("\n".join(lines))
print("\n".join(lines))
print(f"   -> {out}/palette_swatch.png  +  palette.txt")
PY

echo "✓ Done. See: $OUT/frames, $OUT/contact_sheets, $OUT/palette_swatch.png"
