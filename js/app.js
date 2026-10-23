/* 直笛小幫手 主程式：指法表、記憶遊戲、小測驗、小作曲、我的作品 */
import { NOTES, NOTE, LEVELS, SYSTEMS, label, fingersOf, fingerOf, hasFinger, levelNotes, fingerSVG, staffSVG, singleNoteAbc, SINGLE } from './music.js?v=5';
import { playNote, playMelody, renderWav, renderAudio, renderMp3 } from './audio.js?v=5';
import * as store from './store.js?v=5';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const db = store.data();
const sys = () => db.prefs.system;
const sysLabel = (s = sys()) => SYSTEMS.find((x) => x.id === s)?.full || s;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

let toastT = 0;
function toast(html, ms = 2200) {
  const t = $('#toast'); t.innerHTML = html; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

// 一個音的按鈕：唱名、音名、指法圖
function noteBtn(n, { h = 64, attrs = '', showWait = true } = {}) {
  const f = fingerOf(n, sys());
  return `<button class="nbtn ${f ? '' : 'wait'}" style="--c:${n.color}" data-id="${n.id}" ${attrs}>
    <b>${n.hi ? `<small>${n.id.endsWith('6') ? '超高音' : '高音'}</small>` : ''}${n.sol}</b>${fingerSVG(f, { h })}<small>${n.name}</small>${!f && showWait ? '<span class="w">等待老師提供</span>' : ''}</button>`;
}

/* ---------------- 分頁與英式／德式切換 ---------------- */
const tabs = { chart: () => chart.render(), memory: () => memory.render(), quiz: () => quiz.render(), compose: () => compose.render(), works: () => works.render() };
let curTab = 'chart';
function showTab(id) {
  if (curTab !== id) { memory.stop(); quiz.stop(); compose.stop(); }
  curTab = id;
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === id));
  $$('.pane').forEach((p) => (p.hidden = p.id !== id));
  tabs[id]();
  try { history.replaceState(null, '', '#' + id); } catch { /* file:// */ }
}
$$('.tabs button').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));

function setSys(s, rerender = true) {
  s = 'english'; db.prefs.system = s; store.save();
  $$('.sys button').forEach((b) => b.setAttribute('aria-checked', b.dataset.sys === s));
  if (rerender) { memory.stop(); quiz.stop(); tabs[curTab](); }
}
$$('.sys button').forEach((b) => (b.onclick = () => { setSys(b.dataset.sys); compose.onSys(); toast(`已切換成${sysLabel()}指法`); }));

/* 分級選擇（記憶遊戲和測驗共用） */
function levelPicker(root, cur, onPick) {
  root.innerHTML = LEVELS.map((lv) => {
    const { ready } = levelNotes(lv, sys());
    return `<button data-lv="${lv.id}" ${ready ? '' : 'disabled'} class="${lv.id === cur ? 'sel' : ''} ${ready ? '' : 'wait'}"><b>${lv.label}</b><small>${lv.desc}</small>${lv.provisional ? '<span class="trial">試用版・進度待老師確認</span>' : ''}${ready ? '' : `<span class="w">⏳ 等待老師提供${lv.pending && !lv.notes?.length ? '進度' : '指法'}</span>`}</button>`;
  }).join('');
  const selected = LEVELS.find((lv) => lv.id === cur);
  if (selected?.provisional) {
    const notes = levelNotes(selected, sys()).notes.map((n) => label(n)).join('、');
    root.insertAdjacentHTML('beforeend', `<div class="level-preview"><b>進度暫定，待老師確認</b><p>這級練習：${esc(notes)}</p><small>先依目前提供的範圍試排，請老師協助確認；未確定的音暫不加入。</small></div>`);
  }
  $$('button', root).forEach((b) => (b.onclick = () => {
    const lv = LEVELS.find((l) => l.id === b.dataset.lv);
    if (!levelNotes(lv, sys()).ready) { toast(`「${lv.label}」還在等音樂老師提供${sysLabel()}指法喔`); return; }
    onPick(lv.id);
  }));
}
const firstReady = (cur) => (levelNotes(LEVELS.find((l) => l.id === cur) || LEVELS[0], sys()).ready ? cur : LEVELS.find((l) => levelNotes(l, sys()).ready)?.id || LEVELS[0].id);

