// vibe-app.jsx — assembles the Vibe whiteboard explainer: Stage + scenes + captions + tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2B5CE6",
  "typography": "handwritten",
  "writeSpeed": 0.5,
  "captions": true,
  "voiceover": true,
  "music": true,
  "musicStyle": "soundtrack",
  "musicVol": 0.4,
  "engine": "elevenlabs",
  "narrOffset": 0,
  "elVoice": "Adam — deep narrator",
  "voice": "auto",
  "transcript": true,
  "script": ["The Trojan Horse go-to-market. In such a saturated perp dex market, how will Vibe attract new users?","Very simple. Vibe is not a perp dex — it's a permissionless credit engine.","When people think about markets, they think of two things: buying and selling.","You buy. Maybe it goes up. You sell it to someone else. Simple, right?","Buying and selling are the most visible part of every economy, but they’re not the whole market.","The real economy doesn’t run on flipping assets. It runs on credit.\nSimply said, lending and borrowing.","So remember kids,  finance is not just buying and selling.","Since Uniswap launched, the crypto industry perfected creation of assets and buying and selling of those assets.","A token launches, a pool gets deployed, the price goes up and down. That’s the spot market.","But once you own a lot of an asset… what can you actually do with it?","Buy and hold it. Hope it goes up. \nTweet about it and sell it later. That’s a very one-directional market.","Buy. Hold. Hope.","Now  think about the normal economy for a second.","One side holds assets: banks, bondholders, landlords, funds.","The other side wants access: capital, leverage, exposure.","At its core, finance is a matching engine between those two groups.","One side wants yield. The other wants exposure.","The easiest example of this is the real estate market. One person owns the place, another needs housing.","The owner doesn’t have to sell. The renter doesn’t have to buy.","The owner earns yield. The renter gets access or \"Exposure\". The asset is productive.","Now imagine the Goverment would ban renting overnight. Tomorrow morning all real estate owners would rush to quickly sell all their Properties.","An asset that earns nothing just sits there, so why are we holding all these unproductive crypto tokens?","And it gets worse, every year, millions of more unproductive tokens are created.","Most share the same problem: no yield, no cash flow.","So holding becomes hoping someone else buys it later, at a higher price.\n\nThat's why the rest of the world beliefs crypto is just a big scam. ","Most tokens are non-productive.","But wait! Some tokens do offer “staking rewards\".  But often it’s just printing more tokens.","If supply inflates, your ownership gets diluted. That’s not yield.","Yield means someone on the other side pays for access, leverage, or exposure.","Real yield comes from real demand.","This is exactly where Vibe comes in.","Vibe is a marketplace between people who hold an asset and people who want exposure to it.","Long, short, leveraged. Vibe adds the missing lending-and-borrowing layer on top of any token.","For the first time in web3 we solved the simple most basic financial need.\nYield for holders. Exposure for traders.","Ok there is one catch: with low-cap tokens, you can’t just hand them to a stranger and hope he returns.","So Vibe doesn’t copy the old lending model. It makes it synthetic.","Holders deposit into a vault. Traders trade the price, long or short, with leverage — never touching the tokens.","Trader fees flow to the vault. The vault pays holders yield. That’s the whole transaction.\n\n... and the best thing, holders do not need to deposit any stablecoins.","Vibe enables, Long. Short. Leverage. Yield.\n\nOn any asset.","I hope after watching this video everyone understands. Buying and selling are only one side of finance. The other side: lending, borrowing, yield, exposure.","That’s what turns a passive asset into a productive one.","Vibe brings that missing primitive on-chain,  so every asset can become productive."],
  "speed": 1
}/*EDITMODE-END*/;

// The user's ElevenLabs-generated soundtrack (used when Groove = soundtrack).
const VIBE_TRACK_URL = (window.__resources && window.__resources.vibeTrack)
  || 'assets/audio/Optimized_Ledger_Beats_2026-06-11T150814.mp3';

