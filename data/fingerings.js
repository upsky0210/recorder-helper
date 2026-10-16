/* 直笛小幫手：高音直笛（Soprano）音與指法資料
 *
 * ⚠ 指法資料只能填「音樂老師提供的課本指法表」，不要自己從網路補。
 *   沒有資料的指法填 null，畫面會顯示「等待老師提供」，該音也不會出現在遊戲和測驗裡。
 *
 * 每個音的欄位：
 *   id      音的代號（寫在譜上的音高，科學音名），例：'G4'、'C5'、'F#4'；存檔裡的作品用這個代號記音，不要改
 *   sol     唱名（畫面顯示用），例：'Sol'
 *   hi      true 表示前面要加「高音」二字（高音 Do、高音 Re…）
 *   name    音名，例：'G'、'C'、'F♯'
 *   abc     abcjs 五線譜寫法：C4～B4 用大寫 C D E F G A B，C5～B5 用小寫 c d e…，C6 以上 c' d'；
 *           升記號前面加 ^（^F），降記號加 _（_B）
 *   hz      實際發出的頻率（高音直笛聽起來比譜高一個八度，所以 G4 譜上的 Sol 是 784 Hz）
 *   color   這個音的顏色
 *   semi    true 表示是半音（升降音），只在「加半音」分級出現
 *   finger  { english: 英式（巴洛克式）指法, german: 德式指法 }，沒有資料填 null
 *
 * 指法字串格式：'後面拇指孔|前面 1～7 孔'，例：'1|1110000'
 *   第 1 個字元：後面拇指孔   1 按住、0 打開、h 半孔（拇指只蓋一半）
 *   | 後面 7 個字元：前面由上（左手食指）往下第 1～7 孔
 *       第 1～5 孔：1 按住、0 打開、h 按一半
 *       第 6、7 孔是雙孔：1 兩個小孔都按住、h 只按住一個（按一半）、0 都打開
 *
 * 分級 LEVELS：notes 列出這一級用到的音 id；all: true 表示用全部有資料的音。
 *   只要該級有任何一個音在目前選的指法（英式／德式）沒有資料，那一級就會顯示「等待老師提供」。
 */

export const NOTES = [
  // —— 等待老師提供指法（只先放音高，指法不可腦補）——
  { id: 'C4', sol: 'Do', name: 'C', abc: 'C', hz: 523.25, color: '#ec407a', finger: { english: null, german: null } },
  { id: 'D4', sol: 'Re', name: 'D', abc: 'D', hz: 587.33, color: '#ab47bc', finger: { english: null, german: null } },
  { id: 'E4', sol: 'Mi', name: 'E', abc: 'E', hz: 659.26, color: '#5c6bc0', finger: { english: null, german: null } },
  { id: 'F4', sol: 'Fa', name: 'F', abc: 'F', hz: 698.46, color: '#26a69a', finger: { english: null, german: null } },
  // —— 入門 5 音：3D 校園小瑜老師直笛遊戲已經在用的指法（英式、德式相同）——
  { id: 'G4', sol: 'Sol', name: 'G', abc: 'G', hz: 783.99, color: '#ef5350', finger: { english: '1|1110000', german: '1|1110000' } },
  { id: 'A4', sol: 'La', name: 'A', abc: 'A', hz: 880.0, color: '#ffa726', finger: { english: '1|1100000', german: '1|1100000' } },
  { id: 'B4', sol: 'Si', name: 'B', abc: 'B', hz: 987.77, color: '#fdd835', finger: { english: '1|1000000', german: '1|1000000' } },
  { id: 'C5', sol: 'Do', hi: true, name: 'C', abc: 'c', hz: 1046.5, color: '#66bb6a', finger: { english: '1|0100000', german: '1|0100000' } },
  { id: 'D5', sol: 'Re', hi: true, name: 'D', abc: 'd', hz: 1174.66, color: '#42a5f5', finger: { english: '0|0100000', german: '0|0100000' } },
];

export const LEVELS = [
  { id: 'starter', label: '入門 5 音', desc: 'Sol La Si 高音Do 高音Re', notes: ['G4', 'A4', 'B4', 'C5', 'D5'] },
  { id: 'octave', label: '一個八度', desc: 'Do Re Mi Fa Sol La Si 高音Do', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] },
  { id: 'full', label: '全音域', desc: '課本上所有的音（不含半音）', all: true, semi: false },
  { id: 'semi', label: '加半音', desc: '全音域＋升降音', all: true, semi: true, needSemi: true },
];

export const SYSTEMS = [
  { id: 'english', label: '英式', full: '英式（巴洛克式）' },
  { id: 'german', label: '德式', full: '德式' },
];
