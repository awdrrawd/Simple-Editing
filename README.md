# Simple Editing · 小工具箱

一組單頁完成、純前端（HTML + CSS + JavaScript）的小工具集合，全部都在瀏覽器裡本機執行，不需要安裝、不需要伺服器、也不會把任何資料上傳出去。

🔗 **線上使用**：<https://awdrrawd.github.io/Simple-Editing/>
（如果你是 fork 或改了倉庫名稱，把網址換成自己的 GitHub Pages 網址即可）

## 收錄的工具

| 工具 | 說明 | 網址 |
| --- | --- | --- |
| 📝 [格式小幫手](tools/markdown-editor/) | Markdown 即時預覽編輯器，工具列一鍵套用格式，可匯出 `.md` 或 PDF | `/tools/markdown-editor/` |
| ⏱️ [AI Cooldown](tools/ai-cooldown/) | 多帳號 AI 服務冷卻時間追蹤器，支援桌面通知、排序、星號優先 | `/tools/ai-cooldown/` |
| 🖼️ [圖片編輯器](tools/image-editor/) | 裁切、濾鏡、去背、加文字貼紙、動圖輸出的純瀏覽器圖片編輯器 | `/tools/image-editor/` |
| 🔤 [Base64](tools/base64-converter/) | 任意檔案或文字 ⇄ Base64 編解碼，支援所有檔案類型，產出標準 Base64 字串 | `/tools/base64-converter/` |
| 🎞️ [媒體轉換器](tools/media-converter/) | 影片、音訊轉檔與裁切，支援常見格式，使用純瀏覽器的 ffmpeg.wasm | `/tools/media-converter/` |
| 🔍 [銳利圖片縮放](tools/image-sharp-resize/) | 使用高品質演算法（Lanczos 3）縮放圖片，縮小時保留銳利度與細節，特別適合 PNG | `/tools/image-sharp-resize/` |
| 🧮 [JSON 格式化器](tools/json-formatter/) | 美化、壓縮與驗證 JSON，支援標準格式，即時顯示結果 | `/tools/json-formatter/` |
| 🔗 [URL 編碼 / 解碼](tools/url-encoder/) | 編碼與解碼網址參數，支援 encodeURIComponent 和 decodeURIComponent | `/tools/url-encoder/` |
| 🎯 [SVG 優化器](tools/svg-optimizer/) | 貼上 SVG 或選取檔案，移除冗餘資訊、縮短顏色值、清理未使用的 ID 等，讓 SVG 檔案更小、更乾淨 | `/tools/svg-optimizer/` |
| 🔊 [聲音編輯器](tools/audio-editor/) | 載入音訊檔案，調整音量與音高（會影響播放速度），即時預覽波形，並可混合多軌道播放或下載混合後的 WAV 檔案 | `/tools/audio-editor/` |
| 🔐 [雜湊計算器](tools/hash-calculator/) | 輸入文字或檔案，計算 MD5、SHA-1、SHA-256 等雜湊值。所有計算在瀏覽器本機完成，不會上傳您的資料 | `/tools/hash-calculator/` |
| 🔄 [CSV ↔ JSON 轉換器](tools/csv-converter/) | 上傳 CSV 檔案轉為 JSON 結構，或貼上 JSON 轉為 CSV 檔案。全部在瀏覽器本機完成，不會上傳任何資料 | `/tools/csv-converter/` |

每個工具都附有自己的 `README.md`，說明詳細用法。

## 倉庫結構