// Full voiceover as a caption track — [start, end, text] in seconds.
const VIBE_CAPTIONS = [
  // S1 — Hook
  { t: 0.5, t2: 4.6, text: 'When people think about markets, they think of one thing: buying and selling.' },
  { t: 4.9, t2: 8.6, text: 'You buy. Maybe it goes up. You sell it to someone else. Simple, right?' },
  { t: 9.0, t2: 13.0, text: 'Buying and selling are the most visible part of every market — but they’re not the whole market.' },
  { t: 13.4, t2: 17.9, text: 'The real economy doesn’t run on flipping things. It runs on credit: lending and borrowing.' },
  { t: 18.4, t2: 23.4, text: 'Finance is not just buying and selling.' },
  // S2 — Crypto today
  { t: 24.5, t2: 28.8, text: 'In crypto, we’re already great at buying and selling.' },
  { t: 29.2, t2: 33.8, text: 'A token launches, a pool appears, the price goes up and down. That’s the spot market.' },
  { t: 34.4, t2: 39.2, text: 'But once you own a lot of an asset… what can you actually do with it?' },
  { t: 39.6, t2: 43.4, text: 'Hold it. Hope. Sell it later. That’s a very one-sided market.' },
  { t: 43.8, t2: 47.4, text: 'Buy. Hold. Hope.' },
  // S3 — The real economy
  { t: 48.5, t2: 52.4, text: 'Now think about the normal economy for a second.' },
  { t: 52.8, t2: 57.6, text: 'One side holds assets: banks, bondholders, landlords, funds.' },
  { t: 58.0, t2: 61.8, text: 'The other side wants access: capital, leverage, exposure.' },
  { t: 62.2, t2: 66.0, text: 'At its core, finance is a matching engine between those two groups.' },
  { t: 66.3, t2: 71.4, text: 'One side wants yield. The other wants exposure.' },
  // S4 — Real estate
  { t: 72.5, t2: 76.6, text: 'The easiest example is real estate: one person owns the place, another needs housing.' },
  { t: 77.0, t2: 81.6, text: 'The owner doesn’t have to sell. The renter doesn’t have to buy.' },
  { t: 82.0, t2: 86.8, text: 'The owner earns yield. The renter gets access. The asset is productive.' },
  { t: 87.2, t2: 92.2, text: 'Now ban renting — and a huge amount of the reason to own disappears overnight.' },
  { t: 92.6, t2: 97.4, text: 'An asset that earns nothing just sits there.' },
  // S5 — Conveyor
  { t: 98.5, t2: 102.6, text: 'Every year, millions of new tokens are created.' },
  { t: 103.0, t2: 107.6, text: 'Most share the same problem: no yield, no cash flow — not productive.' },
  { t: 108.0, t2: 113.2, text: 'So holding becomes hoping someone else buys it later, at a higher price.' },
  { t: 114.0, t2: 117.5, text: 'Most tokens are non-productive.' },
  // S6 — Fake vs real yield
  { t: 118.5, t2: 123.2, text: 'Some tokens do offer “yield” — but often it’s just printing more tokens.' },
  { t: 123.6, t2: 128.2, text: 'If supply inflates, your ownership gets diluted. That’s not real yield.' },
  { t: 128.6, t2: 134.2, text: 'Real yield means someone on the other side pays for access, leverage, or exposure.' },
  { t: 136.8, t2: 141.4, text: 'Real yield comes from real demand.' },
  // S7 — The Vibe idea
  { t: 142.5, t2: 146.0, text: 'This is where Vibe comes in.' },
  { t: 146.4, t2: 151.8, text: 'Vibe is a marketplace between people who hold an asset and people who want exposure to it.' },
  { t: 152.2, t2: 158.0, text: 'Long, short, leveraged — Vibe adds the missing lending-and-borrowing layer on top of any token.' },
  { t: 159.8, t2: 165.4, text: 'Yield for holders. Exposure for traders.' },
  // S8 — Synthetic exposure
  { t: 166.5, t2: 171.2, text: 'One catch: with low-cap tokens, you can’t just hand them to a stranger and hope.' },
  { t: 171.6, t2: 176.0, text: 'So Vibe doesn’t copy the old lending model. It makes it synthetic.' },
  { t: 176.4, t2: 182.2, text: 'Holders deposit into a vault. Traders trade the price — long or short, with leverage — never touching the tokens.' },
  { t: 182.6, t2: 187.4, text: 'Trader fees flow to the vault. The vault pays holders yield. That’s the whole transaction.' },
  { t: 187.7, t2: 191.4, text: 'Long. Short. Leverage. Yield on any asset.' },
  // S9 — Closing
  { t: 192.5, t2: 197.4, text: 'Buying and selling are only one side of finance. The other side: lending, borrowing, yield, exposure.' },
  { t: 197.8, t2: 202.6, text: 'That’s what turns a passive asset into a productive one.' },
  { t: 203.0, t2: 208.0, text: 'Vibe brings that missing primitive on-chain — so every asset can become productive.' },
];

