// vibe-intro-app.jsx — static workbench for the S0 title-card drawing.
// Renders SceneIntro (the SAME component the video engine uses) frozen at a
// chosen time, scaled to fit the viewport. Edit vibe-scene-intro.jsx and both
// this page and the video update together.

const INTRO_VARS = {
  '--accent': '#2B5CE6',
  '--accent-soft': 'color-mix(in oklab, #2B5CE6 14%, white)',
  '--ink': '#1c1e2a',
  '--ink-soft': '#9094a8',
  '--paper': '#f3f3f6',
  '--paper2': '#ffffff',
  '--good': '#2a9d63',
  '--good-soft': 'color-mix(in oklab, #2a9d63 18%, white)',
  '--bad': '#d64550',
  '--bad-soft': 'color-mix(in oklab, #d64550 18%, white)',
  '--caption-bg': 'rgba(255,255,255,0.94)',
  '--font-display': "'Caveat', cursive",
  '--font-hand': "'Patrick Hand', cursive",
  '--font-brand': "'Nunito', sans-serif",
};

// Fallback SceneWrap (same fade logic as vibe-scenes-a.jsx) in case it's not loaded.
if (!window.SceneWrap) {
  window.SceneWrap = function SceneWrap({ children, label }) {
    const { localTime, duration } = useSprite();
    const o = Math.min(clamp(localTime / 0.35, 0, 1), clamp((duration - localTime) / 0.3, 0, 1));
    return (
      <div data-screen-label={label} style={{ position: 'absolute', inset: 0, opacity: o }}>
        {children}
      </div>
    );
  };
}

const FULL_T = 5.6; // every stroke drawn (wordmark lands last), before the scene-end fade

function IntroWorkbench() {
  window.__vibeWriteSpeed = 0.5; // match the explainer's tweak default
  const [t, setT] = React.useState(FULL_T);
  const [size, setSize] = React.useState({ w: window.innerWidth, h: window.innerHeight });

  React.useEffect(() => {
    const onR = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const BAR = 56; // control strip height
  const scale = Math.min(size.w / 1920, (size.h - BAR) / 1080);
  const ctx = React.useMemo(
    () => ({ time: t, duration: 6, playing: false, setTime: setT }),
    [t]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#0a0a0a', ...INTRO_VARS }}>
      {/* control strip (outside the canvas — never exported) */}
      <div style={{ height: BAR, flex: 'none', display: 'flex', alignItems: 'center',
        gap: 16, padding: '0 20px', color: '#c9cbd6',
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: '#fff' }}>S0 — intro drawing</span>
        <span style={{ opacity: 0.55, fontWeight: 600 }}>draw progress</span>
        <input type="range" min="0" max="5.6" step="0.01" value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
          style={{ width: 260, accentColor: '#2B5CE6' }}></input>
        <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums',
          fontWeight: 600 }}>{t.toFixed(2)}s</span>
        <button onClick={() => setT(FULL_T)} style={{ marginLeft: 'auto',
          background: '#1c1e2a', color: '#fff', border: '1px solid #3a3d4d',
          borderRadius: 8, padding: '6px 14px', fontFamily: 'inherit',
          fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Fully drawn</button>
      </div>
      {/* letterboxed 1920×1080 canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%',
          width: 1920, height: 1080, background: 'var(--paper)', overflow: 'hidden',
          transform: `translate(-50%, -50%) scale(${scale})` }}>
          <TimelineContext.Provider value={ctx}>
            <SceneIntro></SceneIntro>
          </TimelineContext.Provider>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<IntroWorkbench></IntroWorkbench>);
