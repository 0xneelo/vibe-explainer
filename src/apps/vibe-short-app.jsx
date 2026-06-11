// vibe-short-app.jsx — 60-second fast cut. Same engine + narrator/music/tweaks
// as the long explainer, but a compressed 9-beat timeline (no slow-down).

const SHORT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2B5CE6",
  "typography": "handwritten",
  "writeSpeed": 1,
  "captions": true,
  "voiceover": true,
  "music": true,
  "musicStyle": "soundtrack",
  "musicVol": 0.4,
  "engine": "elevenlabs",
  "elVoice": "Adam — deep narrator",
  "voice": "auto",
  "transcript": true,
  "speed": 1
}/*EDITMODE-END*/;

const SHORT_TRACK_URL = 'assets/audio/Optimized_Ledger_Beats_2026-06-11T150814.mp3';

// Tight narration — one or two punchy lines per beat. [t, t2] in seconds.
const SHORT_CAPTIONS = [
  // S1
  { t: 0.4, t2: 3.5, text: 'Everyone thinks markets are just buying and selling.' },
  { t: 3.8, t2: 6.8, text: 'But real finance runs on lending and borrowing too.' },
  // S2
  { t: 7.3, t2: 10.3, text: 'Crypto nailed the spot market — buy, sell, repeat.' },
  { t: 10.6, t2: 13.8, text: 'But once you hold a token? Hold, pray, or dump.' },
  // S3
  { t: 14.3, t2: 17.3, text: 'Real finance is a matching engine.' },
  { t: 17.6, t2: 21.2, text: 'Holders want yield. Borrowers want exposure.' },
  // S4
  { t: 21.9, t2: 25.0, text: 'Like renting: owners earn yield, renters get access.' },
  { t: 25.2, t2: 28.3, text: 'Ban renting, and the reason to own disappears.' },
  // S5
  { t: 28.9, t2: 31.6, text: 'Millions of tokens launch every year.' },
  { t: 31.8, t2: 34.3, text: 'Almost none are productive — no yield.' },
  // S6
  { t: 34.9, t2: 38.1, text: 'Printing more tokens isn’t yield — it just dilutes you.' },
  { t: 38.3, t2: 41.3, text: 'Real yield means someone pays for exposure.' },
  // S7
  { t: 41.9, t2: 44.8, text: 'Vibe is the marketplace between the two.' },
  { t: 45.0, t2: 47.8, text: 'Long, short, leveraged — on any token.' },
  // S8
  { t: 48.3, t2: 51.4, text: 'Holders deposit to a vault; the tokens never leave.' },
  { t: 51.6, t2: 54.8, text: 'Traders trade the price. Their fees become yield.' },
  // S9
  { t: 55.3, t2: 58.4, text: 'Buying and selling is only half of finance.' },
  { t: 58.6, t2: 62.4, text: 'Vibe brings the other half on-chain — every asset productive.' },
];

const SHORT_SCENE_NAMES = [
  [0, 'S1 · two buttons'], [7, 'S2 · hold / pray / dump'], [14, 'S3 · matching engine'],
  [21.5, 'S4 · renting'], [28.5, 'S5 · token conveyor'], [34.5, 'S6 · real yield'],
  [41.5, 'S7 · the Vibe idea'], [48, 'S8 · synthetic vault'], [55, 'S9 · complete market'],
];

const SHORT_DURATION = 63;
const SHORT_CHAPTERS = SHORT_SCENE_NAMES.map((s) => ({ t: s[0], label: s[1] }));

function ShortMovie({ items, captionsOn, voiceoverOn, voice, speed, engine, elVoice, elKey,
  musicOn, musicStyle, musicVol }) {
  const t = useTime();
  const scene = SHORT_SCENE_NAMES.filter((s) => t >= s[0]).pop();
  return (
    <div data-screen-label={`${Math.floor(t)}s · ${scene ? scene[1] : ''}`}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <ShortS1></ShortS1>
      <ShortS2></ShortS2>
      <ShortS3></ShortS3>
      <ShortS4></ShortS4>
      <ShortS5></ShortS5>
      <ShortS6></ShortS6>
      <ShortS7></ShortS7>
      <ShortS8></ShortS8>
      <ShortS9></ShortS9>
      <Captions items={items} visible={captionsOn}></Captions>
      <BackgroundMusic items={items} enabled={musicOn} volume={musicVol}
        style={musicStyle} trackUrl={SHORT_TRACK_URL} duckEnabled={voiceoverOn}></BackgroundMusic>
      {voiceoverOn && engine === 'elevenlabs' && !elKey && (
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,21,30,0.78)', color: 'rgba(255,255,255,0.9)',
          font: "600 22px 'Nunito', sans-serif", padding: '10px 22px', borderRadius: 999,
          pointerEvents: 'none' }}>
          Narration muted — add your ElevenLabs key in Console → Narrator
        </div>
      )}
      {engine === 'elevenlabs' && elKey ? (
        <ElevenLabsVoiceOver items={items} enabled={voiceoverOn} apiKey={elKey}
          voiceLabel={elVoice} rate={speed}></ElevenLabsVoiceOver>
      ) : (
        <VoiceOver items={items} enabled={voiceoverOn} rate={speed} voiceName={voice}></VoiceOver>
      )}
    </div>
  );
}

