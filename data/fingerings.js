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
 * english 可放字串或陣列；陣列依序是指法 I、II，遊戲與測驗使用第一個。
 * 笛尾第 8 孔選填第三段，例如 'h|1011011|1'；1 表示蓋住笛尾、0 打開。
 * D6 的拇指與第 1 孔受筆跡干擾，整筆指法留 null；不可推測。
 *
 * 分級 LEVELS：notes 列出這一級用到的音 id；all: true 表示用全部音（仍須確認指法齊全）。
 *   年級 notes 為 null 時顯示等待進度；老師提供後填入音 id 即可啟用，不必移除 pending。
 *   provisional: true 表示依使用者提供範圍試排，畫面必須標示進度暫定，待老師確認。
 *   只要該級有任何一個音在目前選的指法（英式／德式）沒有資料，那一級就會顯示「等待老師提供」。
 */

export const NOTES = [
  {"id": "C4", "sol": "Do", "name": "C", "abc": "C", "hz": 523.25, "color": "#ec407a", "finger": {"english": "1|1111111", "german": null}},
  {"id": "C#4", "sol": "升Do", "name": "C♯／D♭", "abc": "^C", "hz": 554.37, "color": "#ec407a", "finger": {"english": "1|111111h", "german": null}, "semi": true},
  {"id": "D4", "sol": "Re", "name": "D", "abc": "D", "hz": 587.33, "color": "#ab47bc", "finger": {"english": "1|1111110", "german": null}},
  {"id": "D#4", "sol": "升Re", "name": "D♯／E♭", "abc": "^D", "hz": 622.25, "color": "#ab47bc", "finger": {"english": "1|11111h0", "german": null}, "semi": true},
  {"id": "E4", "sol": "Mi", "name": "E", "abc": "E", "hz": 659.26, "color": "#5c6bc0", "finger": {"english": "1|1111100", "german": null}},
  {"id": "F4", "sol": "Fa", "name": "F", "abc": "F", "hz": 698.46, "color": "#26a69a", "finger": {"english": "1|1111011", "german": null}},
  {"id": "F#4", "sol": "升Fa", "name": "F♯／G♭", "abc": "^F", "hz": 739.99, "color": "#26a69a", "finger": {"english": "1|1110110", "german": null}, "semi": true},
  {"id": "G4", "sol": "Sol", "name": "G", "abc": "G", "hz": 783.99, "color": "#ef5350", "finger": {"english": "1|1110000", "german": null}},
  {"id": "G#4", "sol": "升Sol", "name": "G♯／A♭", "abc": "^G", "hz": 830.61, "color": "#ef5350", "finger": {"english": "1|11011h0", "german": null}, "semi": true},
  {"id": "A4", "sol": "La", "name": "A", "abc": "A", "hz": 880.0, "color": "#ffa726", "finger": {"english": "1|1100000", "german": null}},
  {"id": "A#4", "sol": "升La", "name": "A♯／B♭", "abc": "^A", "hz": 932.33, "color": "#ffa726", "finger": {"english": ["1|1011010", "1|1010110"], "german": null}, "semi": true},
  {"id": "B4", "sol": "Si", "name": "B", "abc": "B", "hz": 987.77, "color": "#fdd835", "finger": {"english": ["1|1000000", "1|0110000"], "german": null}},
  {"id": "C5", "sol": "Do", "name": "C", "abc": "c", "hz": 1046.5, "color": "#66bb6a", "finger": {"english": "1|0100000", "german": null}, "hi": true},
  {"id": "C#5", "sol": "升Do", "name": "C♯／D♭", "abc": "^c", "hz": 1108.73, "color": "#ec407a", "finger": {"english": ["0|1100000", "1|0000000"], "german": null}, "hi": true, "semi": true},
  {"id": "D5", "sol": "Re", "name": "D", "abc": "d", "hz": 1174.66, "color": "#42a5f5", "finger": {"english": "0|0100000", "german": null}, "hi": true},
  {"id": "D#5", "sol": "升Re", "name": "D♯／E♭", "abc": "^d", "hz": 1244.51, "color": "#ab47bc", "finger": {"english": "0|0111110", "german": null}, "hi": true, "semi": true},
  {"id": "E5", "sol": "Mi", "name": "E", "abc": "e", "hz": 1318.51, "color": "#5c6bc0", "finger": {"english": "h|1111100", "german": null}, "hi": true},
  {"id": "F5", "sol": "Fa", "name": "F", "abc": "f", "hz": 1396.91, "color": "#26a69a", "finger": {"english": "h|1110110", "german": null}, "hi": true},
  {"id": "F#5", "sol": "升Fa", "name": "F♯／G♭", "abc": "^f", "hz": 1479.98, "color": "#26a69a", "finger": {"english": "h|1110100", "german": null}, "hi": true, "semi": true},
  {"id": "G5", "sol": "Sol", "name": "G", "abc": "g", "hz": 1567.98, "color": "#ef5350", "finger": {"english": "h|1110000", "german": null}, "hi": true},
  {"id": "G#5", "sol": "升Sol", "name": "G♯／A♭", "abc": "^g", "hz": 1661.22, "color": "#ef5350", "finger": {"english": "h|1101000", "german": null}, "hi": true, "semi": true},
  {"id": "A5", "sol": "La", "name": "A", "abc": "a", "hz": 1760.0, "color": "#ffa726", "finger": {"english": "h|1100000", "german": null}, "hi": true},
  {"id": "A#5", "sol": "升La", "name": "A♯／B♭", "abc": "^a", "hz": 1864.66, "color": "#ffa726", "finger": {"english": "h|1101110", "german": null}, "hi": true, "semi": true},
  {"id": "B5", "sol": "Si", "name": "B", "abc": "b", "hz": 1975.53, "color": "#fdd835", "finger": {"english": "h|1101100", "german": null}, "hi": true},
  {"id": "C6", "sol": "Do", "name": "C", "abc": "c'", "hz": 2093.0, "color": "#ec407a", "finger": {"english": "h|1001100", "german": null}, "hi": true},
  {"id": "C#6", "sol": "升Do", "name": "C♯／D♭", "abc": "^c'", "hz": 2217.46, "color": "#ec407a", "finger": {"english": "h|1011011|1", "german": null}, "hi": true, "semi": true},
  {"id": "D6", "sol": "Re", "name": "D", "abc": "d'", "hz": 2349.32, "color": "#ab47bc", "finger": {"english": null, "german": null}, "hi": true},
];

