from pathlib import Path
import re, html
root=Path(__file__).resolve().parent.parent
translations={
'第一行為標題':'First row is header','自動轉換數據類型':'Convert numeric and boolean values',
'移除不必要的 viewBox':'Remove unnecessary viewBox','清理未使用的 ID':'Clean unused IDs','移除 metadata':'Remove metadata','轉換顏色為縮寫形式':'Shorten colors','移除寬高屬性（如果有 viewBox）':'Remove dimensions (preserve viewBox)',
'Lanczos 3 (高品質)':'Lanczos 3 (high quality)','雙線性':'Bilinear','最近鄰 (無平滑)':'Nearest neighbor (no smoothing)','GIF (動圖)':'GIF (animated)',
'🎯 選取顏色':'🎯 Pick Color','清除選色':'Clear Color','尚未選取':'No color selected','容許度':'Tolerance','邊緣羽化':'Edge Feather','修正邊緣色溢':'Fix edge color spill','套用這次去背':'Apply This Pass','還原上一步':'Undo Last Step','尚未套用任何去背。':'No background removal applied.',
'寬度 (px)':'Width (px)','高度 (px)':'Height (px)','鎖定長寬比':'Lock aspect ratio','依百分比縮放':'Scale by percentage','演算法':'Algorithm','高品質（逐步縮小）':'High quality (progressive downscale)','標準（單次縮放）':'Standard (single pass)','套用縮放':'Apply Resize',
'比例':'Aspect ratio','自由':'Free','1:1 正方形':'1:1 Square','寬度':'Width','高度':'Height','重設裁切框':'Reset Crop','套用裁切':'Apply Crop','亮度':'Brightness','對比':'Contrast','飽和度':'Saturation','色相偏移':'Hue shift','套用調色':'Apply Color','重設滑桿':'Reset Sliders',
'縮放比例':'Scale','套用裁切（全部畫格）':'Apply Crop (all frames)','文字內容':'Caption text','位置':'Position','底部':'Bottom','頂部':'Top','字級':'Font size','文字顏色':'Text color','外框顏色':'Outline color','播放速度':'Playback speed','抽幀（輸出時保留畫格比例）':'Frame sampling for export','全部畫格（不抽幀）':'All frames','每 2 格取 1 格':'Keep 1 in 2 frames','每 3 格取 1 格':'Keep 1 in 3 frames','每 4 格取 1 格':'Keep 1 in 4 frames',
'🖼 插入圖片為新畫格':'🖼 Insert Image as Frame','輸出格式':'Output format','APNG（png）':'APNG (PNG)','GIF 品質（數字越小畫質越好、檔案越大）':'GIF quality (lower = better quality, larger file)','📊 預估輸出容量':'📊 Estimate File Size',
'拖曳畫面上的裁切框調整範圍與位置，或直接輸入座標／尺寸，套用後所有畫格都會裁切成同樣的範圍。':'Drag the crop box or enter coordinates and dimensions. The crop applies to all frames.',
'在下方畫格清單裡，點縮圖可預覽該格；每格下方可以直接改延遲時間(ms)、複製或刪除該格。也可以插入一張新圖片作為新畫格（會裁切填滿目前畫布尺寸），或直接拖曳圖片到頁面來插入。':'Select a thumbnail to preview it. Edit its delay (ms), duplicate or delete it. Insert or drop an image to add a frame cropped to the current canvas.',
'插入位置：目前選取畫格的後面（尚未載入任何動畫時，插入的第一張圖片會用來建立新的動畫）。':'Images are inserted after the selected frame. The first image creates a new animation if none is loaded.',
'按右上角「輸出並下載」執行完整輸出。APNG 解碼／編碼使用瀏覽器內建壓縮串流 API；16-bit 色深或交錯式 PNG 暫不支援。':'Use Render and Download to export. APNG uses browser compression streams; 16-bit and interlaced PNG are not supported.',
'尚未載入圖片':'No image loaded','尚未載入動畫':'No animation loaded',
}
for p in root.glob('tools/*/index.html'):
    s=p.read_text(encoding='utf-8'); boundary=s.index('<body>'); end=s.index('</body>')
    markup=s[boundary:end]
    # Translate leaf text without replacing controls or numeric spans in their parent.
    def replace(m):
        value=m.group(1); stripped=value.strip()
        if stripped not in translations: return m.group(0)
        return '><span data-se-zh="'+html.escape(stripped,quote=True)+'" data-se-en="'+html.escape(translations[stripped],quote=True)+'">'+value+'</span><'
    # Only HTML preceding the first inline script inside body.
    split=markup.find('<script'); split=len(markup) if split<0 else split
    a=markup[:split];tail=markup[split:]
    # Options must remain text-only.
    for zh,en in translations.items():
        a=re.sub(r'(<option\b[^>]*)(>'+re.escape(zh)+r'</option>)',lambda m:m[1]+' data-se-zh="'+html.escape(zh,quote=True)+'" data-se-en="'+html.escape(en,quote=True)+'"'+m[2],a)
    # Translate direct text nodes, except option text now handled by attributes.
    a=re.sub(r'>([^<>]+)<',replace,a)
    a=re.sub(r'(<option[^>]*>)<span[^>]*>(.*?)</span>(</option>)',r'\1\2\3',a)
    s=s[:boundary]+a+tail+s[end:]
    s=s.replace('assets/shared.js"','assets/shared.js?v=20260907-1"')
    p.write_text(s,encoding='utf-8')

