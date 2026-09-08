from pathlib import Path
root=Path(__file__).resolve().parent.parent
for p in root.glob('tools/*/index.html'):
    s=p.read_text(encoding='utf-8')
    urls={
    'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js':'gif.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js':'gif.worker.js',
    'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.min.js':'imagetracer.js',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js':'marked.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js':'purify.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js':'highlight.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css':'highlight-light.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css':'highlight-dark.css',
    }
    for url,name in urls.items():s=s.replace(url,'../../assets/vendor/'+name)
    p.write_text(s,encoding='utf-8')
p=root/'tools/ai-cooldown/index.html';s=p.read_text(encoding='utf-8')
s=s.replace("      const t = LANG[currentLang];\n      document.querySelector('h1')", "      const t = LANG[currentLang];\n      document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-Hant';\n      document.querySelector('h1')")
s=s.replace("      if (persist) {\n        document.documentElement.setAttribute('data-theme', theme);", "      document.documentElement.setAttribute('data-theme', theme);\n      if (persist) {")
s=s.replace("document.documentElement.removeAttribute('data-theme');", "document.documentElement.setAttribute('data-theme', SharedSettings.getTheme());")
s=s.replace("currentTheme = e.matches ? 'dark' : 'light';\n            updateThemeButtonLabel();", "applyTheme(e.matches ? 'dark' : 'light', false);")
s=s.replace("document.getElementById('footerTip').textContent = t.footer;", "document.getElementById('footerTip').textContent = t.footer;\n      accountInput.placeholder = currentLang === 'en' ? 'Work account' : '工作用';\n      noteInput.placeholder = currentLang === 'en' ? 'Progress / note' : '進度/備忘';")
p.write_text(s,encoding='utf-8')
p=root/'tools/image-editor/index.html';s=p.read_text(encoding='utf-8')
# Keep transient messages translatable without touching filenames or user input.
s=s.replace('let currentLang = SharedSettings.getLang();', "let currentLang = SharedSettings.getLang();\nconst tr = (zh, en) => currentLang === 'en' ? en : zh;")
strings={
'尚未套用任何去背。':'No background removal applied.','剪貼簿圖片':'Clipboard image','請先載入圖片。':'Load an image first.',
'請先載入或建立動畫。':'Load or create an animation first.','請先選擇影片檔案。':'Select a video first.',
'請先用滴管在圖片上點選要去除的顏色。':'Pick a color from the image first.','請先用滴管在畫面上點選要去除的顏色。':'Pick a color from the preview first.',
'至少要保留一格畫面。':'Keep at least one frame.','複製':'Duplicate','刪除':'Delete',
'解析中...':'Decoding…','轉換中...':'Converting…','估算中...':'Estimating…','沒有可用的畫格。':'No frames available.',
'手動建立的新動畫':'New animation','影片轉換':'Video conversion','（影片轉換）':' (from video)','PNG（單張）':'PNG (single frame)',
'未知錯誤':'Unknown error','不明的檔案內容或編碼方式。':'Unknown file content or encoding.',
'轉換失敗：':'Conversion failed: ','解析失敗：':'Decode failed: ','估算失敗：':'Estimate failed: ','儲存失敗：':'Save failed: ',
'無法辨識的檔案格式，請上傳 GIF 或 PNG/APNG。':'Unknown format. Select GIF or PNG/APNG.',
'這個瀏覽器不支援 APNG 所需的壓縮串流 API，請改用較新版本的瀏覽器。':'APNG requires compression streams. Use a newer browser.',
'此瀏覽器不支援 APNG 估算所需的壓縮串流 API。':'APNG estimation requires browser compression streams.',
'時間範圍無效，請確認起點／終點設定。':'Invalid time range. Check start and end times.',
'影片已載入。播放預覽並設定起點／終點後，按「開始轉換為動畫格」。':'Video loaded. Set start and end, then convert to animation frames.',
'轉換中，請稍候…（圖片越大或顏色越多，需要的時間越久）':'Converting… Larger images and more colors take longer.',
'這個瀏覽器不支援從按鈕讀取剪貼簿，請直接在頁面上按 Ctrl/Cmd+V 貼上圖片。':'Clipboard reading is unavailable. Press Ctrl/Cmd+V to paste an image.',
'剪貼簿中沒有偵測到圖片，請先複製一張圖片。':'No image found in the clipboard. Copy an image first.',
'無法讀取剪貼簿（可能未授權存取），請直接在頁面上按 Ctrl/Cmd+V 貼上。':'Cannot read clipboard. Press Ctrl/Cmd+V to paste.',
'SVG 轉換所需的元件（ImageTracer.js）尚未載入完成，請確認網路連線後重新整理頁面再試一次。':'The SVG conversion component failed to load. Reload the page.',
'不支援交錯式 (interlaced) PNG':'Interlaced PNG is not supported','目前只支援 8-bit 色深的 PNG/APNG':'Only 8-bit PNG/APNG is supported',
'此瀏覽器不支援選擇下載位置，請點擊下載：':'Choose a download link: ','⬇ 下載 ':'⬇ Download ',
}
import json
for zh,en in strings.items():s=s.replace("'"+zh+"'",'tr('+json.dumps(zh,ensure_ascii=False)+', '+json.dumps(en)+')')
s=s.replace("sourceFrames.length + ' 格'", "sourceFrames.length + tr(' 格', ' frames')")
s=s.replace("`已套用 ${passCount} 次去背，可繼續調整參數再套用，或重新選色做下一輪。`", "tr(`已套用 ${passCount} 次去背，可繼續調整參數再套用，或重新選色做下一輪。`, `Applied ${passCount} background removal passes. Adjust or pick another color to continue.`)")
s=s.replace("`完成：約 ${pathCount} 條路徑，檔案大小 ${formatBytes(blob.size)}（原圖點陣大小僅供參考，向量檔實際大小依圖片複雜度而定）。`", "tr(`完成：約 ${pathCount} 條路徑，檔案大小 ${formatBytes(blob.size)}。`, `Complete: ${pathCount} paths, ${formatBytes(blob.size)}.`)")
p.write_text(s,encoding='utf-8')
