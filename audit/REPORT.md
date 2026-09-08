# 倉庫功能與風格檢查

日期：2026-09-07。對象：目前本機工作目錄，非線上部署版本。

結論：不能視為全站功能正常。12 個工具中，5 個在本次瀏覽器巡檢出現阻斷核心功能的執行錯誤；另有 Base64、雜湊及聲音編輯器的明確程式缺陷。視覺有共同元素，但尚未形成一致的介面規範。

## 驗證方式與限制

- 在 `http://127.0.0.1:8765` 開啟首頁及全部 12 個工具，檢查可見介面與 console。
- 實際操作 JSON 格式化、語言切換、JSON → CSV；查看圖片編輯器、AI Cooldown、CSV 桌面畫面及 JSON 390 × 844 窄螢幕畫面。
- `node audit/check.cjs` 檢查全部 HTML 的傳統 inline JavaScript 語法、靜態 ID、CSS 變數、首頁工具連結，並在最小 DOM fixture 執行原始事件處理器的已知輸入。結果在 `audit/results.txt`。fixture 測試不等於瀏覽器端到端測試；語法檢查不包含 SVG 的遠端 ES module。
- 沒有完成所有檔案格式、通知權限、剪貼簿權限、PDF 列印、多瀏覽器及大量檔案的端到端驗證。被初始化錯誤阻斷的工具，需修正後才可繼續驗證內部功能。外部 CDN 錯誤代表本次環境的實際結果，不把每一項都推斷為所有網路環境必然相同。
- 本次只新增檢查脚本與報告，未修改產品功能。

## 各工具狀態

| 工具 | 結果與證據 | 尚待驗證 |
| --- | --- | --- |
| Markdown | 啟動正常，預設 Markdown 的標題、粗斜體、列表、程式碼預覽可见 | 所有工具列操作、匯入、MD 下載、PDF |
| AI Cooldown | **初始化中斷**：`Cannot set properties of null (setting 'textContent')`，801 行 | 修正後測新增、編輯、計時、排序、儲存、通知 |
| 圖片編輯器 | **初始化中斷**：`Cannot access 'currentLang' before initialization`，689 行 | 靜態編輯、GIF/APNG、影片抽幀及下載皆待修正後測 |
| Base64 | ASCII fixture 通過；中文、1 MiB 檔案編碼與下載實作有缺陷 | 修正後做文字/二進位往返與真正下載 |
| 媒體轉換器 | **核心初始化中斷**：`FFmpeg is not defined`，274 行 | 所有影音轉檔、裁切 |
| 銳利圖片縮放 | 頁面啟動正常；輸出格式與下載生命週期有疑點 | Pica / OffscreenCanvas 實際縮放、尺寸及格式 |
| JSON | **實際格式化成功**；fixture 美化、無效 JSON 驗證通過 | 壓縮、剪貼簿、大數字精度需求 |
| URL | 頁面啟動正常；fixture 中文往返與無效百分號處理通過 | 瀏覽器剪貼簿 |
| SVG | **依賴載入失敗**：Skypack 報 `"os" does not exist. (Imported by "svgo")` | 所有優化選項、結果大小、下载 |
| 聲音編輯器 | 頁面啟動正常；匯出、播放進度與暫停程式有缺陷 | 修正後用多軌及長音訊實測 |
| 雜湊 | SHA-256 `abc` 已知值 fixture 通過；MD5 與複製失敗 | 瀏覽器檔案與其餘 SHA 演算法 |
| CSV ↔ JSON | **JSON → CSV 實測失敗**：`Papa is not defined`，371 行 | 依賴修正後測雙向轉換、引號、換行、錯誤資料 |

## 優先修復的問題

### P1：阻斷或產生錯誤資料

1. **圖片編輯器初始化順序錯誤** — `tools/image-editor/index.html:689`、694、704。先呼叫 `applyTheme()`，其中讀取 `currentLang`，但 `let currentLang` 尚未初始化，後續事件綁定不會執行。應先初始化語言及相關狀態。
2. **AI Cooldown 語言按鈕 ID 不一致** — `tools/ai-cooldown/index.html:520`、752、801。HTML 是 `localeToggle`，JS 查找 `langToggle`；`updateLanguage()` 因 null 拋錯，啟動流程中斷。需統一 ID，並驗證後續事件初始化。
3. **媒體轉換器依賴不可用** — `tools/media-converter/index.html:9`、274。本次載入後 `FFmpeg` 未定義；頁面引用 0.12.6，程式卻使用 `createFFmpeg / FS / run` 介面，需要同步確認發行檔路徑與對應版本 API。`loadFFmpeg()` 又在 try 外，載入失敗無正常使用者回饋。即使依賴修好，同副檔名轉檔使用相同輸入輸出檔名，重複轉檔也缺少覆寫與清理策略。
4. **CSV 依賴未載入** — `tools/csv-converter/index.html:9`、371。輸入 `[{"name":"Alice","n":2}]` 並按 JSON → CSV 的 Convert，結果留白，console 顯示 `Papa is not defined`。修正/驗證 CDN 位址並增加載入錯誤狀態。
5. **SVG 使用不適合目前瀏覽器載入方式的模組** — `tools/svg-optimizer/index.html:10`。Skypack 的 svgo 模組引用 Node `os`，本次直接失敗。另在 255 行 `convertColors` 的開關讀取 `.params` 而非 `.checked`，產生物件使其總被保留，取消勾選無效。283 行假定 `result.info` 有大小欄位，也應以實際輸入/輸出位元組數驗證。
6. **Base64 不支援中文且大檔易失敗** — `tools/base64-converter/index.html:307` 直接 `btoa(text)`，中文/emoji 失敗，Latin-1 文字也和 UTF-8 解碼不對稱；287 行將整個檔案 bytes 展開為參數，1 MiB 表達式測試即 stack overflow。應統一 UTF-8 並分塊處理 bytes。
7. **Base64「下載結果」沒有下載行為** — 同檔 161、387、402 行。元素是 `<button>`，卻只設定 `.href`、`.download` 並從 click handler 返回 true；不會產生 `<a>` 的下載動作。
8. **Base64 解碼結果被當作 HTML** — 同檔 375 行。Base64 對應 `<b>hello</b>` 時產生 `<pre><b>hello</b></pre>`；純文字會被解釋為標記，也形成 HTML 注入入口。應用 `textContent` 顯示。
9. **雜湊預設 MD5 不能用，兩個複製按鈕均錯誤** — `tools/hash-calculator/index.html:105`、231、246、252。選單提供 MD5，卻一律交給 Web Crypto digest，fixture 重現 `NotSupportedError`。結果元素是 span，沒有 `.select()`，複製會 TypeError。應提供 MD5 實作或移除宣稱，使用合適的剪貼簿方法。
10. **音訊匯出取不到渲染結果** — `tools/audio-editor/index.html:486`。呼叫 `startRendering()` 後 await `renderingCompleted`，沒有取得 `startRendering()` 的 Promise 回傳值，後續讀取 `renderedBuffer.getChannelData` 會失敗。離線 buffer 又固定 30 秒（472 行），修正 await 後仍會截斷長音訊，短音訊則補入靜音。