/* ---------------- 1. 指法表 ---------------- */
const chart = {
  sel: 'G4',
  render() {
    const pane = $('#chart');
    $('.chart-grid', pane).innerHTML = NOTES.map((n) => noteBtn(n, { h: 80 })).join('');
    $$('.nbtn', pane).forEach((b) => (b.onclick = () => { this.sel = b.dataset.id; this.detail(); playNote(NOTE[this.sel].hz, 0.8); }));
    this.detail();
    const g = (inner) => `<svg viewBox="0 0 30 30" style="height:34px">${inner}</svg>`;
    const C = '#1f3a4d';
    $('.legend-body', pane).innerHTML = `
      <figure>${fingerSVG('0|0000000', { h: 150, showNums: true }).replace('aria-label="指法圖"', 'aria-label="孔的編號"')}<figcaption>孔的編號（只是編號）</figcaption></figure>
      <ul>
        <li>${g(`<circle cx="15" cy="15" r="9" fill="${C}" stroke="${C}" stroke-width="2"/>`)} 塗黑：按住</li>
        <li>${g(`<circle cx="15" cy="15" r="9" fill="#fff" stroke="${C}" stroke-width="2"/>`)} 空心：打開</li>
        <li>${g(`<circle cx="15" cy="15" r="9" fill="#fff" stroke="${C}" stroke-width="2"/><path d="M15 6 A9 9 0 0 0 15 24 Z" fill="${C}"/>`)} 塗一半：前方單孔的半孔示意</li>
        <li>${g(`<circle cx="15" cy="15" r="9" fill="#fff" stroke="${C}" stroke-width="2" stroke-dasharray="3 2"/>`)} 左邊虛線圈（0）：笛子<b>後面</b>的拇指孔</li>
        <li>拇指孔上方留白縫：留一細縫，不是打開一半</li>
        <li>第 6、7 孔是兩個小孔：兩個都塗黑＝全按；只塗大的＝只按住一個小孔</li>
        <li>第 8 孔是笛尾：塗黑表示用膝蓋或手蓋住</li>
        <li>目前是<b>${sysLabel()}</b>指法</li>
      </ul>`;
  },
  detail() {
    const pane = $('#chart'), n = NOTE[this.sel], f = fingerOf(n, sys());
    $$('.nbtn', pane).forEach((b) => b.classList.toggle('sel', b.dataset.id === this.sel));
    const box = $('.detail', pane);
    box.innerHTML = `<div class="dfing">${f ? fingersOf(n, sys()).map((v, i, a) => `<figure>${fingerSVG(v, { h: 220, showNums: true })}${a.length > 1 ? `<figcaption>指法 ${i ? 'II' : 'I'}</figcaption>` : ''}</figure>`).join('') : fingerSVG(null, { h: 220 })}</div>
      <div class="dinfo">
        <div class="dname" style="color:${n.color === '#fdd835' ? '#c9a800' : n.color}">${label(n)}<small>${n.name}</small></div>
        <div class="dstaff"></div>
        ${f ? `<p>${sysLabel()}指法</p>` : `<div class="waitbox">⏳ 這個音的${sysLabel()}指法<b>等待老師提供</b></div>`}
        <button class="big again">🔊 再聽一次</button>
      </div>`;
    staffSVG($('.dstaff', box), singleNoteAbc(n), SINGLE);
    $('.again', box).onclick = () => playNote(n.hz, 0.9);
  },
};

