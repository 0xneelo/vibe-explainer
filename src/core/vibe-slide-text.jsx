// vibe-slide-text.jsx — central registry + editor panel for the on-screen
// slide text (S0–S9). Every human-readable string in the scene files resolves
// through ST(key); the admin "Slides" panel edits them without touching code.
//
// Text resolution (same layering as the transcript): localStorage draft →
// published assets/slide-text.json → the code defaults below. Editing writes
// the draft immediately; "Save" records a saved-baseline (dirty tracking);
// publishing = Download .json → save as assets/slide-text.json → push.
//
// The defaults block between the ST-DEFAULTS markers is strict JSON —
// scripts/build.py extracts it to validate assets/slide-text.json, and
// scripts/gen-slide-text.py regenerates the published file from it.
// Keys are stable scene.element identifiers, NEVER derived from the text.

const VIBE_SLIDE_TEXT_FORMAT = 'vibe-slide-text';
const VIBE_SLIDE_TEXT_DRAFT_KEY = 'vibe-slide-text-edits-v1';
const VIBE_SLIDE_TEXT_SAVED_KEY = 'vibe-slide-text-saved-v1';

const VIBE_SLIDE_TEXT_DEFAULTS = /*ST-DEFAULTS-BEGIN*/{
  "s0.title": "The Permissionless Credit Layer",
  "s0.sub": "Orderbooks scale markets. Vibe Trading helps discover which assets deserve leverage.",
  "s0.accent": "But why is credit the missing piece?",
  "s0.badge1.pre": "Perps by",
  "s0.badge1.accent": "Hyperliquid",
  "s0.badge2.pre": "Credit by",
  "s0.badge2.accent": "Symmio",
  "s0.wordmark": "Vibe",
  "s0.wordmark.sub": "Trading",

  "s1.btn.buy": "BUY",
  "s1.title": "Markets = two buttons… right?",
  "s1.btn.sell": "SELL",
  "s1.chart.repeat": "…and repeat?",
  "s1.btn.lendborrow": "LEND / BORROW",
  "s1.highlight": "Finance is *not just* buying and selling.",

  "s2.title": "Spot Markets, crypto’s entire financial system:",
  "s2.pool.title": "SPOT MARKET",
  "s2.pool.sub": "(a pool on a DEX)",
  "s2.chart.note": "up, down, sideways…",
  "s2.nowwhat": "Now what?",
  "s2.options": "your options:",
  "s2.btn.hold": "HOLD",
  "s2.btn.pray": "PRAY",
  "s2.btn.tweet": "TWEET",
  "s2.btn.dump": "DUMP LATER",
  "s2.highlight": "All crypto enables us is to Buy. Hold. *Hope.*",

  "s3.holders.title": "ASSET HOLDERS",
  "s3.holders.sub": "banks · landlords · funds · holders",
  "s3.seekers.title": "EXPOSURE SEEKERS",
  "s3.seekers.sub": "home buyers · companies · traders",
  "s3.title": "Finance = a matching engine",
  "s3.label.yield": "← YIELD",
  "s3.label.exposure": "EXPOSURE →",
  "s3.highlight": "One side wants *yield.* The other wants *exposure.*",

  "s4.title": "The oldest yield market on earth",
  "s4.owner": "OWNER",
  "s4.renter": "RENTER",
  "s4.label.rent": "← RENT (yield)",
  "s4.label.access": "ACCESS (a home) →",
  "s4.ban": "RENTING BANNED",
  "s4.value": "value?",
  "s4.noincome": "no income → way less reason to own it",
  "s4.highlight": "An asset that earns nothing just *sits there.*",

  "s5.title": "Millions of tokens / year",
  "s5.printer.l1": "TOKEN",
  "s5.printer.l2": "PRINTER",
  "s5.printer.sub": "(open 24/7)",
  "s5.tokens": "DOG, CAT, AI, MEME, GAME, DAO, DOG2, PEPE, MOON, CHAD",
  "s5.box.title": "NO YIELD",
  "s5.box.sub": "99% of tokens",
  "s5.productive.l1": "productive",
  "s5.productive.l2": "assets",
  "s5.bubble": "“Trust me bro, future utility.”",
  "s5.highlight": "99% of tokens are *non-productive.*",

  "s6.title": "“Yield” ≠ yield",
  "s6.machine1.l1": "INFLATION",
  "s6.machine1.l2": "MACHINE",
  "s6.more": "more tokens…",
  "s6.share": "your share",
  "s6.left": "printing tokens = diluting you",
  "s6.machine2.l1": "REAL DEMAND",
  "s6.machine2.l2": "MACHINE",
  "s6.trader": "TRADER",
  "s6.holder": "HOLDER",
  "s6.flow.fee": "fee",
  "s6.right": "someone PAYS for exposure",
  "s6.highlight": "Real yield comes from *real demand.*",

  "s7.brand": "Vibe",
  "s7.bubble.holder": "“I hold this asset. I want yield.”",
  "s7.bubble.trader": "“I want exposure. Long. Short. Leveraged.”",
  "s7.title": "a marketplace between the two",
  "s7.flow.fee": "fee",
  "s7.label.yield": "yield ↓",
  "s7.label.exposure": "exposure ↓",
  "s7.highlight": "*Yield* for holders. *Exposure* for traders.",

  "s8.naive.title": "Can’t we just… lend it out?",
  "s8.naive.gone": "gone.",
  "s8.token": "DOG",
  "s8.title": "So Vibe makes it synthetic",
  "s8.vault.title": "Token Vaults",
  "s8.vault.sub": "(no stablecoins needed)",
  "s8.vault.note": "tokens never transfer to traders, physically",
  "s8.holder": "HOLDER",
  "s8.price": "the price",
  "s8.btn.long": "LONG 20x",
  "s8.btn.short": "SHORT 20x",
  "s8.trader": "TRADER",
  "s8.solver": "SOLVER",
  "s8.solver.sub": "(protocol-operated)",
  "s8.bubble.solver": "“I manage the vault & quote the market.”",
  "s8.flow.fee": "fee",
  "s8.label.fees": "← fees",
  "s8.label.yield": "← yield",
  "s8.highlight": "Long. Short. Leverage. *Yield on ANY asset.*",

  "s9.btn.buy": "BUY",
  "s9.btn.sell": "SELL",
  "s9.btn.lendborrow": "LEND / BORROW",
  "s9.complete": "a complete market",
  "s9.brand": "Vibe",
  "s9.tagline": "Making every asset productive.",
  "s9.disclaimer": "Trade carefully. Leverage involves risk. Not financial advice."
}/*ST-DEFAULTS-END*/;