export const LEVELS = [
  {
    "id": "starter",
    "label": "入門 5 音",
    "desc": "Sol La Si 高音Do 高音Re",
    "notes": [
      "G4",
      "A4",
      "B4",
      "C5",
      "D5"
    ]
  },
  {
    "id": "kangxuan",
    "label": "康軒三四年級",
    "desc": "低音 Do～高音 Re＋升 Fa（10 音）",
    "notes": ["C4", "D4", "E4", "F4", "F#4", "G4", "A4", "B4", "C5", "D5"],
    "provisional": true
  },
  {
    "id": "hanlin",
    "label": "翰林五六年級",
    "desc": "低音 Do～Si＋高音 Do、Re、Fa、Sol、La（12 音）",
    "notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "F5", "G5", "A5"],
    "provisional": true
  },
  {
    "id": "full",
    "label": "全部的音",
    "desc": "課本上所有的音（不含半音）",
    "all": true,
    "semi": false
  },
  {
    "id": "semi",
    "label": "加半音",
    "desc": "全部的音＋升降音",
    "all": true,
    "semi": true,
    "needSemi": true
  }
];

export const SYSTEMS = [
  { id: 'english', label: '英式', full: '英式（巴洛克式）' },
  { id: 'german', label: '德式', full: '德式' },
];