```
Simple-Editing/
├── index.html              ← 入口首頁，列出並連結所有工具
├── README.md                ← 本檔案
├── assets/
│   └── shared.js             ← 共用的主題／語言控制器（見下方說明）
└── tools/
    ├── markdown-editor/
    │   ├── index.html
    │   └── README.md
    ├── ai-cooldown/
    │   ├── index.html
    │   └── README.md
    ├── image-editor/
    │   ├── index.html
    │   └── README.md
    ├── base64-converter/
    │   ├── index.html
    │   └── README.md
    ├── media-converter/
    │   ├── index.html
    │   └── README.md
    ├── image-sharp-resize/
    │   ├── index.html
    │   └── README.md
    ├── json-formatter/
    │   ├── index.html
    │   └── README.md
    ├── url-encoder/
    │   ├── index.html
    │   └── README.md
    ├── svg-optimizer/
    │   ├── index.html
    │   └── README.md
    ├── audio-editor/
    │   ├── index.html
    │   └── README.md
    ├── hash-calculator/
    │   ├── index.html
    │   └── README.md
    └── csv-converter/
        ├── index.html
        └── README.md
```

發布 GitHub Pages 後，每個工具會有自己乾淨的網址（例如 `/tools/image-editor/`），首頁與每個工具內都有按鈕互相連結，方便來回切換。

## 共用主題／語言控制器

`assets/shared.js` 是所有頁面共用的一個小型控制器，它做兩件事：

1. **記住你的選擇**：主題（亮/暗）與語言（中／英）會存在瀏覽器的 `localStorage`，因為所有工具在同一個網域（GitHub Pages 網址）下，所以在任一工具切換過的設定，換到別的工具或回到首頁時也會沿用，不用每個頁面重新設定一次。
2. **統一「回首頁」按鈕**：每個工具頁面裡帶有 `data-se-home` 屬性的元素，會自動被填上對應語言的文字（「🏠 回首頁」／「🏠 Home」），不需要每個工具各自維護一份翻譯。

每頁最上方都有相同的控制列，固定依「主題、語系、回首頁」排列（首頁省略返回按鈕）。`assets/shared.css` 統一位置、字型、按鈕、間距及亮暗配色；各工具工作區保留適合其功能的版面，設定跨工具沿用。

## 如何新增工具

1. 在 `tools/` 底下新增一個資料夾，例如 `tools/your-tool/`，裡面放 `index.html`。
2. 在 `<head>` 引入 `../../assets/shared.js` 與 `../../assets/shared.css`（依深度調整路徑）。主題按鈕使用 `themeToggle`，語系按鈕使用 `localeToggle`。
3. 在初始化主題／語言的地方改用 `SharedSettings.getTheme()` / `SharedSettings.getLang()` 取得初始值，並在切換按鈕的事件裡呼叫 `SharedSettings.setTheme()` / `SharedSettings.setLang()` 儲存選擇。
4. 加一個帶有 `data-se-home` 屬性、連到 `../../index.html` 的按鈕或連結，讓使用者可以隨時回到首頁。
5. 在根目錄 `index.html` 的工具卡片區塊新增一張卡片連到新工具，並在 `README.md` 的工具列表加一列。
6. 幫新工具寫一份 `README.md`，並在回歸測試頁加入主要操作案例。

## 開發與驗證

瀏覽器套件放在 `assets/vendor/`，不需第三方 CDN。影音引擎約 32 MB，首次轉檔才載入。請透過 HTTP/HTTPS 使用；ES module、Worker 不保證可在 `file://` 下運作。

```sh
npm ci --ignore-scripts
npm test
npm run build
python audit/fixtures.py
python -m http.server 8765 --bind 127.0.0.1
```

開啟 `http://127.0.0.1:8765/audit/browser.html` 按 Run all tests，驗證語系、主題、轉換與匯出。測試使用產生的資料，下載在記憶體中檢查，結束會還原原本設定及計時器資料。不要在同時編輯其他工具時執行。

`npm run build` 驗證後產生 `_site/`，Pages 只發布此目錄，不含依賴安裝目錄、測試頁與測試資料。套件升級後執行 `npm run vendor` 更新瀏覽器檔案。

## 授權

沒有特別標示的話，這個倉庫內的程式碼皆可自由使用、修改與散布，請視個人需求調整。

第三方套件依各自授權，包含 FFmpeg core 的 GPL-2.0-or-later；版本與授權文件見 [assets/vendor/README.md](assets/vendor/README.md)。