// ── Store: draft (localStorage) → published (assets/slide-text.json) → default
function __stReadMap(storageKey) {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

const __stStore = {
  published: null,                              // texts map from the deploy
  draft: __stReadMap(VIBE_SLIDE_TEXT_DRAFT_KEY),
  saved: __stReadMap(VIBE_SLIDE_TEXT_SAVED_KEY), // baseline of the last "Save"
  version: 0,
  listeners: new Set(),
};

function stNotify() {
  __stStore.version++;
  __stStore.listeners.forEach((fn) => { try { fn(); } catch {} });
}
function stSubscribe(fn) {
  __stStore.listeners.add(fn);
  return () => __stStore.listeners.delete(fn);
}
function stVersion() { return __stStore.version; }

// Current text for a key. Unknown keys echo the key itself (visible bug, not a crash).
function ST(key) {
  const { draft, published } = __stStore;
  if (draft && typeof draft[key] === 'string') return draft[key];
  if (published && typeof published[key] === 'string') return published[key];
  const def = VIBE_SLIDE_TEXT_DEFAULTS[key];
  return typeof def === 'string' ? def : key;
}

// What a fresh visitor would see (or the last explicit save) — dirty compares against this.
function stBaseline(key) {
  const { saved, published } = __stStore;
  if (saved && typeof saved[key] === 'string') return saved[key];
  if (published && typeof published[key] === 'string') return published[key];
  return VIBE_SLIDE_TEXT_DEFAULTS[key];
}
function stDirty() {
  return Object.keys(VIBE_SLIDE_TEXT_DEFAULTS).some((k) => ST(k) !== stBaseline(k));
}

function stSetPublished(texts) {
  __stStore.published = texts && typeof texts === 'object' ? texts : null;
  stNotify();
}

// Editing writes the browser draft immediately (it survives reloads unsaved).
function stEdit(key, text) {
  const draft = { ...(__stStore.draft || {}), [key]: String(text) };
  __stStore.draft = draft;
  try { localStorage.setItem(VIBE_SLIDE_TEXT_DRAFT_KEY, JSON.stringify(draft)); } catch {}
  stNotify();
}

// Back to the published baseline (or code defaults if nothing is published).
function stReset() {
  __stStore.draft = null;
  __stStore.saved = null;
  try {
    localStorage.removeItem(VIBE_SLIDE_TEXT_DRAFT_KEY);
    localStorage.removeItem(VIBE_SLIDE_TEXT_SAVED_KEY);
  } catch {}
  stNotify();
}

// Record the saved baseline. There is no host that can write project files on
// the deployed site — like the transcript, "Save" keeps edits in this browser
// and flips the dirty flag; publishing = replacing assets/slide-text.json.
function stSave() {
  const texts = {};
  for (const k of Object.keys(VIBE_SLIDE_TEXT_DEFAULTS)) texts[k] = ST(k);
  __stStore.saved = texts;
  try { localStorage.setItem(VIBE_SLIDE_TEXT_SAVED_KEY, JSON.stringify(texts)); } catch {}
  stNotify();
}

// Full texts map in the published file format (drop-in assets/slide-text.json).
function stExportData() {
  const texts = {};
  for (const k of Object.keys(VIBE_SLIDE_TEXT_DEFAULTS)) texts[k] = ST(k);
  return { format: VIBE_SLIDE_TEXT_FORMAT, version: 1, savedAt: new Date().toISOString(), texts };
}

// Import a previously exported .json ({ texts } or a bare key→string map).
// Only known registry keys apply; becomes the draft immediately.
function stImport(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  const texts = parsed.texts && typeof parsed.texts === 'object' ? parsed.texts : parsed;
  const draft = { ...(__stStore.draft || {}) };
  let any = false;
  for (const k of Object.keys(VIBE_SLIDE_TEXT_DEFAULTS)) {
    if (typeof texts[k] === 'string') { draft[k] = texts[k]; any = true; }
  }
  if (!any) return false;
  __stStore.draft = draft;
  try { localStorage.setItem(VIBE_SLIDE_TEXT_DRAFT_KEY, JSON.stringify(draft)); } catch {}
  stNotify();
  return true;
}

// Re-render hook: components calling this repaint whenever any text changes.
function useSlideTexts() {
  return React.useSyncExternalStore(stSubscribe, stVersion);
}

// ── "Slides" editor panel (admin only) ──────────────────────────────────────
function stFmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// One editable slide text: key label + auto-sizing textarea (TranscriptLine styling).
function SlideTextLine({ k }) {
  useSlideTexts();
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '4px 10px' }}>
      <div title={k} style={{
        flexShrink: 0, width: 92, marginTop: 7, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
        color: 'rgba(246,244,239,0.45)',
        font: '600 10.5px ui-monospace, SFMono-Regular, monospace',
      }}>{k.replace(/^s\d+\./, '')}</div>
      <textarea
        value={ST(k)}
        rows={1}
        data-st-key={k}
        onChange={(e) => stEdit(k, e.target.value)}
        spellCheck={false}
        style={{
          flex: 1, resize: 'vertical', minHeight: 30, fieldSizing: 'content',
          background: 'transparent', color: 'rgba(246,244,239,0.92)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6,
          padding: '5px 8px', font: '13px/1.45 Nunito, system-ui, sans-serif',
          outline: 'none',
        }}></textarea>
    </div>
  );
}