const SHORT_TRANSCRIPT_KEY = 'vibe-short-transcript-edits';

function ShortCornerControls({ transcriptOn, onTranscript }) {
  const openConsole = () => window.postMessage({ type: '__activate_edit_mode' }, '*');
  const btn = (active) => ({
    appearance: 'none', border: '1px solid rgba(255,255,255,0.22)',
    background: active ? 'rgba(255,255,255,0.92)' : 'rgba(20,21,30,0.72)',
    color: active ? '#1c1e2a' : 'rgba(255,255,255,0.85)',
    font: "600 12px 'Nunito', sans-serif", letterSpacing: '0.02em',
    padding: '6px 12px', borderRadius: 999, cursor: 'pointer', backdropFilter: 'blur(6px)',
  });
  return (
    <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 60, display: 'flex', gap: 8 }}>
      <button style={btn(false)} onClick={() => window.open('index.html', '_self')}>Full cut →</button>
      <button style={btn(transcriptOn)} onClick={() => onTranscript(!transcriptOn)}>Transcript</button>
      <button style={btn(false)} onClick={openConsole}>Console</button>
    </div>
  );
}

function ShortApp() {
  const [t, setTweak] = useTweaks(SHORT_TWEAK_DEFAULTS);
  const [elKey, setElKey] = useElApiKey();
  const voices = useVoices();
  const voiceOptions = ['auto'].concat(
    voices.filter((v) => v.lang && v.lang.startsWith('en')).map((v) => v.name).slice(0, 10)
  );
  const [items, setItems] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SHORT_TRANSCRIPT_KEY) || 'null');
      if (Array.isArray(saved)) return SHORT_CAPTIONS.map((c, i) => (
        typeof saved[i] === 'string' ? { ...c, text: saved[i] } : c
      ));
    } catch {}
    return SHORT_CAPTIONS;
  });
  const editLine = (idx, text) => {
    setItems((prev) => {
      const next = prev.map((c, i) => (i === idx ? { ...c, text } : c));
      try { localStorage.setItem(SHORT_TRANSCRIPT_KEY, JSON.stringify(next.map((c) => c.text))); } catch {}
      return next;
    });
  };
  const resetTranscript = () => {
    try { localStorage.removeItem(SHORT_TRANSCRIPT_KEY); } catch {}
    setItems(SHORT_CAPTIONS);
  };
  const tlRef = React.useRef(null);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const activeIdxRef = React.useRef(-1);
  const onTlCtx = React.useCallback((ctx) => {
    tlRef.current = ctx;
    const time = ctx.time;
    let idx = -1;
    for (let i = 0; i < SHORT_CAPTIONS.length; i++) {
      if (time >= SHORT_CAPTIONS[i].t && time < SHORT_CAPTIONS[i].t2) { idx = i; break; }
      if (time >= SHORT_CAPTIONS[i].t) idx = i;
    }
    if (idx !== activeIdxRef.current) { activeIdxRef.current = idx; setActiveIdx(idx); }
  }, []);
  const seekTo = (sec) => { if (tlRef.current) tlRef.current.setTime(Math.max(0, sec - 0.2)); };
  const hand = t.typography === 'handwritten';
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
        <Stage width={1920} height={1080} duration={SHORT_DURATION} background="var(--paper)"
          speed={t.speed} autoplay={false} persistKey="vibe-explainer-short"
          chapters={SHORT_CHAPTERS}>
          <ShortMovie items={items} captionsOn={t.captions} voiceoverOn={t.voiceover}
            voice={t.voice} speed={t.speed} engine={t.engine} elVoice={t.elVoice}
            elKey={elKey} musicOn={t.music} musicStyle={t.musicStyle}
            musicVol={t.musicVol}></ShortMovie>
          <TimelineBridge onCtx={onTlCtx}></TimelineBridge>
        </Stage>
        <ShortCornerControls transcriptOn={t.transcript}
          onTranscript={(v) => setTweak('transcript', v)}></ShortCornerControls>
      </div>
      {t.transcript && (
        <TranscriptPanel items={items} activeIdx={activeIdx}
          onEdit={editLine} onSeek={seekTo} onReset={resetTranscript}></TranscriptPanel>
      )}
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
        <TweakRadio label="Engine" value={t.engine} options={['browser', 'elevenlabs']}
          onChange={(v) => setTweak('engine', v)}></TweakRadio>
        {t.engine === 'elevenlabs' ? (
          <>
            <TweakSelect label="Voice" value={t.elVoice}
              options={EL_VOICES.map((v) => v.label)}
              onChange={(v) => setTweak('elVoice', v)}></TweakSelect>
            <ELNarrationControls items={items} voiceLabel={t.elVoice}
              apiKey={elKey} setApiKey={setElKey}></ELNarrationControls>
          </>
        ) : (
          <TweakSelect label="Voice" value={t.voice} options={voiceOptions}
            onChange={(v) => setTweak('voice', v)}></TweakSelect>
        )}
        <TweakSlider label="Speed" value={t.speed} min={0.5} max={2} step={0.25} unit="×"
          onChange={(v) => setTweak('speed', v)}></TweakSlider>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ShortApp></ShortApp>);