// S0 title card length (scene-clock seconds). S1–S9 are shifted later by this
// via <TimeShift>; captions/voiceover cues shift by INTRO_SCENE * SLIDE_SLOW.
const INTRO_SCENE = 6;

// S0 narration — cues are REAL timeline seconds (the intro is not shifted or
// slowed like S1–S9). Line 2 lands with the on-screen punchline (~5.9s real).
const INTRO_CAPTIONS = [
  { t: 0.6, t2: 5.0, text: 'The Trojan Horse go-to-market. In such a saturated perp dex market, how will Vibe attract new users?' },
  { t: 5.7, t2: 7.7, text: 'Very simple. Vibe is not a perp dex — it\u2019s a permissionless credit engine.' },
];

const VIBE_SCENE_NAMES = [
  [0, 'S0 · title card'],
  [INTRO_SCENE + 0, 'S1 · the two buttons'], [INTRO_SCENE + 24, 'S2 · crypto today'],
  [INTRO_SCENE + 48, 'S3 · the real economy'], [INTRO_SCENE + 72, 'S4 · real estate'],
  [INTRO_SCENE + 98, 'S5 · token conveyor'], [INTRO_SCENE + 118, 'S6 · fake vs real yield'],
  [INTRO_SCENE + 142, 'S7 · the Vibe idea'], [INTRO_SCENE + 166, 'S8 · synthetic exposure'],
  [INTRO_SCENE + 192, 'S9 · closing'],
];

// Chapter markers (real timeline seconds) — the playback bar only allows
// jumping to these clean scene starts, so the voiceover always re-arms cleanly.
const VIBE_CHAPTERS = VIBE_SCENE_NAMES.map((s) => ({
  t: Math.round(s[0] * 1.3 * 10) / 10, label: s[1],
}));

// Slides run 30% slower than the narration clock: the scene timeline is
// stretched by SLIDE_SLOW (total runtime 212s → ~276s) while each caption /
// voiceover line keeps its original start cue (scaled) and reading duration —
// only the pauses between lines grow.
const SLIDE_SLOW = 1.3;
const VIBE_DURATION = Math.ceil((212 + INTRO_SCENE) * SLIDE_SLOW);
const VIBE_CAPTIONS_REAL = INTRO_CAPTIONS.concat(VIBE_CAPTIONS.map((c) => ({
  ...c,
  t: Math.round((c.t + INTRO_SCENE) * SLIDE_SLOW * 10) / 10,
  t2: Math.round(((c.t + INTRO_SCENE) * SLIDE_SLOW + (c.t2 - c.t)) * 10) / 10,
})));

// Persistent brand mark: white duck on an accent circle, pinned to the
// top-right corner of the canvas on every frame (visible in recordings too).
function CornerDuck() {
  return (
    <div style={{
      position: 'absolute', top: 34, right: 38, width: 96, height: 96,
      borderRadius: '50%', background: 'var(--accent)',
      boxShadow: '0 0 0 7px var(--accent-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 5,
    }}>
      <img src={(window.__resources && window.__resources.vibeDuck) || 'assets/images/vibe-duck.svg'}
        alt="" style={{ width: '62%', height: '62%' }}></img>
    </div>
  );
}

