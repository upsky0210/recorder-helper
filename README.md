# 直笛小幫手

國小高音直笛（Soprano）學習小工具：指法表、記憶遊戲、小測驗、小作曲，作品可以存在本機、匯出圖片／錄音／作品檔並分享。

- 線上版：https://upsky0210.github.io/recorder-helper/
- iPad：用 Safari 打開 → 分享 → 加入主畫面，第一次載入後沒有網路也能用（PWA）。
- 不用登入、不上傳任何資料；班級、座號、姓名和作品只存在這台裝置（localStorage）。
- 錄音預設輸出 MP3（單聲道、44.1 kHz、128 kbps），另有高音質 WAV；「全部一起」包含 MP3、PNG、JSON。

## 檔案
| 檔案 | 內容 |
|---|---|
| `data/fingerings.js` | **音與指法資料**（唱名、音名、頻率、顏色、英式／德式指法、分級）。格式寫在檔案開頭的註解 |
| `js/app.js` | 主程式：五個分頁、輸出與分享 |
| `js/music.js` | 指法圖（SVG）、五線譜（abcjs）、分級工具 |
| `js/audio.js` | WebAudio 合成直笛聲、共用離線音訊合成、MP3／WAV 匯出 |
| `js/store.js` | 本機存檔、作品檔匯入格式檢查 |
| `sw.js`、`manifest.webmanifest` | PWA 離線快取 |
| `vendor/abcjs/` | abcjs 6.4.4（MIT），不依賴 CDN |
| `vendor/lamejs/` | lamejs 1.2.1（LGPL-3.0），本機 MP3 編碼；保留上游授權說明與完整授權檔 |
| `docs/指法轉錄對照.svg` | 自行繪製的英式指法核對圖，不含課本掃描 |

## 指法資料
指法只填音樂老師提供的課本指法表，沒有資料填 `null`（畫面顯示「等待老師提供」）。
指法字串 `'後面拇指孔|前面1～7孔'`：`1` 按住、`0` 打開、`h` 半孔／雙孔按一半，例如 Sol＝`'1|1110000'`。
可選填第三段表示笛尾第 8 孔，例如 `'h|1011011|1'`；替代指法使用字串陣列，第一筆用於遊戲與測驗。

目前只有英式資料，英式／德式切換暫時隱藏，舊偏好會回到英式。超高音 Re（D6）因照片筆跡遮擋仍留空，因此「全部的音」與「加半音」暫待補齊；「入門 5 音」可玩。

2026-10-21 依使用者要求，先啟用「康軒三四年級」「翰林五六年級」試用分級，供音樂老師檢視；畫面標示「進度暫定，待老師確認」，並列出所選分級的練習音。康軒先放低音 Do～高音 Re 加升 Fa（10 音）；翰林先放低音 Do～Si 與高音 Do、Re、Fa、Sol、La（12 音），未明確指定的其他高音與升降音暫不加入。老師確認後調整 `LEVELS.notes` 並移除 `provisional` 即可。

MP3 使用未修改的 [lamejs 1.2.1](https://github.com/zhuker/lamejs/tree/1.2.1) 與 [LAME](https://lame.sourceforge.net/)；來源及授權詳見 `vendor/lamejs/來源與授權.md`。

## 更新
改檔後把 `index.html`、`js/*.js`、`data/fingerings.js` 的 `?v=` 一起加 1，`sw.js` 的 `FILES` 和 `VERSION` 也跟著改，再 commit、push。

## 本機驗證

先執行 `python -m http.server 5181`。環境已有 Playwright 與 Chrome 時，可用 `node tests/瀏覽器驗證.cjs` 執行瀏覽器驗證（必要時設定 `NODE_PATH` 指向既有 Playwright 套件）。不需要網站建置或 npm 打包；測試輸出位於 `docs/`，課本掃描與測試錄音不納入 Git。

設計者 Upsky（阿喵老師）／工具 Claude Code
