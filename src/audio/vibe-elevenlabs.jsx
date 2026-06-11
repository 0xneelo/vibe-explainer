// vibe-elevenlabs.jsx — ElevenLabs premium narration for the explainer.
// Generates one MP3 clip per transcript line via the ElevenLabs API, caches
// clips in IndexedDB (so each line costs credits exactly once), and paces the
// timeline on the real audio: the playhead holds at a caption's end until its
// clip finishes playing. Falls back to the browser voice if the API fails.
//
// The API key lives ONLY in this browser's localStorage — never in project files.

const EL_MODEL = 'eleven_multilingual_v2';
const EL_KEY_STORAGE = 'vibe-el-api-key';

// Curated premade ElevenLabs voices (name shown in Tweaks → voice id).
const EL_VOICES = [
  { label: 'Adam — deep narrator', id: 'pNInz6obpgDQGcFmaJgB' },
  { label: 'Daniel — British, calm', id: 'onwK4e9ZLuTAKqWW03F9' },
  { label: 'Antoni — warm male', id: 'ErXwobaYiN019PkySvjV' },
  { label: 'Josh — young male', id: 'TxGEqnHWrfWFTfGW9XjX' },
  { label: 'Rachel — female', id: '21m00Tcm4TlvDq8ikWAM' },
];
const elVoiceId = (label) => (EL_VOICES.find((v) => v.label === label) || EL_VOICES[0]).id;

// ── Clip cache: memory Map + IndexedDB, keyed by voice+model+text hash ──────
function elHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const elClipKey = (voiceId, text) => `${voiceId}:${EL_MODEL}:${elHash(text)}`;

function elDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('vibe-el-audio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('clips');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function elIdbGet(key) {
  try {
    const db = await elDb();
    return await new Promise((res) => {
      const rq = db.transaction('clips').objectStore('clips').get(key);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    });
  } catch { return null; }
}
async function elIdbPut(key, blob) {
  try {
    const db = await elDb();
    await new Promise((res) => {
      const tx = db.transaction('clips', 'readwrite');
      tx.objectStore('clips').put(blob, key);
      tx.oncomplete = res;
      tx.onerror = res;
    });
  } catch {}
}
async function elIdbClearAll() {
  try {
    const db = await elDb();
    await new Promise((res) => {
      const tx = db.transaction('clips', 'readwrite');
      tx.objectStore('clips').clear();
      tx.oncomplete = res;
      tx.onerror = res;
    });
  } catch {}
}

const ELCache = {
  mem: new Map(),       // key -> { blob, url }
  inflight: new Map(),  // key -> Promise
  listeners: new Set(),
  notify() { this.listeners.forEach((fn) => { try { fn(); } catch {} }); },
};

// Resolve a clip: memory → IndexedDB → ElevenLabs API (then cached).
function elEnsureClip(key, { apiKey, voiceId, text }) {
  if (ELCache.mem.has(key)) return Promise.resolve(ELCache.mem.get(key));
  if (ELCache.inflight.has(key)) return ELCache.inflight.get(key);
  const p = (async () => {
    let blob = await elIdbGet(key);
    if (!blob) {
      if (!apiKey) throw new Error('No API key');
      const resp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: EL_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (!resp.ok) {
        const code = resp.status;
        throw new Error(
          code === 401 ? 'Invalid API key (401)' :
          code === 429 ? 'Rate limited (429) — try again shortly' :
          `ElevenLabs error ${code}`
        );
      }
      blob = await resp.blob();
      await elIdbPut(key, blob);
    }
    const entry = { blob, url: URL.createObjectURL(blob) };
    ELCache.mem.set(key, entry);
    ELCache.notify();
    return entry;
  })();
  ELCache.inflight.set(key, p);
  p.finally(() => ELCache.inflight.delete(key));
  return p;
}

// ── API key (localStorage only) ─────────────────────────────────────────────
function useElApiKey() {
  const [key, setKey] = React.useState(() => {
    try { return localStorage.getItem(EL_KEY_STORAGE) || ''; } catch { return ''; }
  });
  const set = (v) => {
    setKey(v);
    try {
      if (v) localStorage.setItem(EL_KEY_STORAGE, v);
      else localStorage.removeItem(EL_KEY_STORAGE);
    } catch {}
  };
  return [key, set];
}