### P2：局部功能或互動問題

- **音訊進度 selector 層級錯誤**：`tools/audio-editor/index.html:446` 傳入的是進度內層 div，227 行再從中查 `.progress-bar div`，找不到；進度不更新。暫停沒有更新 `offset`，播放又從 offset 0 開始，不會真正續播。
- **9 個工具缺少 `--accent-hover`**：audio、base64、csv、hash、image-sharp-resize、json、media、svg、url 都引用未定義變數。深色畫面主按鈕懸停背景消失，深色文字難辨識；CSV 實測截圖可見按鈕文字幾乎消失。
- **翻譯提示寫進輸入值**：Base64、JSON、URL、CSV、Hash、SVG 的 textarea 標 `data-i18n="placeholder..."`，`applyLocale()` 卻寫 `textContent`，而非 `placeholder`。首次開啟已填入「請貼上」的說明文字，提示不是空值。瀏覽器 JSON/SVG 等均可見。使用者真正輸入後本次 JSON 切語言沒有覆蓋輸入，不應把問題誇大為必然丟失已編輯資料。
- **縮放輸出名稱可能與內容不一致**：`tools/image-sharp-resize/index.html:254` 要求沿用輸入 MIME，269 行沿用原副檔名；對 GIF 等 canvas 未直接輸出的格式需驗證 Blob 的實際 type 並改副檔名。首次下載即撤銷仍供預覽及後續下載使用的 URL，第二次下載需實測。
- **CSV 解析錯誤未檢查**：`complete(results)` 直接把 `results.data` 顯示為成功，沒有處理 `results.errors`，格式不良輸入可能被報成成功。
- **首頁漏工具**：`index.html` 只有 10 張卡片，缺少 `hash-calculator` 與 `csv-converter`，README 卻列了 12 個。

## 風格一致性

| 面向 | 判定 |
| --- | --- |
| 基本配色 | 首頁、Markdown 與多數簡易工具採藍色、灰階配色，有一致基礎 |
| AI Cooldown | 獨立紫色、較強陰影、統計卡片與 Inter 字型，和首頁差異明顯 |
| 圖片編輯器 | 獨立青綠/琥珀配色、膠囊按鈕、側欄工作區及不同主題 class |
| 共用樣式 | 只共用 settings JS，CSS 大量複製；同一 hover 缺陷擴散到 9 個工具 |
| 語言 | SVG/CSV checkbox、縮放選項、媒體 GIF 選項及音訊動態下載按鈕殘留中文；JSON 成功訊息切語言後也保留中文 |
| 留白 | CSV `.tab-container` 的 `margin-bottom:400px` 明顯偏離其他工具 24px 的尺度 |
| 導覽 | 簡易工具是 SE 標記，Markdown 是 M↓，圖片與 AI 又是不同標記；語言/主題按鈕標示方式不同；部分首頁連結保留底線 |
| 窄螢幕 | JSON 在 390 × 844 本次可換行操作，未見明顯橫向裁切；不能據此宣告所有工具手機版通過 |
| 程式碼 | 部分 IIFE、部分長單檔工作區，命名/縮排/主題 class 與 data-theme 不統一；沒有既有測試或 lint 流程 |

README 明確說各工具保留自己的設計，因此不同配色並非違反既有文件；若希望「一套工具箱」的體驗一致，應先抽共用色彩、字型、間距、按鈕、頁首、錯誤狀態與語系處理，再保留編輯器所需的專用工作區。

## 修正與回歸順序

1. 先解決圖片、AI、媒體、CSV、SVG 的載入/初始化阻斷，確認每頁零未捕捉例外。
2. 修正 Base64、雜湊、音訊等資料正確性與下載問題，加入實際檔案往返測試。
3. 修正首頁入口、placeholder、缺少翻譯及 hover；統一共用樣式。
4. 對 12 個工具補瀏覽器 smoke test，覆蓋兩種語言、兩種主題、有效/無效輸入及下載；為大型編輯器補檔案格式案例。
5. `.github/workflows/static.yml` 目前直接部署整個倉庫，沒有測試閘門；日後应在部署前執行檢查。README「新增第四個工具」「現有三個工具」也需更新。