/* ---------------- 2. 記憶遊戲（沿用 3D 校園直笛遊戲：老師吹一段，照順序按回去，每過一關多一個音） ---------------- */
const memory = {
  lv: 'starter', run: 0,
  render() {
    const pane = $('#memory');
    this.lv = firstReady(this.lv);
    levelPicker($('.levels', pane), this.lv, (id) => { this.stop(); this.lv = id; this.render(); });
    this.pool = levelNotes(LEVELS.find((l) => l.id === this.lv), sys()).notes;
    $('.keys', pane).innerHTML = this.pool.map((n, k) => noteBtn(n, { h: 84, attrs: `data-k="${k}" disabled` }).replace(`<small>${n.name}`, `<small>${n.name}・${k + 1}`)).join('');
    this.btns = $$('.keys .nbtn', pane);
    this.btns.forEach((b) => (b.onclick = () => this.press(+b.dataset.k)));
    $('.go', pane).onclick = () => this.start();
    $('.go', pane).hidden = false;
    $('.lv', pane).textContent = '準備好了嗎？';
    $('.lives', pane).textContent = ''; $('.prog', pane).innerHTML = '';
    this.msg('老師會吹一段旋律，你照順序按回去！每過一關多一個音。');
    this.showBest();
  },
  best() { return db.records.memory[`${sys()}:${this.lv}`] || 0; },
  showBest() { const b = this.best(); $('#memory .best').textContent = b ? `🏅 最佳紀錄：第 ${b} 關` : '🏅 還沒有紀錄，加油！'; },
  msg(t, cls = '') { const m = $('#memory .msg'); m.innerHTML = t; m.className = `msg ${cls}`; },
  stop() { this.run++; this.listening = false; this.btns?.forEach((b) => (b.disabled = true)); },
  level() { return this.seq.length - 2; },                           // 第 1 關 3 個音
  show() {
    const pane = $('#memory');
    $('.lv', pane).textContent = `第 ${this.level()} 關`;
    $('.lives', pane).textContent = '❤️'.repeat(this.lives) + '🤍'.repeat(2 - this.lives);
    $('.prog', pane).innerHTML = this.seq.map((k, i) => `<i style="${i < this.pos ? `background:${this.pool[k].color}` : ''}"></i>`).join('');
    this.showBest();
  },
  light(k, ms) { const b = this.btns[k]; b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), ms); },
  addNote() {                                                          // 隨機加一個音（不要同一個音連續出現三次）
    let k;
    do k = Math.random() * this.pool.length | 0; while (this.seq.length >= 2 && this.seq.at(-1) === k && this.seq.at(-2) === k);
    this.seq.push(k);
  },
  start() {
    this.stop();
    $('#memory .go').hidden = true;
    this.seq = []; this.pos = 0; this.lives = 2;
    for (let i = 0; i < 3; i++) this.addNote();
    this.teacherPlays();
  },
  async teacherPlays() {
    const run = ++this.run;
    this.listening = false; this.btns.forEach((b) => (b.disabled = true)); this.pos = 0; this.show();
    this.msg('🎵 老師吹給你聽，仔細聽喔…');
    await wait(800);
    const step = Math.max(400, 650 - this.seq.length * 20);           // 越後面吹得越快一點
    for (const k of this.seq) {
      if (run !== this.run) return;
      playNote(this.pool[k].hz, step / 1000 * 0.85); this.light(k, step * 0.8);
      await wait(step);
    }
    if (run !== this.run) return;
    this.listening = true; this.btns.forEach((b) => (b.disabled = false));
    this.msg(`換你吹！照順序按出這 ${this.seq.length} 個音`);
  },
  press(k) {
    if (!this.listening || !this.pool[k]) return;
    const run = this.run;
    playNote(this.pool[k].hz, 0.35); this.light(k, 260);
    if (k === this.seq[this.pos]) {
      this.pos++; this.show();
      if (this.pos < this.seq.length) return;
      this.listening = false; this.btns.forEach((b) => (b.disabled = true));
      if (this.level() > this.best()) { db.records.memory[`${sys()}:${this.lv}`] = this.level(); store.save(); this.showBest(); }
      this.msg(['✅ 全部吹對了！', '✅ 好好聽！', '✅ 音感真好！'][Math.random() * 3 | 0] + '下一關多一個音', 'ok');
      setTimeout(() => { if (run !== this.run) return; this.addNote(); this.teacherPlays(); }, 1500);
      return;
    }
    this.lives--; this.listening = false; this.btns.forEach((b) => (b.disabled = true)); this.show();
    const right = label(this.pool[this.seq[this.pos]]);
    if (this.lives > 0) {
      this.msg(`❌ 第 ${this.pos + 1} 個音應該是 ${right}，老師再吹一次給你聽`, 'no');
      setTimeout(() => { if (run === this.run) this.teacherPlays(); }, 1800);
      return;
    }
    const lv = this.level() - 1;
    this.msg(`❌ 第 ${this.pos + 1} 個音應該是 ${right}。` + (lv > 0 ? `你過了 ${lv} 關，很棒喔！` : '沒關係，多聽幾次就記得了！'), 'no');
    $('#memory .go').hidden = false; $('#memory .go').textContent = '▶ 再玩一次';
  },
};
addEventListener('keydown', (e) => {
  if (curTab !== 'memory' || e.target.closest?.('input,select,textarea')) return;
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (m) { e.preventDefault(); memory.press(+m[1] - 1); }
});

