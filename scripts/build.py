#!/usr/bin/env python3
"""Build the deployable site into _site/ for GitHub Pages.

There is no JS compilation (Babel standalone compiles JSX in the browser).
"Build" here means two things:

1. Validate the auto-loaded narration assets, failing the build if broken:
   - assets/transcript.json is a valid vibe-transcript file
   - assets/narration-clips.zip contains vibe-clips.json + every clip file
   - the ZIP manifest's line texts match the transcript line-for-line
     (clips are cached by text — a mismatch means silent lines on the site)
2. Stage only what the site needs into _site/ (entry pages, src/, assets/),
   leaving working files (archive/, dist/, data/) out of the deploy.

The deployed app fetches assets/transcript.json and assets/narration-clips.zip
on page load (src/core/vibe-preload.jsx), so whatever passes this build is
exactly what visitors get auto-loaded.
"""

import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"

TRANSCRIPT = ROOT / "assets" / "transcript.json"
CLIPS_ZIP = ROOT / "assets" / "narration-clips.zip"
SLIDE_TEXT = ROOT / "assets" / "slide-text.json"
SLIDE_TEXT_SRC = ROOT / "src" / "core" / "vibe-slide-text.jsx"

ENTRY_PAGES = ["index.html", "short.html", "intro.html"]
SITE_DIRS = ["src", "assets"]


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def validate_narration_assets():
    # Transcript
    if not TRANSCRIPT.exists():
        fail(f"{TRANSCRIPT.relative_to(ROOT)} is missing")
    try:
        transcript = json.loads(TRANSCRIPT.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"{TRANSCRIPT.relative_to(ROOT)} is not valid JSON: {e}")
    lines = transcript.get("lines")
    if not isinstance(lines, list) or not lines:
        fail(f"{TRANSCRIPT.relative_to(ROOT)} has no 'lines' array")
    texts = [l.get("text") for l in lines]
    if not all(isinstance(t, str) and t.strip() for t in texts):
        fail(f"{TRANSCRIPT.relative_to(ROOT)} has lines without text")
    print(f"  transcript.json          OK — {len(lines)} lines")

    # Clips ZIP
    if not CLIPS_ZIP.exists():
        fail(f"{CLIPS_ZIP.relative_to(ROOT)} is missing")
    try:
        zf = zipfile.ZipFile(CLIPS_ZIP)
    except zipfile.BadZipFile as e:
        fail(f"{CLIPS_ZIP.relative_to(ROOT)} is not a valid ZIP: {e}")
    names = set(zf.namelist())
    if "vibe-clips.json" not in names:
        fail(f"{CLIPS_ZIP.relative_to(ROOT)} has no vibe-clips.json manifest")
    try:
        manifest = json.loads(zf.read("vibe-clips.json"))
    except json.JSONDecodeError as e:
        fail(f"vibe-clips.json inside the ZIP is not valid JSON: {e}")
    mlines = manifest.get("lines")
    if not isinstance(mlines, list) or not mlines:
        fail("vibe-clips.json has no 'lines' array")
    missing = [l["file"] for l in mlines if l.get("file") not in names]
    if missing:
        fail(f"clips ZIP is missing audio files: {', '.join(missing[:5])}")
    print(f"  narration-clips.zip      OK — {len(mlines)} clips "
          f"({manifest.get('voiceLabel', 'unknown voice')})")

    # Cross-check: clips are cached by line TEXT — every transcript line must
    # have an identical-text clip in the manifest or it plays silent/fallback.
    mtexts = [l.get("text") for l in mlines]
    if len(mtexts) != len(texts):
        fail(f"line count mismatch — transcript has {len(texts)} lines, "
             f"clips manifest has {len(mtexts)}")
    bad = [i for i, (a, b) in enumerate(zip(texts, mtexts)) if a != b]
    if bad:
        fail(f"transcript/clips text mismatch on line(s) {[i + 1 for i in bad]} — "
             f"regenerate + re-export the clips ZIP, or update assets/transcript.json")
    print(f"  transcript ↔ clips       OK — all {len(texts)} line texts match")


def validate_slide_text():
    """assets/slide-text.json is the published baseline for the on-screen slide
    text (src/core/vibe-slide-text.jsx fetches it on page load). Broken JSON
    fails the build; key drift vs. the code's default registry only warns —
    unknown keys are ignored at runtime and missing keys fall back to defaults.
    """
    if not SLIDE_TEXT.exists():
        fail(f"{SLIDE_TEXT.relative_to(ROOT)} is missing "
             f"(regenerate with scripts/gen-slide-text.py)")
    try:
        data = json.loads(SLIDE_TEXT.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"{SLIDE_TEXT.relative_to(ROOT)} is not valid JSON: {e}")
    if data.get("format") != "vibe-slide-text":
        fail(f"{SLIDE_TEXT.relative_to(ROOT)} has format={data.get('format')!r}, "
             f"expected 'vibe-slide-text'")
    texts = data.get("texts")
    if not isinstance(texts, dict) or not texts:
        fail(f"{SLIDE_TEXT.relative_to(ROOT)} has no 'texts' object")
    bad = [k for k, v in texts.items() if not isinstance(v, str)]
    if bad:
        fail(f"{SLIDE_TEXT.relative_to(ROOT)} has non-string texts: {bad[:5]}")

    # Cross-check against the default registry in the source file.
    m = re.search(r"/\*ST-DEFAULTS-BEGIN\*/(.*?)/\*ST-DEFAULTS-END\*/",
                  SLIDE_TEXT_SRC.read_text(encoding="utf-8"), re.S)
    if not m:
        fail(f"ST-DEFAULTS markers not found in {SLIDE_TEXT_SRC.relative_to(ROOT)}")
    try:
        defaults = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        fail(f"defaults block in {SLIDE_TEXT_SRC.relative_to(ROOT)} is not valid JSON: {e}")
    extra = sorted(set(texts) - set(defaults))
    missing = sorted(set(defaults) - set(texts))
    if extra:
        print(f"  WARNING: slide-text.json has {len(extra)} key(s) not in the "
              f"registry (ignored at runtime): {', '.join(extra[:5])}")
    if missing:
        print(f"  WARNING: slide-text.json is missing {len(missing)} registry "
              f"key(s) (defaults apply): {', '.join(missing[:5])}")
    print(f"  slide-text.json          OK — {len(texts)} texts "
          f"({len(defaults)} registry keys)")


def stage_site():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    for page in ENTRY_PAGES:
        src = ROOT / page
        if not src.exists():
            fail(f"entry page {page} is missing")
        shutil.copy2(src, SITE / page)
    for d in SITE_DIRS:
        shutil.copytree(ROOT / d, SITE / d)
    # No Jekyll processing — serve files exactly as staged.
    (SITE / ".nojekyll").touch()
    total = sum(f.stat().st_size for f in SITE.rglob("*") if f.is_file())
    count = sum(1 for f in SITE.rglob("*") if f.is_file())
    print(f"  _site/                   {count} files, {total / 1e6:.1f} MB")


def main():
    print("Validating auto-loaded narration assets…")
    validate_narration_assets()
    print("Validating slide text…")
    validate_slide_text()
    print("Staging site…")
    stage_site()
    print("Build OK.")


if __name__ == "__main__":
    main()
