/* 本機存檔：全部放在 localStorage 一個鍵裡（存取都包 try/catch，私密模式或被封鎖時照樣能用，只是不會記住）
   資料只留在這台裝置，不上傳。結構預留第二階段搬到雲端（Firestore）：
     profile           → users/{uid} 的個人資料
     works[]           → users/{uid}/works/{work.id}（每份作品自己有 id、updatedAt，可以直接當文件）
     records           → users/{uid} 的遊戲／測驗最佳紀錄 */

const KEY = 'recorder-helper:v1';
export const WORK_SCHEMA = 'recorder-helper.work';

const blank = () => ({ version: 1, prefs: { system: 'english' }, profile: { cls: '', seat: '', name: '' }, works: [], records: { memory: {}, quiz: {} } });
let db = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) { const d = JSON.parse(raw); db = { ...blank(), ...d, prefs: { ...blank().prefs, ...d.prefs }, records: { ...blank().records, ...d.records } }; }
} catch { /* 讀不到就用空白 */ }

// 目前只有英式課本資料，舊偏好也統一使用英式。
db.prefs.system = 'english';

export const data = () => db;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch { return false; }
}

export const newId = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function newWork() {
  const now = new Date().toISOString();
  return { schema: WORK_SCHEMA, version: 1, id: newId(), title: '我的直笛小曲', meter: '4/4', bars: 4, tempo: 90, system: db.prefs.system, notes: [], author: { ...db.profile }, createdAt: now, updatedAt: now };
}

export function putWork(w) {
  w.updatedAt = new Date().toISOString();
  if (!w.imported) w.author = { ...db.profile };                      // 匯入的作品保留原作者
  const i = db.works.findIndex((x) => x.id === w.id);
  const copy = JSON.parse(JSON.stringify(w));
  if (i >= 0) db.works[i] = copy; else db.works.unshift(copy);
  return save();
}
export function removeWork(id) { db.works = db.works.filter((x) => x.id !== id); save(); }

/* 匯入作品檔：接受單一作品或 { works: [...] }；檢查格式，不合格的丟掉 */
export function parseWorkFile(text) {
  const j = JSON.parse(text);
  const list = Array.isArray(j?.works) ? j.works : [j];
  const ok = list.filter((w) => w && w.schema === WORK_SCHEMA && Array.isArray(w.notes)).map((w) => ({
    schema: WORK_SCHEMA, version: 1, id: String(w.id || newId()), title: String(w.title || '未命名作品').slice(0, 40),
    meter: ['4/4', '3/4', '2/4'].includes(w.meter) ? w.meter : '4/4', bars: Math.min(8, Math.max(4, +w.bars || 4)),
    tempo: Math.min(160, Math.max(50, +w.tempo || 90)), system: w.system === 'german' ? 'german' : 'english',
    notes: w.notes.filter((n) => n && typeof n.p === 'string' && [1, 2, 3, 4, 6, 8].includes(+n.d)).map((n) => ({ p: n.p, d: +n.d })),
    author: { cls: String(w.author?.cls || ''), seat: String(w.author?.seat || ''), name: String(w.author?.name || '') },
    createdAt: w.createdAt || new Date().toISOString(), updatedAt: w.updatedAt || new Date().toISOString(), imported: true,
  }));
  if (!ok.length) throw new Error('這不是直笛小幫手的作品檔');
  return ok;
}