// ── Narration player: paces the timeline on the real audio ──────────────────
function ElevenLabsVoiceOver({ items, enabled, apiKey, voiceLabel, rate = 1, muted = false }) {
  const { time, playing } = useTimeline();
  const voiceId = elVoiceId(voiceLabel);
  const prevTimeRef = React.useRef(time);
  const spokenRef = React.useRef(-1);
  const holdRef = React.useRef(null);   // { at: seconds, since: ms } | null
  const audioRef = React.useRef(null);  // currently playing HTMLAudioElement
  const playingRef = React.useRef(playing);
  playingRef.current = playing;
  const rateRef = React.useRef(rate);
  rateRef.current = rate;
  // Mute keeps the clip playing silently so the clock gate still paces the
  // timeline exactly the same — only the audible output is cut.
  const mutedRef = React.useRef(muted);
  mutedRef.current = muted;
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const stopAudio = () => {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch {} audioRef.current = null; }
    holdRef.current = null;
  };

  // Clock gate: while a clip is playing (or being fetched), the playhead may
  // not pass the caption's end. Generous watchdog covers slow first fetches.
  React.useEffect(() => {
    if (!enabled) return;
    window.__animTimeGate = (t, next) => {
      const h = holdRef.current;
      if (h == null) return next;
      if (performance.now() - h.since > 25000) { holdRef.current = null; return next; }
      return next > h.at ? Math.max(t, h.at) : next;
    };
    return () => { window.__animTimeGate = null; stopAudio(); };
  }, [enabled]);

  // Follow play/pause.
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.playbackRate = clamp(rateRef.current, 0.5, 2); a.play().catch(() => {}); }
    else { try { a.pause(); } catch {} }
  }, [playing]);

  // Follow speed changes mid-line.
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = clamp(rate, 0.5, 2);
  }, [rate]);

  React.useEffect(() => () => stopAudio(), []);

  React.useEffect(() => {
    if (!enabled || !playing) { prevTimeRef.current = time; return; }
    const prev = prevTimeRef.current;
    prevTimeRef.current = time;
    // Seek or loop-wrap: drop current clip, re-arm.
    if (Math.abs(time - prev) > 0.6) {
      stopAudio();
      spokenRef.current = -1;
      return;
    }
    // Prefetch lines starting within the next 25s (sequential via inflight map).
    for (const c of items) {
      if (c.t > time && c.t < time + 25) {
        const k = elClipKey(voiceId, c.text);
        if (!ELCache.mem.has(k) && !ELCache.inflight.has(k) && apiKey) {
          elEnsureClip(k, { apiKey, voiceId, text: c.text }).catch(() => {});
        }
      }
    }
    // Crossed the start of a caption going forward?
    const idx = items.findIndex((c) => prev < c.t && time >= c.t);
    if (idx >= 0 && idx !== spokenRef.current) {
      spokenRef.current = idx;
      stopAudio();
      const line = items[idx];
      const lineEnd = line.t2 != null ? line.t2 : (items[idx + 1] ? items[idx + 1].t : time + 4);
      const hold = { at: Math.max(lineEnd - 0.35, time), since: performance.now() };
      holdRef.current = hold;
      const release = () => { if (holdRef.current === hold) holdRef.current = null; };
      const key = elClipKey(voiceId, line.text);
      elEnsureClip(key, { apiKey, voiceId, text: line.text })
        .then((entry) => {
          // Stale? (seeked away / another line started / disabled meanwhile)
          if (spokenRef.current !== idx || holdRef.current !== hold) return;
          const a = new Audio(entry.url);
          a.playbackRate = clamp(rateRef.current, 0.5, 2);
          a.muted = mutedRef.current;
          a.onended = release;
          a.onerror = release;
          audioRef.current = a;
          if (playingRef.current) a.play().catch(release);
        })
        .catch(() => {
          // API failed → browser-voice fallback for this line.
          if (spokenRef.current !== idx || holdRef.current !== hold) return;
          if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(line.text);
            u.rate = clamp(rateRef.current, 0.5, 2);
            u.volume = mutedRef.current ? 0 : 1;
            u.onend = release;
            u.onerror = release;
            speechSynthesis.speak(u);
          } else release();
        });
    }
  }, [time, enabled, playing, items, apiKey, voiceId]);

  return null;
}

