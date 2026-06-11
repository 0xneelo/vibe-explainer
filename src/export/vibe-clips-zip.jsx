// vibe-clips-zip.jsx — export/import the per-line narration clips as a ZIP.
// Export packs every cached clip (one MP3 per transcript line) plus a
// manifest (vibe-clips.json) mapping files to line text. Import unpacks a
// ZIP into the same per-line clip cache the ElevenLabs engine plays from —
// so the timeline keeps its per-line clock gating (scenes hold until each
// line finishes) with zero API key needed on the importing machine.
//
// Import accepts two shapes:
//   1. A ZIP exported from here (has vibe-clips.json) — clips map by text.
//   2. A bare ZIP of audio files — sorted by filename, mapped to lines in order.

// ── Minimal ZIP (store) writer + reader ─────────────────────────────────────
const ZIP_CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function zipCrc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = ZIP_CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// entries: [{ name: string, data: Uint8Array }] → Blob (no compression).
function zipBuild(entries) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const nameB = enc.encode(e.name);
    const crc = zipCrc32(e.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);      // version needed
    lh.setUint16(6, 0x0800, true);  // flags: UTF-8 names
    lh.setUint16(8, 0, true);       // method: store
    lh.setUint16(10, 0, true);      // mod time
    lh.setUint16(12, 0x21, true);   // mod date (1980-01-01)
    lh.setUint32(14, crc, true);
    lh.setUint32(18, e.data.length, true);
    lh.setUint32(22, e.data.length, true);
    lh.setUint16(26, nameB.length, true);
    lh.setUint16(28, 0, true);
    parts.push(lh.buffer, nameB, e.data);
    central.push({ nameB, crc, size: e.data.length, offset });
    offset += 30 + nameB.length + e.data.length;
  }
  const cdParts = [];
  let cdSize = 0;
  for (const c of central) {
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0x21, true);
    cd.setUint32(16, c.crc, true);
    cd.setUint32(20, c.size, true);
    cd.setUint32(24, c.size, true);
    cd.setUint16(28, c.nameB.length, true);
    cd.setUint32(42, c.offset, true);
    cdParts.push(cd.buffer, c.nameB);
    cdSize += 46 + c.nameB.length;
  }
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, central.length, true);
  eocd.setUint16(10, central.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  return new Blob([...parts, ...cdParts, eocd.buffer], { type: 'application/zip' });
}

async function zipInflateRaw(u8) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([u8]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ArrayBuffer → [{ name, data: Uint8Array }] (skips folders + unsupported).
async function zipParse(buf) {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65536); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid ZIP file');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out = [];
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const cmtLen = dv.getUint16(p + 32, true);
    const lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + cmtLen;
    if (name.endsWith('/')) continue;
    const lNameLen = dv.getUint16(lho + 26, true);
    const lExtraLen = dv.getUint16(lho + 28, true);
    const dataStart = lho + 30 + lNameLen + lExtraLen;
    let data = u8.subarray(dataStart, dataStart + csize);
    if (method === 8) data = await zipInflateRaw(data);
    else if (method !== 0) continue; // unsupported compression — skip
    out.push({ name, data });
  }
  return out;
}

// ── Export: cached clips + manifest → vibe-narration-clips.zip ─────────────
async function elExportClipsZip(items, voiceId, voiceLabel, onStatus) {
  onStatus('Collecting clips\u2026');
  const entries = [];
  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const key = elClipKey(voiceId, items[i].text);
    const entry = ELCache.mem.get(key);
    const blob = entry ? entry.blob : await elIdbGet(key);
    if (!blob) throw new Error(`Line ${i + 1} is not generated yet \u2014 run Generate narration first`);
    const name = `clip-${String(i + 1).padStart(3, '0')}.mp3`;
    entries.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
    lines.push({ i, file: name, text: items[i].text, t: items[i].t, t2: items[i].t2 });
  }
  const manifest = {
    format: 'vibe-narration-clips', version: 1,
    voiceLabel, voiceId, model: EL_MODEL,
    savedAt: new Date().toISOString(), lines,
  };
  entries.unshift({ name: 'vibe-clips.json',
    data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
  onStatus('Zipping\u2026');
  const blob = zipBuild(entries);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vibe-narration-clips.zip';
  a.click();
  setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch {} }, 30000);
}

// ── Import: ZIP → per-line clip cache (IndexedDB + memory) ─────────────────
const ZIP_AUDIO_RE = /\.(mp3|wav|m4a|aac|ogg)$/i;
const zipMime = (name) =>
  /\.wav$/i.test(name) ? 'audio/wav' :
  /\.(m4a|aac)$/i.test(name) ? 'audio/mp4' :
  /\.ogg$/i.test(name) ? 'audio/ogg' : 'audio/mpeg';

async function elImportClipsZip(file, items, voiceId, onStatus) {
  onStatus('Reading ZIP\u2026');
  const entries = (await zipParse(await file.arrayBuffer()))
    .filter((e) => {
      const base = e.name.split('/').pop();
      return !/(^|\/)__MACOSX\//.test(e.name) && !base.startsWith('.');
    });
  const byBase = new Map(entries.map((e) => [e.name.split('/').pop(), e]));
  const pairs = []; // { text, data, mime, voiceIds }
  const mf = entries.find((e) => /(^|\/)vibe-clips\.json$/i.test(e.name));
  if (mf) {
    let manifest;
    try { manifest = JSON.parse(new TextDecoder().decode(mf.data)); }
    catch { throw new Error('vibe-clips.json in the ZIP is not valid JSON'); }
    for (const ln of manifest.lines || []) {
      const e = ln && ln.file ? byBase.get(String(ln.file).split('/').pop()) : null;
      if (e && typeof ln.text === 'string') {
        pairs.push({ text: ln.text, data: e.data, mime: zipMime(e.name),
          voiceIds: [voiceId, manifest.voiceId] });
      }
    }
  } else {
    // Bare ZIP of audio files: sort by name (numeric-aware), map to lines in order.
    const audio = entries
      .filter((e) => ZIP_AUDIO_RE.test(e.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (let i = 0; i < Math.min(audio.length, items.length); i++) {
      pairs.push({ text: items[i].text, data: audio[i].data,
        mime: zipMime(audio[i].name), voiceIds: [voiceId] });
    }
    if (audio.length && audio.length !== items.length) {
      console.warn(`Clips ZIP has ${audio.length} audio files but the transcript has ${items.length} lines — mapped the first ${Math.min(audio.length, items.length)} in filename order.`);
    }
  }
  if (!pairs.length) throw new Error('No audio clips found in that ZIP');
  const itemTexts = new Set(items.map((c) => c.text));
  let matched = 0;
  for (let i = 0; i < pairs.length; i++) {
    onStatus(`Importing ${i + 1}/${pairs.length}\u2026`);
    const blob = new Blob([pairs[i].data], { type: pairs[i].mime });
    const ids = [...new Set((pairs[i].voiceIds || []).filter(Boolean))];
    for (const vid of ids) {
      const key = elClipKey(vid, pairs[i].text);
      await elIdbPut(key, blob);
      if (!ELCache.mem.has(key)) ELCache.mem.set(key, { blob, url: URL.createObjectURL(blob) });
    }
    if (itemTexts.has(pairs[i].text)) matched++;
  }
  ELCache.notify();
  return { imported: pairs.length, matched, total: items.length };
}

Object.assign(window, { elExportClipsZip, elImportClipsZip, zipBuild, zipParse });
