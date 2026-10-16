# AGENTS.md：直笛小幫手（recorder-helper）

給接手實作的 AI 程式助理（Codex 等）看的交接說明。功能介紹看 README.md。

## 這是什麼
臺北市溪口國小的國小高音直笛（Soprano）學習小工具：指法表、記憶遊戲、小測驗、小作曲，作品存在本機，可以匯出作品卡 PNG、旋律錄音 WAV、作品檔 JSON，並用分享選單交作業。
- 起源：3D 溪口校園裡小瑜老師的直笛記憶遊戲，音樂老師很喜歡，所以拆成獨立工具。
- 使用者：國小學生和音樂老師。主要裝置是 **iPad（Safari、觸控、大按鈕）** 和電腦教室的桌機。
- 學生交作業用 Google Classroom、Google 雲端硬碟或 Synology NAS，所以只用通用檔案格式＋Web Share（不支援時改成下載），不串接任何 API。
- 線上：https://upsky0210.github.io/recorder-helper/ （GitHub Pages，main 分支根目錄直接部署；PWA，可以加到 iPad 主畫面、離線使用）
- 規劃者是另一個 AI（Claude）在「3D 溪口校園」專案裡做的。規格有疑問或要加大功能時，先問使用者，不要自己擴大範圍。

## 一定要遵守
1. **介面文字、註解、commit 訊息、回覆使用者一律用台灣正體中文、台灣用語**（例如「檔案」「下載」「螢幕」，不用「文件」「屏幕」）。
2. **指法資料不可以腦補**：只能用音樂老師提供的課本指法表。不可以從網路或記憶自己補指法；沒有資料就填 `null`，畫面會顯示「等待老師提供」。
3. **不依賴 CDN**：函式庫放在 `vendor/`（目前是 abcjs 6.4.4，MIT）。學校網路可能擋外部網站，而且要能離線。
4. localStorage 讀寫都要包 try/catch（iPad 私密瀏覽會丟錯）。
5. 保持純靜態網站，沒有建置步驟（不要引入 npm 打包流程）。
6. **不做登入**（第二階段再說，見待辦）。班級、座號、姓名和作品只存在本機，不上傳、不加分析或追蹤程式。
7. 頁尾製作資訊要保留：設計者 Upsky（阿喵老師）／工具 Claude Code。

## 檔案結構
- `index.html`：版面（五個分頁、輸出對話框）
- `css/style.css`：樣式（iPad 大按鈕）
- `data/fingerings.js`：**音與指法資料、分級**（見下一節）
- `js/app.js`：主程式：指法表、記憶遊戲、小測驗、小作曲、我的作品、輸出（作品卡 PNG 是整張組成 SVG 再畫到 canvas）與分享
- `js/music.js`：指法圖（SVG）、五線譜（abcjs）、分級工具
- `js/audio.js`：WebAudio 合成直笛聲；OfflineAudioContext 合成 WAV
- `js/store.js`：本機存檔、作品檔匯入檢查
- `sw.js`、`manifest.webmanifest`、`icons/`：PWA
- `vendor/abcjs/`：五線譜函式庫（授權檔要跟著）

## 指法資料（data/fingerings.js）
`NOTES` 陣列，每個音一筆：
```js
{ id: 'G4', sol: 'Sol', name: 'G', abc: 'G', hz: 783.99, color: '#ef5350',
  finger: { english: '1|1110000', german: '1|1110000' } }
```
- `id`：譜上的音高（科學音名，例 `C5`、`F#4`）。作品檔用它記音，**已經用過的 id 不要改**。
- `sol` 唱名；`hi: true` 表示前面加「高音」；`name` 音名（升降記號用 ♯ ♭）。
- `abc`：abcjs 寫法。C4～B4 大寫 `C D E F G A B`，C5～B5 小寫 `c d e …`，C6 以上 `c' d'`；升記號前面加 `^`（`^F`），降記號加 `_`（`_B`）。
- `hz`：實際發出的頻率。高音直笛聽起來比譜高一個八度（譜上 G4 → 784 Hz）。
- `semi: true`：半音，只出現在「加半音」分級。
- `finger.english` 是英式（巴洛克式），`finger.german` 是德式；兩套各自填，沒有資料填 `null`。
- 指法字串 `'後面拇指孔|前面第1～7孔'`（前面由上往下，第 1 孔是左手食指）：
  - `1` 按住、`0` 打開、`h` 半孔（拇指只蓋一半，或第 1～5 孔按一半）
  - 第 6、7 孔是雙孔：`1` 兩個小孔都按、`h` 只按一個（按一半）、`0` 都打開
- 加一個音：照上面的格式加一筆，依音高順序放進 `NOTES`。
- `LEVELS` 是分級：`notes` 列出 id，或 `all: true` 用全部音（`semi` 決定要不要含半音）。只要某級在目前的英式／德式下缺任何一個音的指法，那一級就會顯示「等待老師提供」，不能玩。
- 目前資料：Sol La Si 高音Do 高音Re 有指法（3D 校園原本就在用，英德相同）；低音 Do Re Mi Fa 只先放音高，指法是 `null`。

## 存檔格式
localStorage 鍵 `recorder-helper:v1`：`{ version, prefs, profile{cls,seat,name}, works[], records, draft }`。
作品（也是匯出的作品檔）`schema: 'recorder-helper.work'`，每份有 `id`、`updatedAt`，`notes` 是 `[{ p: 音的 id 或 'rest', d: 長度（以八分音符為 1：1,2,3,4,6,8） }]`。結構是為了第二階段直接搬到雲端，改格式要保留舊檔相容。

## 本機測試
```bash
python -m http.server 5181
```
然後打開 http://localhost:5181/ 。每次修改都要實際測：指法表點音（聲音、五線譜）、英式／德式切換、記憶遊戲、兩種測驗、作曲（寫滿小節、點譜上的音修改、播放）、輸出 PNG／WAV／JSON、匯入作品檔，還要用 iPad 尺寸（768×1024）檢查版面。
注意 service worker 會快取檔案；測試時重新整理兩次，或在開發者工具關掉快取。

## 部署
改好、測過以後 commit 並 push 到 main，大約 1 分鐘後 GitHub Pages 會更新。小修改可以直接 push；大改版先給使用者看過。
開工前先 `git pull`：這個 repo 可能由不同的 AI 輪流修改。
**改了任何檔案**：`index.html`、`js/*.js`、`data/fingerings.js` 裡的 `?v=` 要一起加 1，`sw.js` 的 `FILES` 清單和 `VERSION` 也要跟著改，不然舊版快取會跟新版混在一起。

## 待辦
- **等音樂老師提供**：課本版本、指法表照片、英式或德式、音域。收到後才補 `data/fingerings.js`。
- **第二階段 Google 登入**（限學校網域、雲端存檔、老師看全班）要接 3D 溪口主專案的 Firebase；主專案做好之前**不要做**。
- **第三階段**：麥克風錄真的直笛吹奏＋音高偵測。
- 作品錄音要不要改成輸出 MP3（WAV 留著當高音質選項）：還在等使用者決定，**先不要做**。
- 還沒在真的 iPad 上測：分享選單（Gmail、Classroom、儲存到檔案）、加到主畫面後離線使用。使用者回報問題時優先處理這些。
- 已知小問題：手機寬度時小作曲的五線譜偏小、下方有空白（主要裝置是 iPad，先不處理）。
