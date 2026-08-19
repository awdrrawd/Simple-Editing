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
    └── image-editor/
        ├── index.html
        └── README.md
```

發布 GitHub Pages 後，每個工具會有自己乾淨的網址（例如 `/tools/image-editor/`），首頁與每個工具內都有按鈕互相連結，方便來回切換。

## 共用主題／語言控制器

`assets/shared.js` 是所有頁面共用的一個小型控制器，它做兩件事：

1. **記住你的選擇**：主題（亮/暗）與語言（中／英）會存在瀏覽器的 `localStorage`，因為所有工具在同一個網域（GitHub Pages 網址）下，所以在任一工具切換過的設定，換到別的工具或回到首頁時也會沿用，不用每個頁面重新設定一次。
2. **統一「回首頁」按鈕**：每個工具頁面裡帶有 `data-se-home` 屬性的元素，會自動被填上對應語言的文字（「🏠 回首頁」／「🏠 Home」），不需要每個工具各自維護一份翻譯。

每個工具原本各自的主題配色、版面、功能都完全保留，`shared.js` 只負責「記住选择」這一層，不會影響各工具原本的介面設計。

## 如何新增第四個工具

1. 在 `tools/` 底下新增一個資料夾，例如 `tools/your-tool/`，裡面放 `index.html`。
2. 在你的 `index.html` 的 `<head>` 引入 `<script src="../../assets/shared.js"></script>`（依你的資料夾深度調整相對路徑）。
3. 在初始化主題／語言的地方改用 `SharedSettings.getTheme()` / `SharedSettings.getLang()` 取得初始值，並在切換按鈕的事件裡呼叫 `SharedSettings.setTheme()` / `SharedSettings.setLang()` 儲存選擇。
4. 加一個帶有 `data-se-home` 屬性、連到 `../../index.html` 的按鈕或連結，讓使用者可以隨時回到首頁。
5. 在根目錄 `index.html` 的工具卡片區塊新增一張卡片連到新工具，並在 `README.md` 的工具列表加一列。
6. 幫新工具寫一份自己的 `README.md`（可以參考現有三個工具的格式）。

## 授權

沒有特別標示的話，這個倉庫內的程式碼皆可自由使用、修改與散布，請視個人需求調整。
