// vibe-export-audio.jsx — stitch the cached ElevenLabs clips into a single
// narration track and download it as MP3 (WAV fallback if the encoder
// can't be loaded). Each line is placed at its transcript timestamp; lines
// never overlap (a long clip pushes the next one back by at least 0.2s).

async function elLoadLame() {
  if (window.lamejs) return window.lamejs;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lamejs@1.2.1/lame.min.js';
    s.onload = res;
    s.onerror = () => rej(new Error('Could not load MP3 encoder'));
    document.head.appendChild(s);
  });
  if (!window.lamejs) throw new Error('MP3 encoder failed to initialise');
  return window.lamejs;
}

// 16-bit PCM mono WAV from a Float32Array.
function elWavBlob(samples, sr) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const wstr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  wstr(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 32768 : x * 32767, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

async function elExportNarration(items, voiceId, onStatus) {
  const SR = 44100;
  onStatus('Decoding clips…');
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const clips = [];
  for (let i = 0; i < items.length; i++) {
    const key = elClipKey(voiceId, items[i].text);
    const entry = ELCache.mem.get(key);
    const blob = entry ? entry.blob : await elIdbGet(key);
    if (!blob) throw new Error(`Line ${i + 1} is not generated yet — run Generate narration first`);
    clips.push(await ac.decodeAudioData(await blob.arrayBuffer()));
  }
  try { ac.close(); } catch {}

  // Schedule: each line at its transcript timestamp, never overlapping.
  let cursor = 0;
  const at = items.map((c, i) => {
    const start = Math.max(c.t, cursor);
    cursor = start + clips[i].duration + 0.2;
    return start;
  });
  const total = Math.max(cursor, items[items.length - 1].t2 || 0) + 0.5;

  onStatus('Mixing…');
  const off = new OfflineAudioContext(1, Math.ceil(total * SR), SR);
  clips.forEach((buf, i) => {
    const s = off.createBufferSource();
    s.buffer = buf;
    s.connect(off.destination);
    s.start(at[i]);
  });
  const rendered = await off.startRendering();
  const samples = rendered.getChannelData(0);

  let blob, name;
  try {
    onStatus('Encoding MP3… (can take ~10s)');
    const lame = await elLoadLame();
    const enc = new lame.Mp3Encoder(1, SR, 128);
    const i16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const x = Math.max(-1, Math.min(1, samples[i]));
      i16[i] = x < 0 ? x * 32768 : x * 32767;
    }
    const parts = [];
    for (let p = 0; p < i16.length; p += 1152) {
      const b = enc.encodeBuffer(i16.subarray(p, Math.min(p + 1152, i16.length)));
      if (b.length) parts.push(new Uint8Array(b));
    }
    const tail = enc.flush();
    if (tail.length) parts.push(new Uint8Array(tail));
    blob = new Blob(parts, { type: 'audio/mpeg' });
    name = 'vibe-narration.mp3';
  } catch (e) {
    onStatus('MP3 encoder unavailable — saving WAV instead…');
    blob = elWavBlob(samples, SR);
    name = 'vibe-narration.wav';
  }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch {} }, 30000);
  return name;
}

Object.assign(window, { elExportNarration });
