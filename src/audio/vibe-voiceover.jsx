// vibe-voiceover.jsx — synced speech-synthesis narration for the explainer.
// Speaks each caption line as the playhead crosses its start time.
// Follows play/pause, cancels on seek/loop, matches playback speed.

function useVoices() {
  const [voices, setVoices] = React.useState([]);
  React.useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  return voices;
}

// Best-guess natural English voice when set to 'auto'.
const VO_PREFERRED = ['Google US English', 'Samantha', 'Aria', 'Jenny', 'Zira', 'Daniel'];
function pickVoice(voices, name) {
  if (!voices.length) return null;
  if (name && name !== 'auto') {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  for (const p of VO_PREFERRED) {
    const v = voices.find((v) => v.name.includes(p));
    if (v) return v;
  }
  return voices.find((v) => v.lang && v.lang.startsWith('en')) || voices[0];
}

function VoiceOver({ items, enabled, rate = 1, voiceName = 'auto', muted = false }) {
  const { time, playing } = useTimeline();
  const voices = useVoices();
  // speechSynthesis can't change volume mid-utterance — mute applies from the
  // next spoken line onward.
  const mutedRef = React.useRef(muted);
  mutedRef.current = muted;
  const prevTimeRef = React.useRef(time);
  const spokenRef = React.useRef(-1);
  // While a line is being spoken, the stage clock is not allowed past `at`
  // (the line's caption end). Released by the utterance's onend/onerror.
  const holdRef = React.useRef(null); // { at: seconds, since: ms } | null
  const rateRef = React.useRef(rate);
  rateRef.current = rate;
  const voiceRef = React.useRef(null);
  voiceRef.current = pickVoice(voices, voiceName);

  // Pace the timeline on the transcript: register a clock gate on the Stage
  // so the playhead waits at the end of a caption until its speech finishes.
  React.useEffect(() => {
    if (!enabled || !window.speechSynthesis) return;
    window.__animTimeGate = (t, next) => {
      const h = holdRef.current;
      if (h == null) return next;
      // Watchdog: if the synth silently died / never started, release the
      // hold so the video can never freeze forever.
      if (performance.now() - h.since > 500 && !speechSynthesis.speaking && !speechSynthesis.pending) {
        holdRef.current = null;
        return next;
      }
      return next > h.at ? Math.max(t, h.at) : next;
    };
    return () => { window.__animTimeGate = null; holdRef.current = null; };
  }, [enabled]);

  // Play/pause follows the timeline.
  React.useEffect(() => {
    if (!window.speechSynthesis) return;
    if (!enabled) { speechSynthesis.cancel(); spokenRef.current = -1; holdRef.current = null; return; }
    if (playing) { try { speechSynthesis.resume(); } catch {} }
    else { try { speechSynthesis.pause(); } catch {} }
  }, [enabled, playing]);

  // Cancel any speech when unmounting or when the voice changes mid-line.
  React.useEffect(() => () => { if (window.speechSynthesis) speechSynthesis.cancel(); }, []);

  React.useEffect(() => {
    if (!enabled || !playing || !window.speechSynthesis) { prevTimeRef.current = time; return; }
    const prev = prevTimeRef.current;
    prevTimeRef.current = time;
    // Seek or loop-wrap: drop whatever is being said, re-arm.
    if (Math.abs(time - prev) > 0.6) {
      speechSynthesis.cancel();
      spokenRef.current = -1;
      holdRef.current = null;
      return;
    }
    // Crossed the start of a caption going forward?
    const idx = items.findIndex((c) => prev < c.t && time >= c.t);
    if (idx >= 0 && idx !== spokenRef.current) {
      spokenRef.current = idx;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(items[idx].text);
      u.rate = clamp(rateRef.current, 0.5, 2);
      u.volume = mutedRef.current ? 0 : 1;
      u.pitch = 1;
      if (voiceRef.current) u.voice = voiceRef.current;
      // Hold the clock just before the caption fade-out (fade is the last
      // 0.3s before t2) until this utterance actually finishes speaking.
      const lineEnd = items[idx].t2 != null
        ? items[idx].t2
        : (items[idx + 1] ? items[idx + 1].t : time + 4);
      const hold = { at: Math.max(lineEnd - 0.35, time), since: performance.now() };
      holdRef.current = hold;
      const release = () => { if (holdRef.current === hold) holdRef.current = null; };
      u.onend = release;
      u.onerror = release;
      speechSynthesis.speak(u);
    }
  }, [time, enabled, playing, items]);

  return null;
}

Object.assign(window, { VoiceOver, useVoices, pickVoice });