function VibeMovie({ items, captionsOn, voiceoverOn, voice, speed, engine, elVoice, elKey,
  musicOn, musicStyle, musicVol, narrOffset, muted = false, volume = 1, admin = false }) {
  const t = useTime();
  const narrFile = useNarrationFile();
  const elCached = useElCachedCount(items, elVoiceId(elVoice));
  const st = t / SLIDE_SLOW; // scene-local clock (slides run 30% slower)
  const scene = VIBE_SCENE_NAMES.filter((s) => st >= s[0]).pop();
  return (
    <div data-screen-label={`${Math.floor(t)}s · ${scene ? scene[1] : ''}`}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <TimeScale factor={SLIDE_SLOW}>
        <SceneIntro></SceneIntro>
        <TimeShift offset={INTRO_SCENE}>
          <Scene1></Scene1>
          <Scene2></Scene2>
          <Scene3></Scene3>
          <Scene4></Scene4>
          <Scene5></Scene5>
          <Scene6></Scene6>
          <Scene7></Scene7>
          <Scene8></Scene8>
          <Scene9></Scene9>
        </TimeShift>
      </TimeScale>
      <CornerDuck></CornerDuck>
      <Captions items={items} visible={captionsOn}></Captions>
      <BackgroundMusic items={items} enabled={musicOn && !muted} volume={musicVol * volume}
        style={musicStyle} trackUrl={VIBE_TRACK_URL} duckEnabled={voiceoverOn}></BackgroundMusic>
      {admin && voiceoverOn && ((engine === 'elevenlabs' && !elKey && elCached === 0) || (engine === 'mp3 file' && !narrFile)) && (
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,21,30,0.78)', color: 'rgba(255,255,255,0.9)',
          font: "600 22px 'Nunito', sans-serif", padding: '10px 22px', borderRadius: 999,
          pointerEvents: 'none' }}>
          {engine === 'mp3 file'
            ? 'Narration muted — import your narration MP3 in Console → Narrator'
            : 'Narration not set up — add an ElevenLabs key or import a clips ZIP in Console → Narrator'}
        </div>
      )}
      {engine === 'mp3 file' ? (
        <FileVoiceOver enabled={voiceoverOn} rate={speed} offset={narrOffset}
          muted={muted} volume={volume}></FileVoiceOver>
      ) : engine === 'elevenlabs' ? (
        <ElevenLabsVoiceOver items={items} enabled={voiceoverOn} apiKey={elKey}
          voiceLabel={elVoice} rate={speed} muted={muted} volume={volume}></ElevenLabsVoiceOver>
      ) : (
        <VoiceOver items={items} enabled={voiceoverOn} rate={speed} voiceName={voice}
          muted={muted} volume={volume}></VoiceOver>
      )}
    </div>
  );
}

const VIBE_TRANSCRIPT_KEY = 'vibe-transcript-edits-v3'; // v3: line count changed (intro narration added)
const VIBE_TRANSCRIPT_SAVED_KEY = 'vibe-transcript-saved-v3'; // baseline of the last explicit "Save transcript"

// Small always-available corner controls: open the transcript panel and the
// Tweaks console without needing the host toolbar toggle.
function CornerControls({ transcriptOn, onTranscript, hidden, children }) {
  const openConsole = () => window.postMessage({ type: '__activate_edit_mode' }, '*');
  const btn = (active) => ({
    appearance: 'none', border: '1px solid rgba(255,255,255,0.22)',
    background: active ? 'rgba(255,255,255,0.92)' : 'rgba(20,21,30,0.72)',
    color: active ? '#1c1e2a' : 'rgba(255,255,255,0.85)',
    font: "600 12px 'Nunito', sans-serif", letterSpacing: '0.02em',
    padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  });
  return (
    <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 60,
      display: hidden ? 'none' : 'flex', gap: 8 }}>
      {children}
      <button style={btn(transcriptOn)} onClick={() => onTranscript(!transcriptOn)}>Transcript</button>
      <button style={btn(false)} onClick={openConsole}>Console</button>
    </div>
  );
}

// ── Embed mode ───────────────────────────────────────────────────────────────
// ?embed=1 turns the page into a chrome-less autoplaying video for iframes
// (interactive pitch decks etc.): no playback bar, no scrollbars, always
// starts at 0, and posts { type: 'vibe-explainer-ended' } to the parent
// window exactly once when playback fully completes.
const VIBE_EMBED = (() => {
  try { return new URLSearchParams(window.location.search).get('embed') === '1'; }
  catch { return false; }
})();

// Can this frame play audible media right now? The host iframe is expected to
// grant allow="autoplay" (→ a fresh AudioContext starts 'running'); if the
// browser still blocks audio, we start muted and overlay a tap-for-sound
// button instead of a play gate.
async function vibeProbeAudioAllowed() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    try { await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 300))]); } catch {}
    const ok = ctx.state === 'running';
    try { ctx.close(); } catch {}
    return ok;
  } catch { return false; }
}

