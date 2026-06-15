// vibe-preload.jsx — auto-loads the published narration assets on page load.
// The deploy ships assets/transcript.json (the published script) and
// assets/narration-clips.zip (one MP3 per line + manifest). On boot the app
// fetches both: the transcript becomes the script baseline and the clips fill
// the per-line cache — so a fresh visitor gets the fully narrated cut with no
// API key and no manual imports. Local browser drafts still win over the
// published transcript, and the ZIP download is skipped once every line is
// already cached in IndexedDB.

const VIBE_PUBLISHED_TRANSCRIPT_URL = 'assets/transcript.json';
const VIBE_PUBLISHED_SLIDE_TEXT_URL = 'assets/slide-text.json';
const VIBE_PUBLISHED_CLIPS_URL = 'assets/narration-clips.zip';
const VIBE_CLIPS_AUTOLOAD_GUARD = 'vibe-clips-autoload-attempted';

// → parsed transcript ({ lines: [{ t, t2, text }] }) or null if absent/invalid.
async function vibeFetchPublishedTranscript() {
  try {
    const r = await fetch(VIBE_PUBLISHED_TRANSCRIPT_URL, { cache: 'no-cache' });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !Array.isArray(j.lines)) return null;
    console.info(`[vibe] published transcript loaded — ${j.lines.length} lines (${VIBE_PUBLISHED_TRANSCRIPT_URL})`);
    return j;
  } catch {
    return null;
  }
}

// → published slide-text map ({ key: string }) or null if absent/invalid.
// A missing file is fine — the slide-text registry falls back to its defaults.
async function vibeFetchPublishedSlideText() {
  try {
    const r = await fetch(VIBE_PUBLISHED_SLIDE_TEXT_URL, { cache: 'no-cache' });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.format !== 'vibe-slide-text' || !j.texts || typeof j.texts !== 'object') return null;
    console.info(`[vibe] published slide text loaded — ${Object.keys(j.texts).length} keys (${VIBE_PUBLISHED_SLIDE_TEXT_URL})`);
    return j.texts;
  } catch {
    return null;
  }
}

// Pull assets/narration-clips.zip into the per-line clip cache (IndexedDB +
// memory) unless every line is already cached. Guarded per-session so a
// missing or broken ZIP is only attempted once per visit.
async function vibeAutoloadClips(items, voiceId) {
  let missing = 0;
  for (const c of items) {
    const k = elClipKey(voiceId, c.text);
    if (!ELCache.mem.has(k) && !(await elIdbGet(k))) missing++;
  }
  if (!missing) {
    console.info(`[vibe] narration clips already cached — ${items.length}/${items.length} lines`);
    return;
  }
  try {
    if (sessionStorage.getItem(VIBE_CLIPS_AUTOLOAD_GUARD)) return;
    sessionStorage.setItem(VIBE_CLIPS_AUTOLOAD_GUARD, '1');
  } catch {}
  try {
    const r = await fetch(VIBE_PUBLISHED_CLIPS_URL);
    if (!r.ok) {
      console.info(`[vibe] no published clips ZIP at ${VIBE_PUBLISHED_CLIPS_URL} (HTTP ${r.status})`);
      return;
    }
    const blob = await r.blob();
    const res = await elImportClipsZip(blob, items, voiceId, () => {});
    console.info(`[vibe] narration clips auto-imported — ${res.imported} clips, ${res.matched}/${res.total} lines ready`);
  } catch (e) {
    console.warn('[vibe] narration clips auto-import failed:', e && e.message ? e.message : e);
  }
}

Object.assign(window, { vibeFetchPublishedTranscript, vibeFetchPublishedSlideText, vibeAutoloadClips });