p=root/'tools/image-editor/index.html';s=p.read_text(encoding='utf-8')
s=s.replace("if(el.dataset.zhCache === undefined) el.dataset.zhCache = el.textContent;\n    el.textContent = (lang === 'en') ? el.dataset.en : el.dataset.zhCache;", "const node = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());\n    if (!node) return;\n    if(el.dataset.zhCache === undefined) el.dataset.zhCache = node.textContent;\n    node.textContent = (lang === 'en') ? el.dataset.en + ' ' : el.dataset.zhCache;")
s=s.replace(' data-en="0 frames"','')
s=s.replace("  SharedSettings.paintHomeLinks(lang);", "  SharedSettings.paintHomeLinks(lang);\n  SharedSettings.paintExtraTranslations(lang);")
for zh,en in {'透明棋盤':'Transparent checkerboard','白色':'White','黑色':'Black','自訂顏色':'Custom color'}.items():
    s=s.replace('title="'+zh+'"', 'title="'+zh+'" data-title-zh="'+zh+'" data-title-en="'+en+'"')
s=s.replace('placeholder="輸入要疊加的文字"','placeholder="輸入要疊加的文字" data-se-zh="輸入要疊加的文字" data-se-en="Enter caption text"')
p.write_text(s,encoding='utf-8')

p=root/'index.html';s=p.read_text(encoding='utf-8').replace('assets/shared.js"','assets/shared.js?v=20260907-1"')
cards=''
for slug,icon,zh,en,desc,desc_en in [('hash-calculator','🔐','雜湊計算器','Hash Calculator','計算文字或檔案的 MD5 與 SHA 雜湊值。','Calculate MD5 and SHA hashes of text or files.'),('csv-converter','🔄','CSV ↔ JSON 轉換器','CSV ↔ JSON Converter','轉換 CSV 與 JSON，支援含引號與換行的欄位。','Convert CSV and JSON, including quoted and multiline fields.')]:
    cards+=f'<a class="card" href="tools/{slug}/"><div class="icon">{icon}</div><h3 data-se-zh="{zh}" data-se-en="{en}">{zh}</h3><p data-se-zh="{desc}" data-se-en="{desc_en}">{desc}</p><div class="go" data-se-zh="開啟工具 →" data-se-en="Open tool →">開啟工具 →</div></a>\n'
s=s.replace('  </div>\n</main>',cards+'  </div>\n</main>');p.write_text(s,encoding='utf-8')