/* ---------------- 3. 小測驗：看指法猜音／看五線譜選指法 ---------------- */
const quiz = {
  mode: 'f2n', lv: 'starter', total: 10, run: 0,
  render() {
    const pane = $('#quiz');
    this.lv = firstReady(this.lv);
    $$('.qmodes button', pane).forEach((b) => {
      b.classList.toggle('sel', b.dataset.qm === this.mode);
      b.onclick = () => { this.stop(); this.mode = b.dataset.qm; this.render(); };
    });
    levelPicker($('.levels', pane), this.lv, (id) => { this.stop(); this.lv = id; this.render(); });
    this.pool = levelNotes(LEVELS.find((l) => l.id === this.lv), sys()).notes;
    $('.qno', pane).textContent = this.mode === 'f2n' ? '看指法，猜是哪個音' : '看五線譜，選出正確的指法';
    $('.qscore', pane).textContent = `共 ${this.total} 題`;
    $('.qask', pane).innerHTML = ''; $('.qopts', pane).innerHTML = '';
    $('.msg', pane).textContent = ''; $('.msg', pane).className = 'msg';
    $('.go', pane).hidden = false; $('.go', pane).textContent = '▶ 開始測驗';
    $('.go', pane).onclick = () => this.start();
    this.showBest();
  },
  key() { return `${sys()}:${this.lv}:${this.mode}`; },
  showBest() { const b = db.records.quiz[this.key()]; $('#quiz .best').textContent = b != null ? `🏅 最高分：${b} / ${this.total}` : ''; },
  stop() { this.run++; },
  start() {
    this.stop();
    $('#quiz .go').hidden = true;
    this.i = 0; this.score = 0;
    // 先打亂音池，完整音域超過 10 音時，每個音也都有機會出題。
    const pool = shuffle(this.pool);
    this.qs = shuffle(Array.from({ length: this.total }, (_, i) => pool[i % pool.length]));
    this.ask();
  },
  ask() {
    const pane = $('#quiz'), n = this.qs[this.i], s = sys();
    this.answered = false;
    $('.qno', pane).textContent = `第 ${this.i + 1} / ${this.total} 題`;
    $('.qscore', pane).textContent = `答對 ${this.score} 題`;
    $('.msg', pane).textContent = this.mode === 'f2n' ? '這是哪個音的指法？' : '這個音要怎麼按？';
    $('.msg', pane).className = 'msg';
    const opts = shuffle([n, ...shuffle(this.pool.filter((x) => x !== n)).slice(0, 3)]);
    if (this.mode === 'f2n') {
      $('.qask', pane).innerHTML = fingerSVG(fingerOf(n, s), { h: 200 });
      $('.qopts', pane).innerHTML = opts.map((o) => `<button data-id="${o.id}">${label(o)}<small>${o.name}</small></button>`).join('');
    } else {
      $('.qask', pane).innerHTML = '<div class="qstaff"></div>';
      staffSVG($('.qstaff', pane), singleNoteAbc(n), SINGLE);
      $('.qopts', pane).innerHTML = opts.map((o) => `<button data-id="${o.id}">${fingerSVG(fingerOf(o, s), { h: 120 })}</button>`).join('');
    }
    $$('.qopts button', pane).forEach((b) => (b.onclick = () => this.answer(b, n)));
  },
  answer(b, n) {
    if (this.answered) return;
    this.answered = true;
    const pane = $('#quiz'), ok = b.dataset.id === n.id, run = this.run;
    playNote(n.hz, 0.6);
    $$('.qopts button', pane).forEach((x) => x.dataset.id === n.id && x.classList.add('right'));
    if (ok) this.score++; else b.classList.add('wrong');
    const m = $('.msg', pane);
    m.textContent = ok ? ['✅ 答對了！', '✅ 好厲害！', '✅ 沒錯！'][Math.random() * 3 | 0] : `❌ 答案是 ${label(n)}（${n.name}）`;
    m.className = `msg ${ok ? 'ok' : 'no'}`;
    $('.qscore', pane).textContent = `答對 ${this.score} 題`;
    setTimeout(() => {
      if (run !== this.run) return;
      if (++this.i < this.total) { this.ask(); return; }
      const k = this.key(), old = db.records.quiz[k];
      if (old == null || this.score > old) { db.records.quiz[k] = this.score; store.save(); }
      $('.qask', pane).innerHTML = `<div style="font-size:56px">${this.score >= 9 ? '🏆' : this.score >= 6 ? '🎉' : '💪'}</div>`;
      $('.qopts', pane).innerHTML = '';
      m.textContent = `測驗結束！答對 ${this.score} / ${this.total} 題` + (old == null || this.score > old ? '，新紀錄！' : '');
      m.className = 'msg ok';
      this.showBest();
      $('.go', pane).hidden = false; $('.go', pane).textContent = '▶ 再測一次';
    }, ok ? 1000 : 1800);
  },
};

/* ---------------- 4. 小作曲：選節奏、選音，寫 4～8 小節 ---------------- */
// d 的單位是八分音符：8 全音符、6 附點二分、4 二分、3 附點四分、2 四分、1 八分
const DURS = [
  { d: 8, sym: '𝅝', name: '全音符', beat: '4 拍' },
  { d: 6, sym: '𝅗𝅥.', name: '附點二分', beat: '3 拍' },
  { d: 4, sym: '𝅗𝅥', name: '二分音符', beat: '2 拍' },
  { d: 3, sym: '♩.', name: '附點四分', beat: '1 拍半' },
  { d: 2, sym: '♩', name: '四分音符', beat: '1 拍' },
  { d: 1, sym: '♪', name: '八分音符', beat: '半拍' },
];
const unitsPerBar = (w) => (+w.meter.split('/')[0]) * 2;

// 把音排進小節：回傳每個音在第幾小節、小節內位置；有音跨小節或超過小節數就 ok=false
function layout(w) {
  const upb = unitsPerBar(w), out = [];
  let bar = 0, pos = 0;
  for (const n of w.notes) {
    if (pos + n.d > upb || bar >= w.bars) return { ok: false, out };
    out.push({ bar, pos });
    pos += n.d;
    if (pos === upb) { bar++; pos = 0; }
  }
  return { ok: true, out, bar, pos, upb, full: bar >= w.bars };
}

// 作品 → abc 字串；charMap: abc 字元位置 → 第幾個音（點五線譜上的音用）
function workAbc(w, { tempo = false } = {}) {
  const L = layout(w), upb = unitsPerBar(w);
  let abc = `X:1\nM:${w.meter}\nL:1/8\n${tempo ? `Q:1/4=${w.tempo}\n` : ''}K:C clef=treble\n`;
  const charMap = new Map();
  w.notes.forEach((n, i) => {
    const { pos } = L.out[i] || { pos: 0 };
    const tok = (n.p === 'rest' ? 'z' : NOTE[n.p]?.abc || 'z') + (n.d === 1 ? '' : n.d);
    charMap.set(abc.length, i);
    abc += tok;
    const end = pos + n.d, nx = w.notes[i + 1];
    if (end === upb) abc += ' | ';
    else if (!(n.d === 1 && pos % 2 === 0 && nx?.d === 1 && nx.p !== 'rest' && n.p !== 'rest')) abc += ' ';   // 同一拍的兩個八分音符連在一起
  });
  // 還沒寫的地方用看不見的休止符（x）佔位，讓小節數看得出來
  let bar = L.bar ?? 0, pos = L.pos ?? 0;
  while (bar < w.bars) {
    abc += `x${upb - pos} | `;
    bar++; pos = 0;
  }
  abc = abc.replace(/\|\s*$/, '|]');
  if (!w.notes.length && !abc.includes('x')) abc += '|]';
  return { abc, charMap };
}

