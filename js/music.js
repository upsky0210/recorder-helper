/* 音、指法、分級的共用工具：指法圖（SVG）、五線譜（abcjs） */
import { NOTES, LEVELS, SYSTEMS } from '../data/fingerings.js?v=5';

export { NOTES, LEVELS, SYSTEMS };
export const NOTE = Object.fromEntries(NOTES.map((n) => [n.id, n]));
export const label = (n) => (n.id.endsWith('6') ? '超高音' : n.hi ? '高音' : '') + n.sol;
export const fingersOf = (n, sys) => {
  const f = n?.finger?.[sys];
  return Array.isArray(f) ? f.filter(Boolean) : f ? [f] : [];
};
export const fingerOf = (n, sys) => fingersOf(n, sys)[0] || null;
export const hasFinger = (n, sys) => !!fingerOf(n, sys);

// 某一級在某個指法系統下用到的音；回傳 { notes, ready, missing }
export function levelNotes(lv, sys) {
  const list = lv.all ? NOTES.filter((n) => lv.semi || !n.semi) : (lv.notes || []).map((id) => NOTE[id]).filter(Boolean);
  const missing = list.filter((n) => !hasFinger(n, sys));
  let ready = list.length >= 3 && !missing.length && !(lv.pending && !lv.notes?.length);
  if (lv.needSemi && !list.some((n) => n.semi)) ready = false;        // 資料裡還沒有半音
  return { notes: list, ready, missing };
}

/* 指法字串 → { thumb, holes[7], end }；end 未提供時為 null，其餘是 on／off／half。 */
export function parseFinger(f) {
  const [th, fr = '', end] = String(f).split('|');
  const v = (ch) => (ch === '1' ? 'on' : ch === 'h' ? 'half' : 'off');
  return { thumb: v(th), holes: [...fr.padEnd(7, '0')].slice(0, 7).map(v), end: end == null ? null : v(end) };
}

/* 指法圖：直立的直笛，左邊虛線圈是後面的拇指孔，前面 7 個孔，第 6、7 孔是雙孔 */
export function fingerSVG(f, { h = 150, color = '#1f3a4d', body = '#f6e7c8', showNums = false } = {}) {
  if (!f) {
    return `<svg class="fsvg" viewBox="0 0 64 176" style="height:${h}px" aria-label="等待老師提供"><rect x="22" y="4" width="22" height="168" rx="10" fill="#eee" stroke="#bbb" stroke-dasharray="4 3"/><text x="33" y="94" font-size="22" text-anchor="middle" fill="#aaa">?</text></svg>`;
  }
  const { thumb, holes, end } = parseFinger(f);
  const ys = [26, 46, 66, 92, 112, 134, 154];
  const fill = (s) => (s === 'on' ? color : '#fff');
  const half = (cx, cy, r) => `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r} Z" fill="${color}"/>`;
  let s = `<svg class="fsvg" viewBox="0 0 64 176" style="height:${h}px" role="img" aria-label="指法圖">`;
  s += `<rect x="22" y="4" width="22" height="168" rx="10" fill="${body}" stroke="#a08055" stroke-width="1.5"/>`;
  s += `<rect x="25" y="4" width="16" height="8" rx="3" fill="#e2c99a"/>`;
  // 後面拇指孔（虛線）
  s += `<circle cx="9" cy="${ys[0]}" r="6.5" fill="${fill(thumb)}" stroke="${color}" stroke-width="1.6"${thumb === 'off' ? ' stroke-dasharray="2.6 1.8"' : ''}/>`;
  // 拇指留一細縫：上方白色小弓形；前方單孔仍使用半孔圖示。
  if (thumb === 'half') s += `<path d="M3.8 ${ys[0] - 3.9} L14.2 ${ys[0] - 3.9} A6.5 6.5 0 1 1 3.8 ${ys[0] - 3.9} Z" fill="${color}"/>`;
  s += `<line x1="15.5" y1="${ys[0]}" x2="21" y2="${ys[0]}" stroke="#a08055" stroke-width="1" stroke-dasharray="2 2"/>`;
  holes.forEach((st, i) => {
    const y = ys[i];
    if (i >= 5) {                                                      // 雙孔：大孔＋小孔，按一半＝只按住大孔
      s += `<circle cx="30" cy="${y}" r="4.6" fill="${st === 'off' ? '#fff' : color}" stroke="${color}" stroke-width="1.5"/>`;
      s += `<circle cx="39" cy="${y}" r="3.4" fill="${st === 'on' ? color : '#fff'}" stroke="${color}" stroke-width="1.5"/>`;
    } else {
      s += `<circle cx="33" cy="${y}" r="6.5" fill="${fill(st)}" stroke="${color}" stroke-width="1.6"/>`;
      if (st === 'half') s += half(33, y, 6.5);
    }
    if (showNums) s += `<text x="52" y="${y + 3.5}" font-size="10" fill="#8a7a66">${i + 1}</text>`;
  });
  if (showNums) s += `<text x="9" y="${ys[0] + 18}" font-size="9" text-anchor="middle" fill="#8a7a66">0</text>`;
  if (end != null) {
    s += `<circle cx="33" cy="168" r="5" fill="${fill(end)}" stroke="${color}" stroke-width="1.5"/><text x="52" y="172" font-size="10" fill="#8a7a66">8</text>`;
    if (end === 'half') s += half(33, 168, 5);
  }
  return s + '</svg>';
}

/* abcjs 五線譜 */
export function staffSVG(el, abc, opts = {}) {
  el.innerHTML = '';
  if (!window.ABCJS) { el.textContent = '（五線譜載入失敗）'; return null; }
  return window.ABCJS.renderAbc(el, abc, { responsive: 'resize', add_classes: true, paddingtop: 4, paddingbottom: 4, paddingleft: 4, paddingright: 4, ...opts })[0];
}
export const singleNoteAbc = (n) => `X:1\n%%stretchlast 1\nL:1/4\nK:C clef=treble\n${n.abc}2|]`;
export const SINGLE = { staffwidth: 110, scale: 2.1, responsive: undefined };
