// vibe-transcript.jsx — right-side transcript editor.
// Each line is editable; the caption strip and the voiceover read the edited
// text. Click a timestamp to jump there. Edits persist in localStorage.

// Bridges timeline state (time/setTime) out of the Stage to the app shell.
function TimelineBridge({ onCtx }) {
  const ctx = useTimeline();
  React.useEffect(() => { onCtx(ctx); });
  return null;
}

function voFmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TranscriptLine({ item, idx, active, onEdit, onSeek }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '8px 10px', borderRadius: 8,
      background: active ? 'rgba(95,135,255,0.13)' : 'transparent',
      border: active ? '1px solid rgba(95,135,255,0.45)' : '1px solid transparent',
    }}>
      <button onClick={() => onSeek(item.t)} title="Jump to this line"
        style={{
          flexShrink: 0, marginTop: 3, padding: '2px 8px',
          background: active ? 'rgba(95,135,255,0.9)' : 'rgba(255,255,255,0.08)',
          color: active ? '#fff' : 'rgba(246,244,239,0.75)',
          border: 'none', borderRadius: 5, cursor: 'pointer',
          font: '600 11px ui-monospace, SFMono-Regular, monospace',
        }}>{voFmtTime(item.t)}</button>
      <textarea
        value={item.text}
        rows={2}
        onChange={(e) => onEdit(idx, e.target.value)}
        spellCheck={false}
        style={{
          flex: 1, resize: 'vertical', minHeight: 40, fieldSizing: 'content',
          background: 'transparent', color: 'rgba(246,244,239,0.92)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6,
          padding: '5px 8px', font: '13px/1.45 Nunito, system-ui, sans-serif',
          outline: 'none',
        }}></textarea>
    </div>
  );
}

function TranscriptPanel({ items, activeIdx, onEdit, onSeek, onReset, onSave, onExport, onImport, dirty }) {
  const fileRef = React.useRef(null);
  const [importMsg, setImportMsg] = React.useState(null);
  const listRef = React.useRef(null);
  const itemRefs = React.useRef([]);
  // Keep the active line in view (no scrollIntoView — manual scrollTop).
  React.useEffect(() => {
    const list = listRef.current, el = itemRefs.current[activeIdx];
    if (!list || !el) return;
    // Position of the row relative to the scroll container, robust to
    // offsetParent quirks: use bounding rects + current scrollTop.
    const rel = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const viewTop = list.scrollTop, viewBot = list.scrollTop + list.clientHeight;
    if (rel < viewTop + 40 || rel + el.offsetHeight > viewBot - 40) {
      list.scrollTop = Math.max(0, rel - list.clientHeight * 0.35);
    }
  }, [activeIdx]);
  return (
    <div style={{
      width: 390, flexShrink: 0, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#161616', borderLeft: '1px solid rgba(255,255,255,0.09)',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.09)',
        display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ color: '#f6f4ef', fontWeight: 800, fontSize: 15 }}>Transcript</div>
        <div style={{ color: 'rgba(246,244,239,0.45)', fontSize: 11.5, flex: 1 }}>
          edit lines — the voiceover reads them
        </div>
        <button onClick={onReset} title="Restore the original script"
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(246,244,239,0.6)', borderRadius: 5, padding: '2px 8px',
            fontSize: 11, cursor: 'pointer' }}>reset</button>
      </div>
      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) => (
          <div key={i} ref={(el) => { itemRefs.current[i] = el; }}>
            <TranscriptLine item={item} idx={i} active={i === activeIdx}
              onEdit={onEdit} onSeek={onSeek}></TranscriptLine>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.09)',
        display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={onSave} disabled={!dirty}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 7,
            border: 'none', cursor: dirty ? 'pointer' : 'default',
            background: dirty ? 'rgba(95,135,255,0.92)' : 'rgba(255,255,255,0.07)',
            color: dirty ? '#fff' : 'rgba(246,244,239,0.45)',
            font: "700 13px Nunito, system-ui, sans-serif",
          }}>
          {dirty ? 'Save transcript' : 'Transcript saved ✓'}
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onExport}
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
                try { ok = onImport(JSON.parse(txt)); } catch {}
                setImportMsg(ok ? 'Transcript imported ✓' : 'Couldn’t read that file — expected a transcript .json');
                setTimeout(() => setImportMsg(null), 4000);
              });
            }}></input>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(246,244,239,0.45)',
          textAlign: 'center' }}>
          {importMsg ? importMsg
            : dirty ? 'edits live in this browser — download a .json backup to be safe'
            : 'tip: download a .json backup of your script anytime'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TimelineBridge, TranscriptPanel });