const noteLabel = (p) => (p === 'rest' ? '休止' : label(NOTE[p]));

const compose = {
  w: null, sel: -1, dur: 2, stopFn: null,
  ensure() {
    if (this.w) return;
    const d = db.draft && store.parseWorkFile(JSON.stringify(db.draft))[0];
    this.w = d ? { ...d, imported: db.draft.imported, id: db.draft.id } : store.newWork();
    this.w.system = 'english';
  },
  open(w) { this.stop(); this.w = { ...JSON.parse(JSON.stringify(w)), system: 'english' }; this.sel = -1; if (w.system !== sys()) setSys(w.system, false); this.draft(); showTab('compose'); },
  draft() { db.draft = this.w; store.save(); },
  onSys() { if (this.w) { this.w.system = sys(); this.draft(); } },
  render() {
    this.ensure();
    const pane = $('#compose'), w = this.w;
    $('.title', pane).value = w.title;
    $('.title', pane).oninput = (e) => { w.title = e.target.value; this.draft(); };
    $('.meter', pane).value = w.meter;
    $('.meter', pane).onchange = (e) => this.tryChange(() => (w.meter = e.target.value), '改拍號後有音會跨小節，請先調整或清空');
    $('.bars', pane).value = w.bars;
    $('.bars', pane).onchange = (e) => this.tryChange(() => (w.bars = +e.target.value), '音太多了，請先刪掉後面的音再減少小節');
    $('.tempo', pane).value = w.tempo; $('.tempoV', pane).textContent = `♩=${w.tempo}`;
    $('.tempo', pane).oninput = (e) => { w.tempo = +e.target.value; $('.tempoV', pane).textContent = `♩=${w.tempo}`; this.draft(); };
    $('.pitches', pane).innerHTML = NOTES.filter((n) => hasFinger(n, sys())).map((n) => noteBtn(n, { h: 54 })).join('')
      + '<button class="nbtn rest" data-id="rest"><b>休止符</b><small>不吹</small></button>';
    $$('.pitches .nbtn', pane).forEach((b) => (b.onclick = () => this.pick(b.dataset.id)));
    $('.play', pane).onclick = () => (this.stopFn ? this.stop() : this.play());
    $('.del', pane).onclick = () => this.del();
    $('.clear', pane).onclick = () => { if (!w.notes.length || confirm('確定要清空所有音符嗎？')) { w.notes = []; this.sel = -1; this.update(); } };
    $('.savew', pane).onclick = () => this.save();
    $('.out', pane).onclick = () => { this.save(true); out.open(this.w); };
    this.update();
  },
  tryChange(fn, err) {
    const bak = JSON.stringify(this.w);
    fn();
    if (!layout(this.w).ok) { Object.assign(this.w, JSON.parse(bak)); toast(err); this.render(); return; }
    this.update();
  },
  pick(p) {
    const w = this.w;
    if (p !== 'rest') playNote(NOTE[p].hz, Math.min(1, this.dur * 0.18 + 0.2));
    if (this.sel >= 0) { w.notes[this.sel].p = p; this.update(); return; }   // 有選取：換成這個音
    const L = layout(w);
    if (L.full) { toast('小節都寫滿了！可以增加小節，或點譜上的音來修改'); return; }
    if (L.pos + this.dur > L.upb) { toast('這一小節剩下的拍子不夠放這個音符，換短一點的音符吧'); return; }
    w.notes.push({ p, d: this.dur });
    this.update();
  },
  setDur(d) {
    this.dur = d;
    if (this.sel >= 0) {
      const w = this.w, old = w.notes[this.sel].d;
      w.notes[this.sel].d = d;
      if (!layout(w).ok) { w.notes[this.sel].d = old; toast('改成這個音符會跨過小節線，不能這樣改'); }
    }
    this.update();
  },
  del() {
    const w = this.w;
    if (!w.notes.length) return;
    if (this.sel >= 0) {
      const removed = w.notes.splice(this.sel, 1)[0];
      if (!layout(w).ok && removed.p !== 'rest') {                    // 中間刪掉會讓後面的音跨小節 → 改成一樣長的休止符
        w.notes.splice(this.sel, 0, { p: 'rest', d: removed.d });
        toast('換成一樣長的休止符，後面的小節才不會亂掉');
      } else {
        if (!layout(w).ok) toast('刪掉後有音跨小節了，請再調整');
        this.sel = -1;
      }
    }
    else w.notes.pop();
    this.update();
  },
  update(now = -1) {
    const pane = $('#compose'), w = this.w, L = layout(w);
    // 節奏按鈕：放不下的變灰
    $('.durs', pane).innerHTML = DURS.map((x) => {
      const fit = this.sel >= 0 || (!L.full && L.ok && (L.pos ?? 0) + x.d <= L.upb);
      return `<button data-d="${x.d}" class="${x.d === this.dur ? 'sel' : ''}" ${fit ? '' : 'disabled'}><span class="sym">${x.sym}</span><span>${x.name}<br><small>${x.beat}</small></span></button>`;
    }).join('');
    $$('.durs button', pane).forEach((b) => (b.onclick = () => this.setDur(+b.dataset.d)));
    // 五線譜
    const { abc, charMap } = workAbc(w);
    const tune = staffSVG($('.staff', pane), abc, {
      staffwidth: 760, wrap: { minSpacing: 1.8, maxSpacing: 2.8, preferredMeasuresPerLine: 4 },
      clickListener: (el) => { const i = charMap.get(el.startChar); if (i == null) return; this.sel = this.sel === i ? -1 : i; this.update(); },
    });
    this.els = new Map();
    for (const line of tune?.lines || []) for (const st of line.staff || []) for (const v of st.voices || []) for (const el of v) {
      const i = charMap.get(el.startChar);
      if (i != null && el.abselem?.elemset) this.els.set(i, el.abselem.elemset);
    }
    const paint = (i, c) => this.els.get(i)?.forEach((e) => { e.setAttribute('fill', c); e.querySelectorAll?.('*').forEach((x) => x.setAttribute('fill', c)); });
    if (this.sel >= 0) paint(this.sel, '#e67e22');
    if (now >= 0) paint(now, NOTE[w.notes[now].p]?.color || '#999');
    // 指法列（每小節之間一條線）
    let html = '', lastBar = 0;
    w.notes.forEach((n, i) => {
      const b = L.out[i]?.bar ?? lastBar;
      if (b !== lastBar) { html += '<span class="bar"></span>'; lastBar = b; }
      const nn = NOTE[n.p];
      html += `<div class="fcell ${i === this.sel ? 'sel' : ''} ${i === now ? 'now' : ''}" data-i="${i}" style="--c:${nn?.color || '#ddd'}">`
        + (n.p === 'rest' ? '<div style="height:80px;display:flex;align-items:center;font-size:26px">𝄽</div>' : fingerSVG(fingerOf(nn, sys()), { h: 80 }))
        + `<small>${noteLabel(n.p)}</small></div>`;
    });
    $('.frow', pane).innerHTML = html || '<span class="hint">先選節奏（例如 ♩ 四分音符），再點下面的音，就會寫進譜裡。</span>';
    $$('.fcell', pane).forEach((c) => (c.onclick = () => { this.sel = this.sel === +c.dataset.i ? -1 : +c.dataset.i; this.update(); }));
    if (now >= 0) $(`.fcell[data-i="${now}"]`, pane)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    // 狀態
    const st = $('.status', pane);
    if (!L.ok) st.textContent = '⚠ 有音符跨過小節線，請刪掉或修改';
    else if (this.sel >= 0) st.textContent = `已選第 ${this.sel + 1} 個音（${noteLabel(w.notes[this.sel].p)}）：點音可以換音、點節奏可以換長短、按「刪除」刪掉，再點一次取消選取`;
    else if (L.full) st.textContent = `🎉 ${w.bars} 小節都寫好了！按「播放」聽聽看，再按「儲存」`;
    else st.textContent = `正在寫第 ${L.bar + 1} 小節，還剩 ${(L.upb - L.pos) / 2} 拍（共 ${w.bars} 小節）`;
    $('.play', pane).textContent = this.stopFn ? '■ 停止' : '▶ 播放';
    if (now < 0) this.draft();
  },
  events() { return this.w.notes.map((n) => ({ hz: n.p === 'rest' ? null : NOTE[n.p]?.hz, beats: n.d / 2 })); },
  play() {
    if (!this.w.notes.length) { toast('先寫幾個音再播放喔'); return; }
    this.sel = -1;
    this.stopFn = playMelody(this.events(), this.w.tempo, (i) => this.update(i), () => { this.stopFn = null; if (curTab === 'compose') this.update(); });
    this.update();
  },
  stop() { const f = this.stopFn; this.stopFn = null; f?.(); },
  save(quiet = false) {
    if (!this.w.title.trim()) this.w.title = '我的直笛小曲';
    this.w.system = sys();
    const ok = store.putWork(this.w);
    this.w.author = store.data().works.find((x) => x.id === this.w.id)?.author || this.w.author;
    this.draft();
    if (!quiet) toast(ok ? '💾 已儲存到這台裝置（可以到「我的作品」查看）' : '⚠ 這台裝置不能存檔（可能是私密瀏覽），請用「輸出／分享」把作品檔存起來');
  },
};

