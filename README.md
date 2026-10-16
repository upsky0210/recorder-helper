# 直笛小幫手

國小高音直笛（Soprano）學習小工具：指法表、記憶遊戲、小測驗、小作曲，作品可以存在本機、匯出圖片／錄音／作品檔並分享。

- 線上版：https://upsky0210.github.io/recorder-helper/
- iPad：用 Safari 打開 → 分享 → 加入主畫面，第一次載入後沒有網路也能用（PWA）。
- 不用登入、不上傳任何資料；班級、座號、姓名和作品只存在這台裝置（localStorage）。

## 檔案
| 檔案 | 內容 |
|---|---|
| `data/fingerings.js` | **音與指法資料**（唱名、音名、頻率、顏色、英式／德式指法、分級）。格式寫在檔案開頭的註解 |
| `js/app.js` | 主程式：五個分頁、輸出與分享 |
| `js/music.js` | 指法圖（SVG）、五線譜（abcjs）、分級工具 |
| `js/audio.js` | WebAudio 合成直笛聲、OfflineAudioContext 合成 WAV |
| `js/store.js` | 本機存檔、作品檔匯入格式檢查 |
| `sw.js`、`manifest.webmanifest` | PWA 離線快取 |
| `vendor/abcjs/` | abcjs 6.4.4（MIT），不依賴 CDN |

## 指法資料
指法只填音樂老師提供的課本指法表，沒有資料填 `null`（畫面顯示「等待老師提供」）。
指法字串 `'後面拇指孔|前面1～7孔'`：`1` 按住、`0` 打開、`h` 半孔／雙孔按一半，例如 Sol＝`'1|1110000'`。

## 更新
改檔後把 `index.html`、`js/*.js`、`data/fingerings.js` 的 `?v=` 一起加 1，`sw.js` 的 `FILES` 和 `VERSION` 也跟著改，再 commit、push。

設計者 Upsky（阿喵老師）／工具 Claude Code
