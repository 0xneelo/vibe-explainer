// vibe-music.jsx — generative background music for the explainer.
// Synthesizes a lo-fi funk groove with Web Audio (drums, bass, e-piano chords)
// so there is no dead air between narration lines. Follows the timeline's
// play/pause, and auto-ducks while a caption line is being spoken.

// ── Tiny synth helpers ──────────────────────────────────────────────────────
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function makeNoiseBuffer(ctx, seconds = 1) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Sparse impulses → vinyl crackle when lowpassed.
function makeCrackleBuffer(ctx, seconds = 3) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    if (Math.random() < 0.00045) d[i] = (Math.random() * 2 - 1) * 0.9;
  }
  return buf;
}

// ── Musical material: Fmaj7 → Em7 → Dm7 → Cmaj7 (classic lo-fi loop) ───────
const VIBE_PROG = [
  { chord: [53, 57, 60, 64], bass: 41 }, // Fmaj7
  { chord: [52, 55, 59, 62], bass: 40 }, // Em7
  { chord: [50, 53, 57, 60], bass: 38 }, // Dm7
  { chord: [48, 52, 55, 59], bass: 36 }, // Cmaj7
];

// Synthwave loop: Am → F → C → G (vi–IV–I–V) — minor, nostalgic, driving.
const VIBE_PROG_SYNTH = [
  { chord: [57, 60, 64], bass: 33 }, // Am
  { chord: [53, 57, 60], bass: 29 }, // F
  { chord: [55, 60, 64], bass: 36 }, // C
  { chord: [55, 59, 62], bass: 31 }, // G
];

// 16-step arp pattern indexing into 6 chord tones across two octaves.
const SYNTH_ARP_SEQ = [0, 1, 2, 3, 4, 5, 4, 3, 0, 1, 2, 3, 4, 5, 4, 3];

const VIBE_MUSIC_STYLES = {
  // 'soundtrack' = play the user's real music file (no synth patterns).
  soundtrack: {
    bpm: 100, swing: 0.5, kick: [], snare: [], hat: [], openHat: [],
    bass: [], stabs: [], hatGain: 0, crackle: 0,
  },
  synthwave: {
    bpm: 116, swing: 0.5,
    kick:  [0, 4, 8, 12],          // four on the floor
    snare: [4, 12],
    hat:   [2, 6, 10, 14],         // off-beat hats
    openHat: [],
    bass: [], bassMode: 'pulse8',  // driving 8th-note bass
    stabs: [],
    arp: true, pad: true,
    prog: VIBE_PROG_SYNTH,
    hatGain: 0.11, crackle: 0,
  },
  funky: {
    bpm: 94, swing: 0.55,
    kick:  [0, 7, 10],
    snare: [4, 12],
    hat:   [0, 2, 4, 6, 8, 10, 12, 14],
    openHat: [14],
    // bass: [step, degree] — degree: 0 root, 7 fifth, 12 octave, -1 approach
    bass: [[0, 0], [3, 0], [7, 7], [10, 0], [14, -1]],
    stabs: [0, 10], // chord hits per bar (16th steps)
    hatGain: 0.16, crackle: 0.05,
  },
  mellow: {
    bpm: 78, swing: 0.54,
    kick:  [0, 8],
    snare: [4, 12],
    hat:   [0, 4, 8, 12],
    openHat: [],
    bass: [[0, 0], [8, 7]],
    stabs: [0],
    hatGain: 0.1, crackle: 0.08,
  },
};