/* ---------------- 5. 輸出：作品卡 PNG、旋律 WAV、作品檔 JSON、分享 ---------------- */
function fileBase(w) {
  const a = w.author || {};
  return [a.cls, a.seat && `${a.seat}號`, a.name, w.title || '直笛小曲'].filter(Boolean).join('-').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60);
}
const whoText = (a = {}) => [a.cls && `${a.cls} 班`, a.seat && `${a.seat} 號`, a.name].filter(Boolean).join(' ') || '（還沒填班級座號姓名）';

// 作品卡：整張用 SVG 組好（標題、五線譜、指法、班級座號姓名）再畫成 PNG
async function cardPng(w) {
  const W = 1200, pad = 50;
  // 五線譜：在畫面外用 abcjs 畫一次
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-10000px;top:0;width:1100px';
  document.body.appendChild(tmp);
  const { abc } = workAbc(w, { tempo: true });
  window.ABCJS?.renderAbc(tmp, abc, { staffwidth: 1080, scale: 1.25, wrap: { minSpacing: 1.8, maxSpacing: 2.8, preferredMeasuresPerLine: 4 }, paddingtop: 0, paddingbottom: 0 });
  const sv = tmp.querySelector('svg');
  let staff = '', sh = 0;
  if (sv) {
    sv.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const sw = +sv.getAttribute('width') || 1100; sh = +sv.getAttribute('height') || 200;
    if (!sv.getAttribute('viewBox')) sv.setAttribute('viewBox', `0 0 ${sw} ${sh}`);
    const k = Math.min(1, (W - pad * 2) / sw); sh *= k;
    sv.setAttribute('x', pad); sv.setAttribute('y', 150); sv.setAttribute('width', sw * k); sv.setAttribute('height', sh);
    sv.removeAttribute('style');
    staff = new XMLSerializer().serializeToString(sv);
  }
  tmp.remove();
  // 指法：一小節一組，排不下就換行
  const L = layout(w), cw = 64, gap = 26, fh = 96;
  let x = pad, y = 150 + sh + 40, fing = '';
  const groups = [];
  w.notes.forEach((n, i) => { const b = L.out[i]?.bar ?? 0; (groups[b] ||= []).push(n); });
  groups.forEach((g, b) => {
    const gw = g.length * cw;
    if (x + gw > W - pad && x > pad) { x = pad; y += fh + 60; }
    fing += `<text x="${x}" y="${y - 8}" font-size="15" fill="#a08a70">第 ${b + 1} 小節</text>`;
    g.forEach((n) => {
      const nn = NOTE[n.p];
      if (n.p === 'rest') fing += `<text x="${x + cw / 2}" y="${y + 60}" font-size="40" text-anchor="middle" fill="#666">𝄽</text>`;
      else fing += fingerSVG(fingerOf(nn, w.system), { h: fh }).replace('<svg ', `<svg x="${x + (cw - 35) / 2}" y="${y}" width="35" height="${fh}" `).replace(/ style="[^"]*"/, '');
      fing += `<text x="${x + cw / 2}" y="${y + fh + 22}" font-size="16" font-weight="700" text-anchor="middle" fill="${n.p === 'rest' ? '#777' : '#3a2f25'}">${esc(noteLabel(n.p))}</text>`;
      x += cw;
    });
    fing += `<line x1="${x + gap / 2 - 4}" y1="${y}" x2="${x + gap / 2 - 4}" y2="${y + fh}" stroke="#e0d4bf" stroke-width="2"/>`;
    x += gap;
  });
  const H = y + fh + 100;
  const date = new Date(w.updatedAt || Date.now()).toLocaleDateString('zh-TW');
  const font = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family='${font}'>
    <rect width="${W}" height="${H}" fill="#fffdf8"/><rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="24" fill="none" stroke="#e6d6bb" stroke-width="4"/>
    <text x="${pad}" y="78" font-size="44" font-weight="800" fill="#7b5b3a">🎵 ${esc(w.title || '我的直笛小曲')}</text>
    <text x="${pad}" y="120" font-size="22" fill="#6a5a48">${esc(whoText(w.author))}　・　${esc(w.meter)} 拍　・　${w.bars} 小節　・　${sysLabel(w.system)}指法</text>
    ${staff}${fing}
    <text x="${pad}" y="${H - 40}" font-size="17" fill="#a08a70">直笛小幫手 ・ ${date}</text>
    <text x="${W - pad}" y="${H - 40}" font-size="17" fill="#a08a70" text-anchor="end">設計者 Upsky（阿喵老師）／工具 Claude Code</text>
  </svg>`;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('作品卡畫不出來')); img.src = url; });
    const c = document.createElement('canvas'), s = 1.5;
    c.width = W * s; c.height = H * s;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob(res, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

function workJson(w) {
  const { imported, ...rest } = w;
  return new Blob([JSON.stringify({ ...rest, app: '直笛小幫手', url: location.origin + location.pathname }, null, 2)], { type: 'application/json' });
}

function download(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
// 分享（iPad 可以選 Gmail、Classroom、儲存到檔案）；不支援就改成下載。要在按鈕的 click 裡直接呼叫，所以檔案先準備好
function shareFiles(files, title) {
  const can = (() => { try { return !!navigator.canShare?.({ files }); } catch { return false; } })();
  if (!can) { files.forEach(download); toast('這個瀏覽器不能直接分享，已改成下載檔案'); return; }
  navigator.share({ files, title }).catch((e) => { if (e?.name !== 'AbortError') { files.forEach(download); toast('分享失敗，已改成下載檔案'); } });
}

const out = {
  async open(w) {
    const dlg = $('#outDlg');
    w = { ...JSON.parse(JSON.stringify(w)), system: 'english' };
    $('.who', dlg).textContent = `${w.title}｜${whoText(w.author)}`;
    $('.preview img', dlg).removeAttribute('src');
    $('.outs', dlg).innerHTML = '<p class="tip">⏳ 正在準備檔案…</p>';
    dlg.showModal?.() ?? dlg.setAttribute('open', '');
    const base = fileBase(w), files = {};
    try {
      const png = await cardPng(w);
      files.png = new File([png], `${base}.png`, { type: 'image/png' });
      $('.preview img', dlg).src = URL.createObjectURL(png);
    } catch (e) { console.warn(e); }
    if (w.notes.some((n) => n.p !== 'rest')) {
      try {
        const audio = await renderAudio(w.notes.map((n) => ({ hz: n.p === 'rest' ? null : NOTE[n.p]?.hz, beats: n.d / 2 })), w.tempo);
        files.wav = new File([await renderWav(null, null, audio)], `${base}.wav`, { type: 'audio/wav' });
        try { files.mp3 = new File([await renderMp3(null, null, audio)], `${base}.mp3`, { type: 'audio/mpeg' }); }
        catch (e) { console.warn(e); toast('MP3 準備失敗，請先下載高音質 WAV', 5000); }
      } catch (e) { console.warn(e); toast('錄音準備失敗，請重新開啟輸出', 5000); }
    }
    files.json = new File([workJson(w)], `${base}.json`, { type: 'application/json' });
    const rows = [
      ['mp3', '🎧 旋律錄音（MP3，預設）', '檔案較小，適合交作業'],
      ['png', '🖼 作品卡（圖片 PNG）', '五線譜＋指法＋班級座號姓名'],
      ['wav', '🎧 高音質錄音（WAV）', '檔案較大，保留完整音質'],
      ['json', '📄 作品檔（JSON）', '之後可以用「匯入作品檔」打開繼續改'],
    ].filter(([k]) => files[k]);
    $('.outs', dlg).innerHTML = rows.map(([k, t, s]) => `<div class="row"><span>${t}<small>${s}・${esc(files[k].name)}</small></span><button type="button" data-share="${k}">分享</button><button type="button" class="dl" data-dl="${k}">下載</button></div>`).join('')
      + '<div class="row all"><span>全部一起</span><button type="button" data-share="all">全部分享</button><button type="button" class="dl" data-dl="all">全部下載</button></div>';
    const pick = (k) => (k === 'all' ? ['mp3', 'png', 'json'].map((key) => files[key]).filter(Boolean) : [files[k]]);
    $$('[data-share]', dlg).forEach((b) => (b.onclick = () => shareFiles(pick(b.dataset.share), w.title)));
    $$('[data-dl]', dlg).forEach((b) => (b.onclick = () => pick(b.dataset.dl).forEach(download)));
  },
};

/* ---------------- 6. 我的作品：班級座號姓名、作品清單、匯入 ---------------- */
const works = {
  render() {
    const pane = $('#works'), p = db.profile;
    for (const k of ['cls', 'seat', 'name']) {
      const inp = $(`.${k}`, pane);
      inp.value = p[k] || '';
      inp.oninput = () => { p[k] = inp.value.trim(); store.save(); };
    }
    const list = $('.wlist', pane);
    list.innerHTML = db.works.length ? db.works.map((w) => `<li data-id="${esc(w.id)}"><div class="wt"><b>${esc(w.title)}</b>
      <small>${esc(whoText(w.author))}・${w.notes.length} 個音・${w.bars} 小節・${sysLabel(w.system)}・${new Date(w.updatedAt).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' })}${w.imported ? '・匯入' : ''}</small></div>
      <button class="op">✏️ 打開</button><button class="ex">📤 輸出</button><button class="rm">刪除</button></li>`).join('')
      : '<li class="empty">還沒有作品。到「小作曲」寫一首，按「儲存」就會出現在這裡。</li>';
    $$('li[data-id]', list).forEach((li) => {
      const w = db.works.find((x) => x.id === li.dataset.id);
      $('.op', li).onclick = () => compose.open(w);
      $('.ex', li).onclick = () => out.open(w);
      $('.rm', li).onclick = () => { if (confirm(`確定要刪除「${w.title}」嗎？刪掉就找不回來了。`)) { store.removeWork(w.id); this.render(); } };
    });
    $('.neww', pane).onclick = () => { compose.open(store.newWork()); };
    const file = $('.imp input', pane);
    file.onchange = async () => {
      const f = file.files[0]; file.value = '';
      if (!f) return;
      try {
        const got = store.parseWorkFile(await f.text());
        let n = 0;
        for (const w of got) {
          if (db.works.some((x) => x.id === w.id) && !confirm(`「${w.title}」已經有了，要用匯入的檔案取代嗎？`)) continue;
          store.putWork(w); n++;
        }
        this.render();
        toast(n ? `📥 匯入了 ${n} 份作品` : '沒有匯入任何作品');
      } catch (e) { toast(`⚠ 匯入失敗：${esc(e.message || '檔案格式不對')}`, 3500); }
    };
  },
};

/* ---------------- 啟動 ---------------- */
setSys(db.prefs.system === 'german' ? 'german' : 'english', false);
showTab(tabs[location.hash.slice(1)] ? location.hash.slice(1) : 'chart');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* 不能離線也沒關係 */ }));
}

window.__rh = { db, compose, memory, quiz, out, cardPng, renderWav, renderMp3 };   // 測試用
