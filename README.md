# Vibe Explainer

Animated explainer videos for Vibe, built with React 18 + Babel standalone (no compile step — JSX is compiled in the browser).

## Running locally

Serve the folder with any static server and open an entry page:

```bash
python3 -m http.server 8000
# http://localhost:8000/index.html
```

## Deploying (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which executes
`python3 scripts/build.py` and publishes the resulting `_site/` to GitHub Pages.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

The build validates the two auto-loaded narration assets and fails the deploy
if they're broken or out of sync:

- `assets/transcript.json` — the published script. The app fetches it on load
  and uses it as the transcript baseline (local browser drafts still win).
- `assets/narration-clips.zip` — one MP3 per line + manifest. On load the app
  imports it into the clip cache, so visitors get full ElevenLabs narration
  with **no API key** and no manual imports. Skipped once all lines are cached.

To publish a new narration: in the app (as admin) edit the transcript →
Generate narration → **Download .json** + **Download clips ZIP** → save them as
`assets/transcript.json` and `assets/narration-clips.zip` → push.

## Entry points

| Page | Description |
| --- | --- |
| `index.html` | Full explainer ("Vibe — The Missing Financial Primitive") |
| `short.html` | 60-second cut |
| `intro.html` | Intro drawing scene only (surgical edit page) |

## Structure

```
├── index.html / short.html / intro.html   Entry pages
├── src/
│   ├── apps/        App shells (vibe-app, vibe-short-app, vibe-intro-app)
│   ├── core/        Shared foundation: animations, tweaks panel, elements, transcript editor, asset preload
│   ├── scenes/      Scene definitions (intro, a/b/c, short cut)
│   ├── audio/       Playback engines: music synth, voiceover, ElevenLabs, narration file
│   └── export/      Download features: narration MP3, clips ZIP, video recording
├── assets/
│   ├── transcript.json        Published transcript (auto-loaded on page load)
│   ├── narration-clips.zip    Published narration clips (auto-loaded on page load)
│   ├── audio/       Soundtrack MP3
│   ├── fonts/       Just Another Hand woff2
│   └── images/      Vibe duck SVG
├── scripts/         build.py — validates narration assets, stages _site/
├── .github/         Pages deploy workflow
├── data/            vibe-transcript.json (older saved transcript backup)
├── dist/            Self-contained standalone HTML builds (gitignored)
└── archive/         Working files: scraps (frame snapshots), uploads (drawings, pasted refs)
```

## Notes

- Script load order in the HTML pages matters — files attach exports to `window`.
- The ElevenLabs API key lives only in browser localStorage, never in project files.
- Per-line narration clips are cached in IndexedDB; export/import them via the clips ZIP feature.