// ── Engine: lookahead scheduler on the AudioContext clock ───────────────────
class VibeMusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.duckGain = null;
    this.timer = null;
    this.step = 0;          // global 16th-note counter
    this.nextTime = 0;      // ctx time of next step
    this.styleName = 'funky';
    this.volume = 0.5;
    this.noise = null;
    this.crackleSrc = null;
    this.active = false;
    this.trackUrl = null;   // user-provided music file (soundtrack mode)
    this.trackEl = null;    // HTMLAudioElement routed through the duck chain
  }

  ensureCtx() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.duckGain = this.ctx.createGain();
    this.duckGain.gain.value = 1;
    // Gentle bus: soften the top end so it sits behind speech.
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 7200;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    this.master.connect(this.duckGain);
    this.duckGain.connect(tone);
    tone.connect(comp);
    comp.connect(this.ctx.destination);
    this.noise = makeNoiseBuffer(this.ctx, 1);
  }

  get style() { return VIBE_MUSIC_STYLES[this.styleName] || VIBE_MUSIC_STYLES.funky; }
  get stepDur() { return 60 / this.style.bpm / 4; }

  // ── Voices ────────────────────────────────────────────────────────────
  playKick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(118, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.25);
  }

  playSnare(t) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 1900; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 0.2);
    // Body thump
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 196;
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(og); og.connect(this.master);
    o.start(t); o.stop(t + 0.1);
  }

  playHat(t, open, vel) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass';
    hp.frequency.value = 7400;
    const g = ctx.createGain();
    const dur = open ? 0.22 : 0.045;
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(hp); hp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + dur + 0.02);
  }

  playBass(t, midi, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.value = mtof(midi);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(720, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    lp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.setValueAtTime(0.22, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // Driving synthwave bass: bright saw, punchy, plays straight 8ths.
  playSynthBass(t, midi, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.value = mtof(midi);
    const o2 = ctx.createOscillator(); o2.type = 'square';
    o2.frequency.value = mtof(midi) * 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + dur);
    lp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.008);
    g.gain.setValueAtTime(0.17, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.45;
    o.connect(lp); o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
    o2.start(t); o2.stop(t + dur + 0.05);
  }

  // 16th-note arp: two slightly detuned saws, short pluck envelope.
  playArp(t, midi, vel = 0.06) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.value = 3400; lp.Q.value = 1;
    for (const det of [-4, 4]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = mtof(midi);
      o.detune.value = det;
      o.connect(lp);
      o.start(t); o.stop(t + 0.2);
    }
    lp.connect(g); g.connect(this.master);
    // Faux delay tap for that washy retro echo.
    const echo = ctx.createGain();
    const tapAt = t + this.stepDur * 3;
    echo.gain.setValueAtTime(0.0001, tapAt);
    echo.gain.exponentialRampToValueAtTime(vel * 0.32, tapAt + 0.006);
    echo.gain.exponentialRampToValueAtTime(0.001, tapAt + 0.14);
    const oe = ctx.createOscillator(); oe.type = 'sawtooth';
    oe.frequency.value = mtof(midi);
    oe.connect(echo); echo.connect(this.master);
    oe.start(tapAt); oe.stop(tapAt + 0.18);
  }

  // Warm detuned pad holding the bar's chord.
  playPad(t, midis, dur) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.5);
    lp.frequency.linearRampToValueAtTime(700, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + dur * 0.25);
    g.gain.setValueAtTime(0.035, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(this.master);
    for (const m of midis) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = mtof(m);
        o.detune.value = det;
        o.connect(lp);
        o.start(t); o.stop(t + dur + 0.05);
      }
    }
  }

  playChord(t, midis, vel = 0.09) {
    const ctx = this.ctx;
    for (const m of midis) {
      for (const [mult, amt] of [[1, 1], [2.001, 0.35]]) { // bell-ish e-piano
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.value = mtof(m) * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vel * amt, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 1.6);
      }
    }
  }

  startCrackle() {
    if (this.crackleSrc || !this.ctx || !this.style.crackle) return;
    const src = this.ctx.createBufferSource();
    src.buffer = makeCrackleBuffer(this.ctx, 3);
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = this.ctx.createGain();
    g.gain.value = this.style.crackle;
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start();
    this.crackleSrc = { src, g };
  }

  stopCrackle() {
    if (!this.crackleSrc) return;
    try { this.crackleSrc.src.stop(); } catch {}
    this.crackleSrc = null;
  }

  // ── Soundtrack mode: real audio file through the same duck chain ──────
  setTrackUrl(url) {
    if (url === this.trackUrl) return;
    this.removeTrack();
    this.trackUrl = url;
    if (this.active && this.styleName === 'soundtrack') {
      this.ensureTrack();
      if (this.trackEl) this.trackEl.play().catch(() => {});
    }
  }

  ensureTrack() {
    if (this.trackEl || !this.trackUrl) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const el = new Audio(this.trackUrl);
    el.loop = true;
    el.preload = 'auto';
    const src = this.ctx.createMediaElementSource(el);
    src.connect(this.master);
    this.trackEl = el;
  }

  removeTrack() {
    if (this.trackEl) { try { this.trackEl.pause(); } catch {} this.trackEl = null; }
  }

  // ── Scheduler ─────────────────────────────────────────────────────────
  scheduleStep(stepIdx, t) {
    const s = this.style;
    const inBar = stepIdx % 16;
    const bar = Math.floor(stepIdx / 16);
    const progArr = s.prog || VIBE_PROG;
    const prog = progArr[bar % progArr.length];
    const nextProg = progArr[(bar + 1) % progArr.length];
    if (s.kick.includes(inBar)) this.playKick(t);
    if (s.snare.includes(inBar)) this.playSnare(t);
    if (s.hat.includes(inBar)) {
      const open = s.openHat.includes(inBar) && bar % 2 === 1;
      const vel = s.hatGain * (inBar % 4 === 0 ? 1 : 0.62) * (0.85 + Math.random() * 0.3);
      this.playHat(t, open, vel);
    }
    for (const [bStep, deg] of s.bass) {
      if (bStep === inBar) {
        const midi = deg === -1 ? nextProg.bass + 1 : prog.bass + deg;
        const dur = deg === -1 ? this.stepDur * 1.6 : this.stepDur * 2.6;
        this.playBass(t, midi, dur);
      }
    }
    if (s.stabs.includes(inBar)) {
      this.playChord(t, prog.chord, inBar === 0 ? 0.085 : 0.055);
    }
    // Synthwave extras: pulsing bass, 16th arps, pads.
    if (s.bassMode === 'pulse8' && inBar % 2 === 0) {
      const oct = inBar % 8 === 6 ? 12 : 0; // octave pop at end of each half-bar
      this.playSynthBass(t, prog.bass + 12 + oct, this.stepDur * 1.7);
    }
    if (s.arp) {
      const tones = [
        prog.chord[0], prog.chord[1], prog.chord[2],
        prog.chord[0] + 12, prog.chord[1] + 12, prog.chord[2] + 12,
      ];
      this.playArp(t, tones[SYNTH_ARP_SEQ[inBar]], inBar % 4 === 0 ? 0.065 : 0.05);
    }
    if (s.pad && inBar === 0) {
      this.playPad(t, prog.chord, this.stepDur * 16);
    }
  }

  tick() {
    if (!this.ctx) return;
    const lookahead = 0.35;
    while (this.nextTime < this.ctx.currentTime + lookahead) {
      // Swing: delay odd 16ths.
      const swingOff = (this.step % 2 === 1) ? (this.style.swing - 0.5) * 2 * this.stepDur : 0;
      this.scheduleStep(this.step, Math.max(this.nextTime + swingOff, this.ctx.currentTime));
      this.step++;
      this.nextTime += this.stepDur;
    }
  }

  start() {
    this.ensureCtx();
    if (!this.ctx || this.active) return;
    this.active = true;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.25);
    if (this.styleName === 'soundtrack' && this.trackUrl) {
      this.ensureTrack();
      if (this.trackEl) this.trackEl.play().catch(() => {});
      return;
    }
    // Not in soundtrack mode: make sure the track is silent right now
    // (style switches restart immediately, beating stop()'s fade timeout).
    if (this.trackEl) { try { this.trackEl.pause(); } catch {} }
    this.nextTime = this.ctx.currentTime + 0.06;
    // Restart bars cleanly on the chord cycle so re-entry isn't mid-phrase.
    this.step = Math.ceil(this.step / 16) * 16;
    this.startCrackle();
    this.timer = setInterval(() => this.tick(), 90);
    this.tick();
  }

  stop() {
    this.active = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    }
    // Let the fade finish before pausing the track, so it doesn't cut hard.
    const el = this.trackEl;
    if (el) setTimeout(() => { if (!this.active) { try { el.pause(); } catch {} } }, 250);
    this.stopCrackle();
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.active) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.15);
    }
  }

  setDuck(ducked) {
    if (!this.ctx) return;
    const target = ducked ? 0.32 : 1;
    // Duck fast, recover slow — classic sidechain feel.
    this.duckGain.gain.setTargetAtTime(target, this.ctx.currentTime, ducked ? 0.09 : 0.45);
  }

  setStyle(name) {
    if (name === this.styleName) return;
    // Restart cleanly in the new mode (synth scheduler ↔ soundtrack file).
    const wasActive = this.active;
    if (wasActive) this.stop();
    this.styleName = name;
    if (wasActive) this.start();
  }
}