// ── Tweaks-panel controls: key entry, generate-all, cache status ────────────
function ELNarrationControls({ items, voiceLabel, apiKey, setApiKey }) {
  const voiceId = elVoiceId(voiceLabel);
  const [cached, setCached] = React.useState(0);
  const [busy, setBusy] = React.useState(null); // "12/33" while generating
  const [exporting, setExporting] = React.useState(null); // status while stitching MP3
  const [zipBusy, setZipBusy] = React.useState(null);       // status while packing/unpacking ZIP
  const [info, setInfo] = React.useState(null);             // e.g. import result
  const [error, setError] = React.useState(null);
  const zipInputRef = React.useRef(null);
  const aliveRef = React.useRef(true);
  React.useEffect(() => () => { aliveRef.current = false; }, []);

  const recount = React.useCallback(async () => {
    let n = 0;
    for (const c of items) {
      const k = elClipKey(voiceId, c.text);
      if (ELCache.mem.has(k) || (await elIdbGet(k))) n++;
    }
    if (aliveRef.current) setCached(n);
  }, [items, voiceId]);

  React.useEffect(() => {
    recount();
    const fn = () => recount();
    ELCache.listeners.add(fn);
    return () => ELCache.listeners.delete(fn);
  }, [recount]);

  const generateAll = async () => {
    setError(null);
    try {
      for (let i = 0; i < items.length; i++) {
        setBusy(`${i + 1}/${items.length}`);
        const k = elClipKey(voiceId, items[i].text);
        await elEnsureClip(k, { apiKey, voiceId, text: items[i].text });
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(null);
      recount();
    }
  };

  const exportMp3 = async () => {
    setError(null);
    try {
      await elExportNarration(items, voiceId, (s) => { if (aliveRef.current) setExporting(s); });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      if (aliveRef.current) setExporting(null);
    }
  };

  const exportZip = async () => {
    setError(null); setInfo(null);
    try {
      await elExportClipsZip(items, voiceId, voiceLabel, (s) => { if (aliveRef.current) setZipBusy(s); });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      if (aliveRef.current) setZipBusy(null);
    }
  };

  const onZipPick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError(null); setInfo(null);
    try {
      const r = await elImportClipsZip(file, items, voiceId, (s) => { if (aliveRef.current) setZipBusy(s); });
      if (aliveRef.current) setInfo(`Imported ${r.imported} clips — ${r.matched}/${r.total} lines ready`);
    } catch (e2) {
      if (aliveRef.current) setError(e2.message || String(e2));
    } finally {
      if (aliveRef.current) setZipBusy(null);
      recount();
    }
  };

  const clearCache = async () => {
    await elIdbClearAll();
    ELCache.mem.forEach((e) => { try { URL.revokeObjectURL(e.url); } catch {} });
    ELCache.mem.clear();
    ELCache.notify();
    setError(null);
  };

  const status = busy ? `Generating ${busy}…`
    : exporting ? exporting
    : zipBusy ? zipBusy
    : info ? info
    : !apiKey ? (cached > 0
      ? `${cached}/${items.length} lines cached — no key needed for playback`
      : 'Paste your ElevenLabs key — or import a clips ZIP below')
    : `${cached}/${items.length} lines cached`;

  return (
    <>
      <TweakText label="API key" value={apiKey} placeholder="sk_…"
        onChange={setApiKey}></TweakText>
      <div style={{ padding: '2px 14px 6px', fontSize: 11, lineHeight: 1.45,
        color: error ? '#e05252' : 'rgba(255,255,255,0.45)' }}>
        {error ? `⚠ ${error}` : status}
      </div>
      {apiKey && !busy && (
        <TweakButton
          label={cached >= items.length ? 'Regenerate narration' : 'Generate narration'}
          onClick={generateAll}></TweakButton>
      )}
      {cached >= items.length && !busy && !exporting && (
        <TweakButton label="Download narration MP3" onClick={exportMp3}></TweakButton>
      )}
      {cached >= items.length && !busy && !zipBusy && (
        <TweakButton label="Download clips ZIP" onClick={exportZip}></TweakButton>
      )}
      {!busy && !zipBusy && (
        <TweakButton label="Import clips ZIP"
          onClick={() => zipInputRef.current && zipInputRef.current.click()}></TweakButton>
      )}
      <input ref={zipInputRef} type="file" accept=".zip,application/zip"
        style={{ display: 'none' }} onChange={onZipPick}></input>
      {cached > 0 && !busy && (
        <TweakButton label="Clear audio cache" secondary={true} onClick={clearCache}></TweakButton>
      )}
    </>
  );
}

// Reactive cached-clip count for the current transcript + voice (used by the
// stage banner and anything else that needs to know if playback is possible).
function useElCachedCount(items, voiceId) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    const recount = async () => {
      let c = 0;
      for (const it of items) {
        const k = elClipKey(voiceId, it.text);
        if (ELCache.mem.has(k) || (await elIdbGet(k))) c++;
      }
      if (alive) setN(c);
    };
    recount();
    const fn = () => recount();
    ELCache.listeners.add(fn);
    return () => { alive = false; ELCache.listeners.delete(fn); };
  }, [items, voiceId]);
  return n;
}

Object.assign(window, {
  ElevenLabsVoiceOver, ELNarrationControls, useElApiKey, EL_VOICES, elVoiceId,
  elClipKey, elIdbGet, elIdbPut, ELCache, EL_MODEL, useElCachedCount,
});