// scenes: [{ id: 's0', label: 'S0 · title card', t: <real timeline seconds> }]
// in timeline order; entries are grouped by key prefix (s0.… → 's0').
function SlideTextPanel({ scenes, onSeek, onReset, dirty }) {
  useSlideTexts();
  const fileRef = React.useRef(null);
  const [importMsg, setImportMsg] = React.useState(null);
  const keys = Object.keys(VIBE_SLIDE_TEXT_DEFAULTS);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(stExportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vibe-slide-text.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  return (
    <div style={{
      width: 390, flexShrink: 0, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#161616', borderLeft: '1px solid rgba(255,255,255,0.09)',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.09)',
        display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ color: '#f6f4ef', fontWeight: 800, fontSize: 15 }}>Slides</div>
        <div style={{ color: 'rgba(246,244,239,0.45)', fontSize: 11.5, flex: 1 }}>
          edit the on-screen frame text
        </div>
        <button onClick={onReset} title="Back to the published slide text"
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(246,244,239,0.6)', borderRadius: 5, padding: '2px 8px',
            fontSize: 11, cursor: 'pointer' }}>reset</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2 }}>
        {scenes.map((sc) => {
          const group = keys.filter((k) => k.split('.')[0] === sc.id);
          if (!group.length) return null;
          return (
            <div key={sc.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px 4px', position: 'sticky', top: -10,
                background: '#161616', zIndex: 1 }}>
                <button onClick={() => onSeek(sc.t)} title="Jump the preview to this scene"
                  style={{
                    flexShrink: 0, padding: '2px 8px',
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(246,244,239,0.75)',
                    border: 'none', borderRadius: 5, cursor: 'pointer',
                    font: '600 11px ui-monospace, SFMono-Regular, monospace',
                  }}>{stFmtTime(sc.t)}</button>
                <div style={{ color: 'rgba(246,244,239,0.8)', fontWeight: 800,
                  fontSize: 12, letterSpacing: '0.03em' }}>{sc.label}</div>
              </div>
              {group.map((k) => <SlideTextLine key={k} k={k}></SlideTextLine>)}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.09)',
        display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={stSave} disabled={!dirty}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 7,
            border: 'none', cursor: dirty ? 'pointer' : 'default',
            background: dirty ? 'rgba(95,135,255,0.92)' : 'rgba(255,255,255,0.07)',
            color: dirty ? '#fff' : 'rgba(246,244,239,0.45)',
            font: "700 13px Nunito, system-ui, sans-serif",
          }}>
          {dirty ? 'Save slides' : 'Slides saved ✓'}
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={exportJson}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(246,244,239,0.8)', font: "600 12px Nunito, system-ui, sans-serif",
            }}>⤓ Download .json</button>
          <button onClick={() => fileRef.current && fileRef.current.click()}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(246,244,239,0.8)', font: "600 12px Nunito, system-ui, sans-serif",
            }}>⤒ Import .json</button>
          <input type="file" accept="application/json,.json" ref={fileRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              e.target.value = '';
              if (!f) return;
              f.text().then((txt) => {
                let ok = false;
                try { ok = stImport(JSON.parse(txt)); } catch {}
                setImportMsg(ok ? 'Slide text imported ✓' : 'Couldn’t read that file — expected a slide-text .json');
                setTimeout(() => setImportMsg(null), 4000);
              });
            }}></input>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(246,244,239,0.45)',
          textAlign: 'center' }}>
          {importMsg ? importMsg
            : dirty ? 'unsaved edits — Save keeps them in this browser'
            : 'to publish: Download .json → save as assets/slide-text.json → push'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VIBE_SLIDE_TEXT_DEFAULTS, ST, useSlideTexts, stDirty, stSetPublished,
  stEdit, stReset, stSave, stImport, stExportData, SlideTextPanel,
});
