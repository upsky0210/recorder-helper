/* 直笛聲音：沿用 3D 校園小瑜老師的 WebAudio 合成直笛聲（正弦波＋一點點高八度泛音、輕輕的顫音、柔和的起音）
   同一個 voice() 可以接到喇叭（AudioContext）或離線錄音（OfflineAudioContext → WAV） */

let ac = null;
export function ctx() {
  ac ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// 在 c 這個 AudioContext 的 t 秒排一個音
function voice(c, dest, hz, t, dur, vol = 1) {
  const o = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator();
  const g = c.createGain(), g2 = c.createGain(), lg = c.createGain();
  o.type = 'sine'; o.frequency.value = hz;
  o2.type = 'triangle'; o2.frequency.value = hz * 2; g2.gain.value = 0.06;
  lfo.frequency.value = 5.5; lg.gain.value = hz * 0.004;
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2 * vol, t + 0.05);
  g.gain.setValueAtTime(0.18 * vol, t + Math.max(0.06, dur - 0.1)); g.gain.linearRampToValueAtTime(0, t + dur);
  for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 0.03); }
  return [o, o2, lfo];
}

export function playNote(hz, dur = 0.45) {
  try { const c = ctx(); voice(c, c.destination, hz, c.currentTime + 0.01, dur); } catch { /* 沒有音效也能用 */ }
}

/* 播一段旋律：events = [{ hz | null(休止), beats }]；onStep(i) 每個音開始時呼叫，回傳 stop() */
export function playMelody(events, tempo, onStep, onEnd) {
  const timers = [], nodes = [];
  try {
    const c = ctx(), spb = 60 / tempo;
    let t = c.currentTime + 0.08, ms = 80;
    events.forEach((e, i) => {
      const dur = e.beats * spb;
      if (e.hz) nodes.push(...voice(c, c.destination, e.hz, t, dur * 0.92));
      timers.push(setTimeout(() => onStep?.(i), ms));
      t += dur; ms += dur * 1000;
    });
    timers.push(setTimeout(() => onEnd?.(), ms + 50));
  } catch { setTimeout(() => onEnd?.(), 0); }
  return () => {
    timers.forEach(clearTimeout);
    nodes.forEach((n) => { try { n.stop(); } catch { /* 已經停了 */ } });
    onEnd?.();
  };
}

/* 用 OfflineAudioContext 合成整段旋律，回傳 WAV Blob（44.1kHz、16 位元、單聲道） */
export async function renderWav(events, tempo) {
  const rate = 44100, spb = 60 / tempo;
  const total = events.reduce((s, e) => s + e.beats * spb, 0) + 0.8;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const c = new OAC(1, Math.ceil(total * rate), rate);
  let t = 0.3;
  for (const e of events) {
    const dur = e.beats * spb;
    if (e.hz) voice(c, c.destination, e.hz, t, dur * 0.92, 1.6);
    t += dur;
  }
  const buf = await new Promise((res, rej) => {
    const p = c.startRendering();
    if (p?.then) p.then(res, rej); else c.oncomplete = (ev) => res(ev.renderedBuffer);   // 舊版 Safari
  });
  return wavBlob(buf.getChannelData(0), rate);
}

function wavBlob(data, rate) {
  const n = data.length, out = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return new Blob([out], { type: 'audio/wav' });
}