const __vibeMusic = new VibeMusicEngine();

// Browsers require a user gesture before audio can start; the play button
// click counts, but effects run after the gesture — so also hook the gesture
// directly to resume a suspended context.
window.addEventListener('pointerdown', () => {
  if (__vibeMusic.ctx && __vibeMusic.ctx.state === 'suspended' && __vibeMusic.active) {
    __vibeMusic.ctx.resume().catch(() => {});
  }
}, true);

// ── React wrapper: follows the timeline, ducks under narration ─────────────
function BackgroundMusic({ items, enabled, volume = 0.5, style = 'funky', trackUrl = null, duckEnabled = true }) {
  const { time, playing } = useTimeline();

  React.useEffect(() => { __vibeMusic.setTrackUrl(trackUrl); }, [trackUrl]);
  React.useEffect(() => { __vibeMusic.setStyle(style); }, [style]);
  React.useEffect(() => { __vibeMusic.setVolume(volume); }, [volume]);

  React.useEffect(() => {
    if (enabled && playing) __vibeMusic.start();
    else __vibeMusic.stop();
    return () => __vibeMusic.stop();
  }, [enabled, playing]);

  // Duck while the playhead sits inside a caption window (speech is paced to
  // these windows by the voiceover clock gate, so they track real speech).
  const speaking = duckEnabled &&
    items.some((c) => time >= c.t - 0.05 && time <= c.t2 + 0.25);
  const speakingRef = React.useRef(false);
  React.useEffect(() => {
    if (speaking !== speakingRef.current) {
      speakingRef.current = speaking;
      __vibeMusic.setDuck(speaking);
    }
  }, [speaking]);

  return null;
}

Object.assign(window, { BackgroundMusic, VIBE_MUSIC_STYLES });
