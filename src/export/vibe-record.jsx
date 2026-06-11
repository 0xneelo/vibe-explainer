// vibe-record.jsx — record the explainer to a downloadable .webm video file.
// Uses tab capture (getDisplayMedia with tab audio) so the recording contains
// the REAL mix: ElevenLabs narration + soundtrack, exactly as heard. While
// recording, the app hides its chrome (transcript, playback bar, corner
// buttons) for a clean frame, plays start-to-finish, then auto-stops and
// downloads the file.

function VideoExport({ tlRef, recording, setRecording, engine }) {
  const [phase, setPhase] = React.useState('idle'); // idle | picking | blocked | recording
  const recRef = React.useRef(null);

  const finalize = React.useCallback(() => {
    const r = recRef.current;
    if (r && r.rec.state !== 'inactive') { try { r.rec.stop(); } catch {} }
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) {
      setPhase('blocked');
      return;
    }
    // Embedded previews usually deny display-capture via permissions policy —
    // detect it up front and route the user to a real tab instead of failing.
    try {
      const fp = document.featurePolicy;
      if (fp && fp.allowsFeature && !fp.allowsFeature('display-capture')) {
        setPhase('blocked');
        return;
      }
    } catch {}
    setPhase('picking');
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,            // tab audio = narration + music mix
        preferCurrentTab: true, // Chrome: offer this tab first
        selfBrowserSurface: 'include',
      });
    } catch (err) {
      const msg = String((err && err.message) || err);
      // Policy block reads differently from a user cancelling the picker.
      if (/policy|disallow|denied by|not allowed in this context/i.test(msg) ||
          (err && err.name === 'NotAllowedError' && !/dismiss|abort|cancel|denied$/i.test(msg) && /policy|iframe|frame/i.test(msg))) {
        setPhase('blocked');
      } else if (err && err.name === 'NotAllowedError') {
        setPhase('idle'); // user cancelled — fine
      } else {
        setPhase('blocked');
      }
      return;
    }
    setPhase('recording');
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, mime
      ? { mimeType: mime, videoBitsPerSecond: 8000000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => { try { tr.stop(); } catch {} });
      const blob = new Blob(chunks, { type: 'video/webm' });
      if (blob.size > 0) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Vibe Explainer.webm';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }
      recRef.current = null;
      setPhase('idle');
      setRecording(false);
    };
    // The browser's own "Stop sharing" bar also ends the recording.
    const vt = stream.getVideoTracks()[0];
    if (vt) vt.addEventListener('ended', () => setTimeout(finalize, 0));
    recRef.current = { rec, stream, armed: false };
    setRecording(true);
    // Give React a beat to hide the chrome, then rewind and roll.
    setTimeout(() => {
      const tl = tlRef.current;
      if (tl) { tl.setTime(0); tl.setPlaying(false); }
      rec.start(1000);
      setTimeout(() => {
        const tl2 = tlRef.current;
        if (tl2) tl2.setPlaying(true);
        if (recRef.current) recRef.current.armed = true;
      }, 500);
    }, 300);
  };

  // Auto-stop when the movie reaches the end (Stage stops at duration when
  // loop is off). Esc stops early and still downloads what was captured.
  React.useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => {
      const tl = tlRef.current, r = recRef.current;
      if (!tl || !r || !r.armed) return;
      if (!tl.playing && tl.time >= tl.duration - 0.15) {
        r.armed = false;
        setTimeout(finalize, 900); // keep a beat of tail
      }
    }, 400);
    const onKey = (e) => { if (e.code === 'Escape') finalize(); };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(iv); window.removeEventListener('keydown', onKey); };
  }, [recording, finalize]);

  const btn = {
    appearance: 'none', border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(20,21,30,0.72)', color: 'rgba(255,255,255,0.85)',
    font: "600 12px 'Nunito', sans-serif", letterSpacing: '0.02em',
    padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <>
      {phase === 'idle' && (
        <button style={btn} onClick={start} title="Record the whole explainer to a .webm video file">
          <span style={{ width: 8, height: 8, borderRadius: 4, background: '#e05252',
            display: 'inline-block' }}></span>
          Record video
        </button>
      )}
      {phase === 'blocked' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(8,9,14,0.86)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setPhase('idle')}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, color: '#f6f4ef',
            font: "15px/1.6 'Nunito', system-ui, sans-serif",
            background: '#16181f', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 14, padding: '26px 30px' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>
              Recording is blocked in this embedded preview
            </div>
            <div style={{ fontSize: 14, color: 'rgba(246,244,239,0.75)' }}>
              The preview pane doesn’t have screen-capture permission (and new tabs
              lose access here). Download the <b>standalone copy</b>, open it in
              Chrome, and hit <b>Record video</b> there. One-time setup in that copy:
              set up the narrator there (Console → Narrator): paste your
              ElevenLabs key and generate, or import your narration MP3.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <a href="dist/Vibe Explainer (standalone).html" download="Vibe Explainer (standalone).html"
                onClick={() => setPhase('idle')}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(95,135,255,0.92)', color: '#fff', textDecoration: 'none',
                  font: "700 13.5px 'Nunito', sans-serif" }}>Download standalone file</a>
              <button onClick={() => setPhase('idle')}
                style={{ padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(246,244,239,0.8)', font: "600 13.5px 'Nunito', sans-serif" }}>Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {phase === 'picking' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(8,9,14,0.86)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 540, color: '#f6f4ef',
            font: "15px/1.6 'Nunito', system-ui, sans-serif",
            background: '#16181f', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 14, padding: '26px 30px' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Set up the recording</div>
            <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>In the browser dialog, pick <b>This Tab</b></li>
              <li>Turn on <b>“Also share tab audio”</b> — otherwise the video is silent</li>
            </ol>
            <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.55, color: 'rgba(246,244,239,0.55)' }}>
              Recording starts from the beginning and stops by itself at the end (~4½ min).
              Press Esc to stop early.
              {engine === 'browser' && ' Heads-up: the browser voice often can’t be captured — switch the narrator engine to ElevenLabs or an imported MP3 for reliable audio.'}
              {engine === 'elevenlabs' && ' Tip: run “Generate narration” first (Console → Narrator) so playback never pauses to fetch audio.'}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

Object.assign(window, { VideoExport });
