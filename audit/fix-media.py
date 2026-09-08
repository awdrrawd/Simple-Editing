from pathlib import Path
p=Path('tools/media-converter/index.html')
s=p.read_text(encoding='utf-8').replace('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js','../../assets/vendor/ffmpeg/ffmpeg.js')
s=s.replace('<script src="../../assets/vendor/ffmpeg/ffmpeg.js"></script>', '<script src="../../assets/vendor/ffmpeg/ffmpeg.js"></script>\n<script src="../../assets/media-engine.js"></script>')
a=s.index('  // FFmpeg instance'); b=s.index('  // Helper MIME types',a)
s=s[:a]+'''  let busy = false;
  let activeProgress = null;
  const resultUrls = new Map();
  const buttons = ['btnConvertVideo', 'btnConvertAudio', 'btnTrimMedia'].map(id => document.getElementById(id));
  function showProgress(percent) {
    if (activeProgress) activeProgress.querySelector('div').style.width = percent + '%';
  }
  async function processMedia(kind) {
    if (busy) return;
    const trim = kind === 'trim';
    const file = document.getElementById(trim ? 'trimInput' : kind + 'Input').files[0];
    if (!file) { alert(lang === 'zh' ? '請先選取檔案' : 'Please select a file first'); return; }
    const start = Number(document.getElementById('startTime').value || 0);
    const endText = document.getElementById('endTime').value;
    const end = Number(endText);
    if (trim && (!endText || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start)) {
      alert(lang === 'zh' ? '時間必須有效，且結束時間大於開始時間' : 'Enter valid times with end greater than start'); return;
    }
    const isVideo = kind === 'video' || (trim && file.type.startsWith('video/'));
    const format = trim ? (isVideo ? 'mp4' : 'mp3') : document.getElementById(kind + 'Format').value;
    const output = document.getElementById(kind + 'Output');
    const hint = document.getElementById(trim ? 'hintTrimMedia' : kind === 'video' ? 'hintConvertVideo' : 'hintConvertAudio');
    const inputName = 'input' + (file.name.match(/\\.[a-z0-9]+$/i)?.[0] || '.bin');
    const outputName = 'output.' + format;
    busy = true; buttons.forEach(button => button.disabled = true);
    activeProgress = document.getElementById(kind + 'Progress');
    activeProgress.style.display = 'block'; showProgress(0);
    hint.textContent = lang === 'zh' ? '正在載入轉換引擎…' : 'Loading conversion engine…';
    let engine;
    try {
      engine = await MediaEngine.load(showProgress);
      await engine.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
      hint.textContent = lang === 'zh' ? '處理中…' : 'Processing…';
      let args = ['-i', inputName];
      if (trim) args.push('-ss', String(start), '-t', String(end - start));
      if (format === 'gif') args.push('-vf', 'fps=15,scale=320:-1:flags=lanczos', '-an');
      else if (isVideo) {
        const codecs = { mp4: ['libx264', 'aac'], webm: ['libvpx', 'libvorbis'], ogg: ['libtheora', 'libvorbis'] };
        args.push('-c:v', codecs[format][0], '-c:a', codecs[format][1]);
        if (format === 'mp4') args.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-pix_fmt', 'yuv420p');
      } else {
        const codecs = {mp3:'libmp3lame', ogg:'libvorbis', wav:'pcm_s16le', aac:'aac'};
        args.push('-vn', '-c:a', codecs[format]);
      }
      args.push(outputName);
      const status = await engine.exec(args);
      if (status !== 0) throw new Error(lang === 'zh' ? '不支援此檔案或格式，請檢查輸入' : 'Unsupported or invalid input/format');
      const data = await engine.readFile(outputName);
      if (!data.length) throw new Error('Empty output');
      if (resultUrls.has(kind)) URL.revokeObjectURL(resultUrls.get(kind));
      const url = URL.createObjectURL(new Blob([data], {type: isVideo ? getMimeType(format) : getAudioMimeType(format)}));
      resultUrls.set(kind, url);
      output.replaceChildren();
      const preview = document.createElement(format === 'gif' ? 'img' : isVideo ? 'video' : 'audio');
      preview.src = url; preview.controls = true; preview.style.maxWidth = '100%';
      output.appendChild(preview);
      const link = document.createElement('a');
      link.href = url; link.download = file.name.replace(/\\.[^.]+$/, '') + (trim ? '_trimmed' : '_converted') + '.' + format;
      link.textContent = lang === 'zh' ? '下載結果' : 'Download result';
      link.dataset.seZh = '下載結果'; link.dataset.seEn = 'Download result';
      link.style.display = 'block'; output.appendChild(link);
      hint.textContent = lang === 'zh' ? '處理完成！' : 'Complete!';
    } catch (error) {
      hint.textContent = (lang === 'zh' ? '處理失敗：' : 'Failed: ') + error.message;
    } finally {
      if (engine) for (const name of [inputName, outputName]) { try { await engine.deleteFile(name); } catch (_) {} }
      activeProgress.style.display = 'none'; activeProgress = null;
      busy = false; buttons.forEach(button => button.disabled = false);
    }
  }
  buttons[0].addEventListener('click', () => processMedia('video'));
  buttons[1].addEventListener('click', () => processMedia('audio'));
  buttons[2].addEventListener('click', () => processMedia('trim'));
  window.addEventListener('pagehide', () => resultUrls.forEach(url => URL.revokeObjectURL(url)));

'''+s[b:]
p.write_text(s,encoding='utf-8')

p=Path('tools/svg-optimizer/index.html');s=p.read_text(encoding='utf-8')
a=s.index('<!-- SVGO library');b=s.index('<style>',a)
s=s[:a]+s[b:]
s=s.replace("btnOptimize.addEventListener('click', () => {", "btnOptimize.addEventListener('click', async () => {")
s=s.replace('function processSVG() {','async function processSVG() {')
a=s.index('      // Build SVGO options');b=s.index('        const optimized = result.data;',a)
s=s[:a]+'''      try {
        btnOptimize.disabled = true;
        const { optimize } = await import('../../assets/vendor/svgo.browser.js');
        const plugins = [];
        // Keep viewBox when removing dimensions so the image stays scalable.
        if (optRemoveViewBox.checked && !optRemoveDimensions.checked) plugins.push('removeViewBox');
        if (optCleanupIDs.checked) plugins.push('cleanupIds');
        if (optRemoveMetadata.checked) plugins.push('removeMetadata');
        if (optConvertColors.checked) plugins.push('convertColors');
        if (optRemoveDimensions.checked) plugins.push('removeDimensions');
        const result = optimize(svgString, {plugins});
'''+s[b:]
s=s.replace('const info = result.info;', 'const info = {originalSize: new Blob([svgString]).size, size: new Blob([optimized]).size};')
s=s.replace("btnCopy.style.display = 'none';\n      }", "btnCopy.style.display = 'none';\n      } finally { btnOptimize.disabled = false; }")
p.write_text(s,encoding='utf-8')