// ── Admin access ─────────────────────────────────────────────────────────────
// Viewers get play/stop + mute only. Opening the page with ?admin (or ?=admin)
// asks for the password below; success unlocks the full toolset (record,
// transcript, console, scene skipping) for the rest of the browser session.
const VIBE_ADMIN_PASSWORD = 'vibe2026';
const VIBE_ADMIN_SESSION_KEY = 'vibe-admin-ok';

function adminRequested() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.has('admin')) return true;             // ?admin / ?admin=1
    for (const [k, v] of p) {
      if (k === 'admin' || v === 'admin') return true; // ?=admin / ?mode=admin
    }
  } catch {}
  return false;
}

function AdminLogin({ onSuccess, onCancel }) {
  const [pw, setPw] = React.useState('');
  const [error, setError] = React.useState(false);
  const submit = () => {
    if (pw === VIBE_ADMIN_PASSWORD) {
      try { sessionStorage.setItem(VIBE_ADMIN_SESSION_KEY, '1'); } catch {}
      onSuccess();
    } else {
      setError(true);
      setPw('');
    }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(8,9,14,0.86)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 360, color: '#f6f4ef',
        font: "15px/1.6 'Nunito', system-ui, sans-serif",
        background: '#16181f', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 14, padding: '26px 30px' }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Admin login</div>
        <div style={{ fontSize: 13, color: 'rgba(246,244,239,0.6)', marginBottom: 16 }}>
          Enter the admin password to unlock recording, transcript and console.
        </div>
        <input type="password" value={pw} autoFocus placeholder="Password"
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            borderRadius: 8, outline: 'none',
            border: `1px solid ${error ? '#e05252' : 'rgba(255,255,255,0.18)'}`,
            background: 'rgba(255,255,255,0.06)', color: '#f6f4ef',
            font: "600 14px 'Nunito', sans-serif" }}></input>
        {error && (
          <div style={{ marginTop: 8, fontSize: 12.5, color: '#e05252' }}>
            Wrong password — try again.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={submit}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(95,135,255,0.92)', color: '#fff',
              font: "700 13.5px 'Nunito', sans-serif" }}>Log in</button>
          <button onClick={onCancel}
            style={{ padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
              color: 'rgba(246,244,239,0.8)',
              font: "600 13.5px 'Nunito', sans-serif" }}>Continue as viewer</button>
        </div>
      </div>
    </div>
  );
}

function VibeApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // 'viewer' | 'login' | 'admin'
  const [access, setAccess] = React.useState(() => {
    if (!adminRequested()) return 'viewer';
    try {
      if (sessionStorage.getItem(VIBE_ADMIN_SESSION_KEY) === '1') return 'admin';
    } catch {}
    return 'login';
  });
  const admin = access === 'admin';
  // Embed: start muted until the audio probe decides — if audible playback is
  // allowed we unmute right away (before the first narration cue at ~0.6s);
  // if blocked we keep playing muted and show the tap-for-sound overlay.
  const [muted, setMuted] = React.useState(VIBE_EMBED);
  const [needsTap, setNeedsTap] = React.useState(false);
  React.useEffect(() => {
    if (!VIBE_EMBED) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    let alive = true;
    vibeProbeAudioAllowed().then((ok) => {
      if (!alive) return;
      if (ok) setMuted(false);
      else setNeedsTap(true);
    });
    return () => { alive = false; };
  }, []);
  const embedEnded = React.useCallback(() => {
    try { window.parent.postMessage({ type: 'vibe-explainer-ended' }, '*'); } catch {}
  }, []);
  // Master volume 0–100 (narration + music), persisted per browser.
  const [volume, setVolume] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem('vibe-volume'));
      if (isFinite(v)) return Math.max(0, Math.min(100, v));
    } catch {}
    return 100;
  });
  React.useEffect(() => {
    try { localStorage.setItem('vibe-volume', String(volume)); } catch {}
  }, [volume]);
  const [elKey, setElKey] = useElApiKey();
  const [recMode, setRecMode] = React.useState(false);
  const voices = useVoices();
  const voiceOptions = ['auto'].concat(
    voices.filter((v) => v.lang && v.lang.startsWith('en')).map((v) => v.name).slice(0, 10)
  );
  // Transcript text: project-saved script (tweak) → browser draft → original.
  const applyTexts = (arr) => VIBE_CAPTIONS_REAL.map((c, i) =>
    arr && typeof arr[i] === 'string' ? { ...c, text: arr[i] } : c);
  const [items, setItems] = React.useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(VIBE_TRANSCRIPT_KEY) || 'null');
      if (Array.isArray(draft)) return applyTexts(draft);
    } catch {}
    return applyTexts(TWEAK_DEFAULTS.script);
  });
  const editLine = (idx, text) => {
    setItems((prev) => {
      const next = prev.map((c, i) => (i === idx ? { ...c, text } : c));
      try { localStorage.setItem(VIBE_TRANSCRIPT_KEY, JSON.stringify(next.map((c) => c.text))); } catch {}
      return next;
    });
  };
  // Baseline of the last explicit "Save transcript", persisted per browser.
  // On the deployed site there is no host that can write project files, so
  // the button's real job is recording this baseline (the dirty flag compares
  // against it). Publishing to visitors = replacing assets/transcript.json.
  const [savedBaseline, setSavedBaseline] = React.useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(VIBE_TRANSCRIPT_SAVED_KEY) || 'null');
      return Array.isArray(v) ? v : null;
    } catch { return null; }
  });
  const resetTranscript = () => {
    try {
      localStorage.removeItem(VIBE_TRANSCRIPT_KEY);
      localStorage.removeItem(VIBE_TRANSCRIPT_SAVED_KEY);
    } catch {}
    setSavedBaseline(null);
    setTweak('script', null);
    setItems(pubTexts ? applyTexts(pubTexts) : VIBE_CAPTIONS_REAL);
  };
  // Record the saved baseline; also commit into the project file when running
  // inside the local editor host (that write silently no-ops elsewhere). We
  // deliberately KEEP the localStorage draft as a belt-and-braces copy.
  const saveTranscript = () => {
    const texts = items.map((c) => c.text);
    setTweak('script', texts);
    setSavedBaseline(texts);
    try { localStorage.setItem(VIBE_TRANSCRIPT_SAVED_KEY, JSON.stringify(texts)); } catch {}
  };
  // Download the transcript as a real JSON file — a backup nothing can touch.
  const exportTranscript = () => {
    const data = {
      format: 'vibe-transcript', version: 1, savedAt: new Date().toISOString(),
      lines: items.map((c) => ({ t: c.t, t2: c.t2, text: c.text })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vibe-transcript.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  // Import a previously exported JSON (array of strings, array of {text}, or
  // { lines: [...] }). Applies by line index and saves the draft immediately.
  const importTranscript = (parsed) => {
    const arr = Array.isArray(parsed) ? parsed
      : parsed && Array.isArray(parsed.lines) ? parsed.lines : null;
    if (!arr) return false;
    const texts = arr.map((l) => (typeof l === 'string' ? l
      : l && typeof l.text === 'string' ? l.text : null));
    setItems((prev) => {
      const next = prev.map((c, i) => (typeof texts[i] === 'string' ? { ...c, text: texts[i] } : c));
      try { localStorage.setItem(VIBE_TRANSCRIPT_KEY, JSON.stringify(next.map((c) => c.text))); } catch {}
      return next;
    });
    return true;
  };
  // Published baseline: 'assets/transcript.json' ships with every deploy and
  // is the script a fresh visitor should see. A local browser draft (the
  // admin's in-progress edits) still wins. Applying the baseline does NOT
  // write a draft — so the next deploy's transcript takes effect on reload.
  const [pubTexts, setPubTexts] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const pub = await vibeFetchPublishedTranscript();
      let texts = null;
      if (pub) {
        texts = pub.lines.map((l) => (l && typeof l.text === 'string' ? l.text : null));
        if (alive) setPubTexts(texts);
      }
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem(VIBE_TRANSCRIPT_KEY) || 'null'); } catch {}
      let current;
      if (Array.isArray(draft)) current = applyTexts(draft);
      else if (texts) current = applyTexts(texts);
      else current = applyTexts(TWEAK_DEFAULTS.script);
      if (alive && !Array.isArray(draft) && texts) setItems(current);
      // Then fill the narration clip cache from 'assets/narration-clips.zip'
      // (skipped when every line is already cached in IndexedDB).
      await vibeAutoloadClips(current, elVoiceId(TWEAK_DEFAULTS.elVoice));
    })();
    return () => { alive = false; };
  }, []);
  const savedTexts = Array.isArray(t.script) ? t.script : null;
  // "Dirty" = differs from the last explicit save (or, before any save, from
  // what a fresh visitor would load): saved baseline → published transcript →
  // project-saved script → original captions.
  const transcriptDirty = items.some((c, i) => c.text !== (
    savedBaseline && typeof savedBaseline[i] === 'string' ? savedBaseline[i]
      : pubTexts && typeof pubTexts[i] === 'string' ? pubTexts[i]
      : savedTexts && typeof savedTexts[i] === 'string' ? savedTexts[i]
      : VIBE_CAPTIONS_REAL[i].text
  ));
  // Bridge: current caption index + seek fn, lifted out of the Stage.
  const tlRef = React.useRef(null);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const activeIdxRef = React.useRef(-1);
  const onTlCtx = React.useCallback((ctx) => {
    tlRef.current = ctx;
    window.__vibeTl = ctx; // dev/verifier hook: seek via __vibeTl.setTime(s)
    const time = ctx.time;
    let idx = -1;
    for (let i = 0; i < VIBE_CAPTIONS_REAL.length; i++) {
      if (time >= VIBE_CAPTIONS_REAL[i].t && time < VIBE_CAPTIONS_REAL[i].t2) { idx = i; break; }
      if (time >= VIBE_CAPTIONS_REAL[i].t) idx = i;
    }
    if (idx !== activeIdxRef.current) { activeIdxRef.current = idx; setActiveIdx(idx); }
  }, []);
  const seekTo = (sec) => {
    // Land slightly BEFORE the line's start so the playhead crosses it and the
    // voiceover actually re-triggers (it only fires on a forward crossing).
    if (tlRef.current) tlRef.current.setTime(Math.max(0, sec - 0.2));
  };
  const hand = t.typography === 'handwritten';
  // Highlight text components read this live (they re-render every frame).
  window.__vibeWriteSpeed = t.writeSpeed || 1;
  const vars = {
    '--accent': t.accent,
    '--accent-soft': `color-mix(in oklab, ${t.accent} 14%, white)`,
    '--ink': '#1c1e2a',
    '--ink-soft': '#9094a8',
    '--paper': '#f3f3f6',
    '--paper2': '#ffffff',
    '--good': '#2a9d63',
    '--good-soft': 'color-mix(in oklab, #2a9d63 18%, white)',
    '--bad': '#e05252',
    '--bad-soft': 'color-mix(in oklab, #e05252 15%, white)',
    '--caption-bg': 'rgba(255,255,255,0.94)',
    '--font-display': hand ? "'Caveat', cursive" : "'Nunito', sans-serif",
    '--font-hand': hand ? "'Patrick Hand', cursive" : "'Nunito', sans-serif",
    '--font-brand': "'Nunito', sans-serif",
  };
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#0a0a0a', ...vars }}>
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Stage width={1920} height={1080} duration={VIBE_DURATION} background="var(--paper)"
          speed={t.speed} autoplay={VIBE_EMBED} persistKey="vibe-explainer"
          chapters={VIBE_CHAPTERS} bar={!recMode && !VIBE_EMBED} loop={false}
          simple={!admin} muted={muted} onMute={setMuted}
          volume={volume} onVolume={setVolume}
          resume={!VIBE_EMBED} onEnded={VIBE_EMBED ? embedEnded : null}>
          <VibeMovie items={items} captionsOn={t.captions} voiceoverOn={t.voiceover}
            voice={t.voice} speed={t.speed} engine={t.engine} elVoice={t.elVoice}
            elKey={elKey} musicOn={t.music} musicStyle={t.musicStyle}
            musicVol={t.musicVol} narrOffset={t.narrOffset || 0}
            muted={muted} volume={volume / 100} admin={admin}></VibeMovie>
          <TimelineBridge onCtx={onTlCtx}></TimelineBridge>
        </Stage>
        {admin && !VIBE_EMBED && (
          <CornerControls transcriptOn={t.transcript} hidden={recMode}
            onTranscript={(v) => setTweak('transcript', v)}>
            <VideoExport tlRef={tlRef} recording={recMode} setRecording={setRecMode}
              engine={t.engine}></VideoExport>
          </CornerControls>
        )}
        {VIBE_EMBED && needsTap && (
          <button onClick={() => { setMuted(false); setNeedsTap(false); }}
            style={{ position: 'absolute', left: '50%', bottom: '9%',
              transform: 'translateX(-50%)', zIndex: 90,
              padding: '14px 30px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer', background: 'rgba(20,21,30,0.88)', color: '#fff',
              font: "700 18px 'Nunito', system-ui, sans-serif", letterSpacing: '0.01em',
              boxShadow: '0 8px 28px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
            🔊 Tap for sound
          </button>
        )}
      </div>
      {access === 'login' && (
        <AdminLogin onSuccess={() => setAccess('admin')}
          onCancel={() => setAccess('viewer')}></AdminLogin>
      )}
      {admin && t.transcript && !recMode && (
        <TranscriptPanel items={items} activeIdx={activeIdx}
          onEdit={editLine} onSeek={seekTo} onReset={resetTranscript}
          onSave={saveTranscript} onExport={exportTranscript}
          onImport={importTranscript} dirty={transcriptDirty}></TranscriptPanel>
      )}
      {admin && (
      <TweaksPanel>
        <TweakSection label="Look"></TweakSection>
        <TweakColor label="Accent" value={t.accent}
          options={['#2B5CE6', '#7A5AE0', '#0FA678', '#E0762E']}
          onChange={(v) => setTweak('accent', v)}></TweakColor>
        <TweakRadio label="Typography" value={t.typography}
          options={['handwritten', 'clean']}
          onChange={(v) => setTweak('typography', v)}></TweakRadio>
        <TweakSlider label="Text write speed" value={t.writeSpeed} min={0.2} max={2} step={0.1} unit="×"
          onChange={(v) => setTweak('writeSpeed', v)}></TweakSlider>
        <TweakSection label="Playback"></TweakSection>
        <TweakToggle label="Captions" value={t.captions}
          onChange={(v) => setTweak('captions', v)}></TweakToggle>
        <TweakToggle label="Voiceover" value={t.voiceover}
          onChange={(v) => setTweak('voiceover', v)}></TweakToggle>
        <TweakToggle label="Transcript panel" value={t.transcript}
          onChange={(v) => setTweak('transcript', v)}></TweakToggle>
        <TweakSection label="Music"></TweakSection>
        <TweakToggle label="Background music" value={t.music}
          onChange={(v) => setTweak('music', v)}></TweakToggle>
        <TweakSelect label="Groove" value={t.musicStyle}
          options={['soundtrack', 'synthwave', 'funky', 'mellow']}
          onChange={(v) => setTweak('musicStyle', v)}></TweakSelect>
        <TweakSlider label="Music volume" value={t.musicVol} min={0} max={1} step={0.05}
          onChange={(v) => setTweak('musicVol', v)}></TweakSlider>
        <TweakSection label="Narrator"></TweakSection>
        <TweakRadio label="Engine" value={t.engine} options={['browser', 'elevenlabs', 'mp3 file']}
          onChange={(v) => setTweak('engine', v)}></TweakRadio>
        {t.engine === 'elevenlabs' ? (
          <>
            <TweakSelect label="Voice" value={t.elVoice}
              options={EL_VOICES.map((v) => v.label)}
              onChange={(v) => setTweak('elVoice', v)}></TweakSelect>
            <ELNarrationControls items={items} voiceLabel={t.elVoice}
              apiKey={elKey} setApiKey={setElKey}></ELNarrationControls>
          </>
        ) : t.engine === 'mp3 file' ? (
          <>
            <FileNarrationControls></FileNarrationControls>
            <TweakSlider label="Narration offset" value={t.narrOffset || 0}
              min={-5} max={5} step={0.1} unit="s"
              onChange={(v) => setTweak('narrOffset', v)}></TweakSlider>
          </>
        ) : (
          <TweakSelect label="Voice" value={t.voice} options={voiceOptions}
            onChange={(v) => setTweak('voice', v)}></TweakSelect>
        )}
        <TweakSlider label="Speed" value={t.speed} min={0.5} max={2} step={0.25} unit="×"
          onChange={(v) => setTweak('speed', v)}></TweakSlider>
      </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VibeApp></VibeApp>);
