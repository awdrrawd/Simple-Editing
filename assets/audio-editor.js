(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const text = (zh, en) => SharedSettings.getLang() === 'en' ? en : zh;
  const tracks = [];
  let context, exporting = false;
  function getContext() { return context || (context = new AudioContext()); }
  function position(t) { return Math.min(t.buffer.duration, t.offset + (t.source ? (context.currentTime - t.started) * t.rate : 0)); }
  function pause(t, reset = false) {
    t.offset = reset ? 0 : position(t);
    if (t.source) { t.source.onended = null; t.source.stop(); t.source.disconnect(); t.source = null; }
    t.play.disabled = false; t.pause.disabled = true;
    t.bar.style.width = (t.offset / t.buffer.duration * 100) + '%';
  }
  async function play(t) {
    if (t.source) return;
    await getContext().resume();
    if (t.source || !tracks.includes(t)) return;
    if (t.offset >= t.buffer.duration) t.offset = 0;
    const source = context.createBufferSource();
    source.buffer = t.buffer; source.playbackRate.value = t.rate;
    source.connect(t.gain); t.source = source; t.started = context.currentTime;
    source.onended = () => { if (t.source === source) { t.source = null; t.offset = 0; t.play.disabled = false; t.pause.disabled = true; source.disconnect(); } };
    source.start(0, t.offset); t.play.disabled = true; t.pause.disabled = false;
  }
  function button(zh, en, action) {
    const el = document.createElement('button'); el.className = 'btn'; el.type = 'button';
    el.dataset.seZh = zh; el.dataset.seEn = en; el.textContent = text(zh, en);
    el.addEventListener('click', action); return el;
  }
  function waveform(t) {
    const canvas = t.canvas, ctx = canvas.getContext('2d');
    canvas.width = Math.max(200, Math.round(canvas.clientWidth)); canvas.height = 60;
    const data = t.buffer.getChannelData(0), step = Math.max(1, Math.ceil(data.length / canvas.width));
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      let min = 0, max = 0;
      for (let i = x * step; i < Math.min(data.length, (x + 1) * step); i++) { min = Math.min(min, data[i]); max = Math.max(max, data[i]); }
      ctx.moveTo(x, 30 + min * 29); ctx.lineTo(x, 30 + max * 29);
    }
    ctx.stroke();
  }
  function addTrack(file, buffer) {
    const el = document.createElement('div'); el.className = 'track';
    const title = document.createElement('div'); title.className = 'track-header'; title.textContent = file.name;
    el.appendChild(title);
    const controls = document.createElement('div'); controls.className = 'track-controls'; title.appendChild(controls);
    const t = {file, buffer, el, source:null, offset:0, started:0, rate:1, gain:getContext().createGain()};
    t.gain.connect(context.destination);
    t.play = button('播放', 'Play', () => play(t).catch(showError));
    t.pause = button('暫停', 'Pause', () => pause(t)); t.pause.disabled = true;
    controls.append(t.play, t.pause, button('移除', 'Remove', () => { pause(t,true); t.gain.disconnect(); tracks.splice(tracks.indexOf(t),1); el.remove(); }));
    function slider(zh,en,min,max,initial,onInput) {
      const row = document.createElement('label'); row.className = 'slider-group';
      const label = document.createElement('span'); label.dataset.seZh = zh; label.dataset.seEn = en; label.textContent = text(zh,en);
      const input = document.createElement('input'); input.type = 'range'; input.min = min; input.max = max; input.step = '0.01'; input.value = initial;
      input.addEventListener('input', () => onInput(Number(input.value))); row.append(label,input); el.appendChild(row); return input;
    }
    t.volume = slider('音量','Volume',0,1,1,v => t.gain.gain.setValueAtTime(v,context.currentTime));
    slider('音高（會影響速度）','Pitch (affects speed)',0.5,2,1,v => {
      t.offset = position(t); t.started = context.currentTime; t.rate = v;
      if (t.source) t.source.playbackRate.setValueAtTime(v,context.currentTime);
    });
    t.canvas = document.createElement('canvas'); t.canvas.style.width = '100%'; t.canvas.style.height = '60px'; el.appendChild(t.canvas);
    const bar = document.createElement('div'); bar.className = 'progress-bar'; t.bar = document.createElement('div'); bar.appendChild(t.bar); el.appendChild(bar);
    el.appendChild(button('下載此軌 WAV','Download track WAV', () => exportTracks([t], file.name.replace(/\.[^.]+$/,'')+'.wav').catch(showError)));
    $('tracksContainer').appendChild(el); tracks.push(t); waveform(t);
  }
  function showError(error) { $('hintLoad').textContent = text('處理失敗：','Failed: ') + error.message; }
  $('btnLoad').addEventListener('click', async () => {
    const files = Array.from($('audioFiles').files);
    if (!files.length) { $('hintLoad').textContent = text('請先選擇音訊檔案','Select audio files first'); return; }
    $('btnLoad').disabled = true;
    let loaded = 0, errors = [];
    try {
      await getContext().resume();
      for (const file of files) {
        try { const buffer = await context.decodeAudioData(await file.arrayBuffer()); addTrack(file,buffer); loaded++; }
        catch (error) { errors.push(file.name + ': ' + error.message); }
      }
      $('hintLoad').textContent = text(`已載入 ${loaded} 個檔案`, `Loaded ${loaded} files`) + (errors.length ? ' — ' + errors.join('; ') : '');
    } catch (error) { showError(error); }
    finally { $('btnLoad').disabled = false; }
  });
  $('btnPlayAll').addEventListener('click', () => Promise.all(tracks.map(play)).catch(showError));
  $('btnStopAll').addEventListener('click', () => tracks.forEach(t => pause(t,true)));
  const download = button('下載混合音訊','Download mixed audio', async () => {
    if (exporting) return;
    exporting = true;
    download.disabled = true;
    try { await exportTracks(tracks.slice(), 'mixed_output.wav'); } catch (error) { showError(error); }
    finally { exporting = false; download.disabled = tracks.length === 0; }
  });
  download.id = 'btnDownloadMix'; document.querySelector('main').appendChild(download);
  async function exportTracks(selected, name) {
    if (!selected.length) return;
    const rate = 44100;
    const length = Math.max(...selected.map(t => Math.ceil(t.buffer.duration / t.rate * rate)));
    const offline = new OfflineAudioContext(2, Math.max(1,length), rate);
    selected.forEach(t => {
      const source = offline.createBufferSource(), gain = offline.createGain();
      source.buffer = t.buffer; source.playbackRate.value = t.rate; gain.gain.value = Number(t.volume.value);
      source.connect(gain).connect(offline.destination); source.start();
    });
    const rendered = await offline.startRendering();
    const buffer = new ArrayBuffer(44 + rendered.length * 4), view = new DataView(buffer);
    const write = (offset,s) => { for(let i=0;i<s.length;i++) view.setUint8(offset+i,s.charCodeAt(i)); };
    write(0,'RIFF'); view.setUint32(4,36+rendered.length*4,true); write(8,'WAVE'); write(12,'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,2,true);
    view.setUint32(24,rate,true); view.setUint32(28,rate*4,true); view.setUint16(32,4,true); view.setUint16(34,16,true);
    write(36,'data'); view.setUint32(40,rendered.length*4,true);
    const left=rendered.getChannelData(0), right=rendered.getChannelData(1);
    for(let i=0;i<rendered.length;i++) for(let c=0;c<2;c++) { const n=Math.max(-1,Math.min(1,c ? right[i] : left[i])); view.setInt16(44+i*4+c*2,n*(n<0 ? 32768 : 32767),true); }
    const url=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function update() {
    let sum=0;
    tracks.forEach(t => { const fraction=position(t)/t.buffer.duration; t.bar.style.width=fraction*100+'%'; sum+=fraction; });
    $('globalProgress').querySelector('div').style.width=(tracks.length ? sum/tracks.length*100 : 0)+'%';
    $('btnPlayAll').disabled=!tracks.length || tracks.every(t=>t.source);
    $('btnStopAll').disabled=!tracks.some(t=>t.source || t.offset);
    download.disabled = exporting || !tracks.length;
    requestAnimationFrame(update);
  }
  new MutationObserver(()=>tracks.forEach(waveform)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',()=>tracks.forEach(waveform));
  requestAnimationFrame(update);
})();
