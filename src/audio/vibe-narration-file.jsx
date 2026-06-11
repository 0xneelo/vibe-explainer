// vibe-narration-file.jsx — imported-MP3 narration for the explainer.
// Lets the user load a finished narration file (e.g. the MP3 exported from
// "Download narration MP3", or any externally produced voiceover) and plays
// it locked to the timeline: follows play/pause/seek/speed, with a small
// offset tweak for fine alignment. The file is kept in IndexedDB so it
// survives reloads — including in the standalone copy.

// ── Persistence: one blob in IndexedDB ──────────────────────────────────────
function narrDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('vibe-narration-file', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function narrIdbGet() {
  try {
    const db = await narrDb();
    return await new Promise((res) => {
      const rq = db.transaction('files').objectStore('files').get('narration');
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    });
  } catch { return null; }
}
async function narrIdbPut(blob, name) {
  try {
    const db = await narrDb();
    await new Promise((res) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ blob, name }, 'narration');
      tx.oncomplete = res;
      tx.onerror = res;
    });
  } catch {}
}
async function narrIdbClear() {
  try {
    const db = await narrDb();
    await new Promise((res) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete('narration');
      tx.oncomplete = res;
      tx.onerror = res;
    });
  } catch {}
}

// ── Tiny shared store (entry: undefined=loading, null=none, {url,name,…}) ──
const NarrationFile = {
  entry: undefined,
  _initStarted: false,
  listeners: new Set(),
  notify() { this.listeners.forEach((fn) => { try { fn(); } catch {} }); },
  init() {
    if (this._initStarted) return;
    this._initStarted = true;
    narrIdbGet().then((rec) => {
      if (this.entry === undefined) {
        if (rec && rec.blob) this._apply(rec.blob, rec.name || 'narration.mp3');
        else { this.entry = null; this.notify(); }
      }
    });
  },
  _apply(blob, name) {
    if (this.entry && this.entry.url) { try { URL.revokeObjectURL(this.entry.url); } catch {} }
    const url = URL.createObjectURL(blob);
    this.entry = { url, name, size: blob.size, duration: null };
    this.notify();
    // Probe the duration for the status line.
    const a = new Audio();
    a.preload = 'metadata';
    a.src = url;
    a.onloadedmetadata = () => {
      if (this.entry && this.entry.url === url) {
        this.entry = { ...this.entry, duration: a.duration };
        this.notify();
      }
    };
  },
  setFile(file) {
    this._apply(file, file.name);
    return narrIdbPut(file, file.name); // persistence is best-effort
  },
  clear() {
    if (this.entry && this.entry.url) { try { URL.revokeObjectURL(this.entry.url); } catch {} }
    this.entry = null;
    this.notify();
    return narrIdbClear();
  },
};

function useNarrationFile() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    NarrationFile.listeners.add(force);
    NarrationFile.init();
    return () => NarrationFile.listeners.delete(force);
  }, []);
  return NarrationFile.entry;
}

// ── Player: one audio element slaved to the timeline ───────────────────────
// offset > 0 delays the narration relative to the visuals (audio plays the
// moment that is `offset` seconds EARLIER than the playhead).
function FileVoiceOver({ enabled, rate = 1, offset = 0, muted = false, volume = 1 }) {
  const { time, playing } = useTimeline();
  const entry = useNarrationFile();
  const audioRef = React.useRef(null);
  const offsetRef = React.useRef(offset);
  offsetRef.current = offset;
  const mutedRef = React.useRef(muted);
  mutedRef.current = muted;
  const volRef = React.useRef(volume);
  volRef.current = volume;

  const url = entry ? entry.url : null;

  // (Re)create the element when the file changes.
  React.useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.preload = 'auto';
    a.muted = mutedRef.current;
    a.volume = clamp(volRef.current, 0, 1);
    audioRef.current = a;
    return () => { try { a.pause(); } catch {} if (audioRef.current === a) audioRef.current = null; };
  }, [url]);

  // Mute/volume change the audible output but playback keeps tracking the timeline.
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = clamp(volume, 0, 1);
    }
  }, [muted, volume, url]);

  // Follow play/pause + enabled.
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (enabled && playing) {
      a.playbackRate = clamp(rate, 0.5, 2);
      a.play().catch(() => {});
    } else {
      try { a.pause(); } catch {}
    }
  }, [enabled, playing, url]);

  // Follow speed changes live.
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = clamp(rate, 0.5, 2);
  }, [rate]);

  // Keep the audio clock locked to the timeline clock (handles seeks, the
  // offset tweak, and any slow drift). Both clocks advance at the same rate
  // while playing, so corrections are rare.
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a || !enabled) return;
    const target = Math.max(0, time - (offsetRef.current || 0));
    if (Math.abs(a.currentTime - target) > 0.35) {
      try { a.currentTime = target; } catch {}
    }
  }, [time, enabled, url, offset]);

  React.useEffect(() => () => {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch {} audioRef.current = null; }
  }, []);

  return null;
}

// ── Tweaks-panel controls: import / replace / remove ────────────────────────
function FileNarrationControls() {
  const entry = useNarrationFile();
  const inputRef = React.useRef(null);
  const [error, setError] = React.useState(null);

  const fmtDur = (s) => {
    if (s == null || !isFinite(s)) return '';
    const m = Math.floor(s / 60), ss = Math.round(s % 60);
    return ` · ${m}:${String(ss).padStart(2, '0')}`;
  };

  const onPick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setError(null);
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name)) {
      setError('That doesn\u2019t look like an audio file');
      return;
    }
    NarrationFile.setFile(file);
  };

  const status = error ? `\u26a0 ${error}`
    : entry === undefined ? 'Loading\u2026'
    : !entry ? 'Import a finished narration track (e.g. the MP3 from \u201cDownload narration MP3\u201d). It plays in sync with the timeline.'
    : `${entry.name}${fmtDur(entry.duration)} \u2014 saved in this browser`;

  return (
    <>
      <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        style={{ display: 'none' }} onChange={onPick}></input>
      <div style={{ padding: '2px 14px 6px', fontSize: 11, lineHeight: 1.45,
        color: error ? '#e05252' : 'rgba(255,255,255,0.45)' }}>
        {status}
      </div>
      <TweakButton label={entry ? 'Replace narration MP3' : 'Import narration MP3'}
        onClick={() => inputRef.current && inputRef.current.click()}></TweakButton>
      {entry ? (
        <TweakButton label="Remove narration file" secondary={true}
          onClick={() => NarrationFile.clear()}></TweakButton>
      ) : null}
    </>
  );
}

Object.assign(window, { FileVoiceOver, FileNarrationControls, useNarrationFile, NarrationFile });
