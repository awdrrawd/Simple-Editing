'use strict';
const log = document.getElementById('log'), frame = document.getElementById('frame');
let w, d, downloads, errors, passed=0, failed=0, videoFixture;
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
function line(message,ok=true) { const el=document.createElement('div');el.className=ok?'pass':'fail';el.textContent=message;log.appendChild(el); }
function assert(ok,message) { if(!ok) throw new Error(message); }
async function until(predicate,message,timeout=20000) { const start=Date.now();while(!predicate()) { if(Date.now()-start>timeout) throw new Error(message);await pause(50); } }
async function test(name,fn) { const filter=new URLSearchParams(location.search).get('filter');if(filter&&!name.match(new RegExp(filter,'i')))return;try { await fn(); passed++;line('PASS '+name); }catch(e){failed++;line('FAIL '+name+': '+e.message,false);} }
async function page(tool) {
  errors=[]; downloads=[];
  const target = new URL(tool==='home'?'../index.html?test='+Date.now():'../tools/'+tool+'/?test='+Date.now(),location.href).href;
  await new Promise(resolve=>{ frame.onload=()=>{if(frame.contentWindow.location.href===target)resolve();}; frame.src=target; });
  w=frame.contentWindow;d=w.document;
  w.alert=message=>{line('ALERT '+message,false)};
  w.confirm=()=>true;
  w.addEventListener('error',e=>errors.push(e.message));w.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
  w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push({name:this.download,url:this.href,blob:fetch(this.href).then(r=>r.blob())});};
  await until(()=>d.querySelector('.se-toolbar'),'toolbar missing');
}
const el=id=>d.getElementById(id);
function click(id){assert(el(id),'missing '+id);el(id).click();}
function value(id,text,event='input'){el(id).value=text;el(id).dispatchEvent(new w.Event(event,{bubbles:true}));}
function choose(id,files){const dt=new w.DataTransfer();files.forEach(f=>dt.items.add(f));el(id).files=dt.files;el(id).dispatchEvent(new w.Event('change',{bubbles:true}));}
async function fixture(name){return new w.File([await (await fetch('fixtures/'+name)).arrayBuffer()],name,{type:{wav:'audio/wav',png:'image/png',apng:'image/png',gif:'image/gif',csv:'text/csv',json:'application/json'}[name.split('.').pop()]||'application/octet-stream'});}
async function downloaded(){await until(()=>downloads.length,'no download');return downloads.pop();}
async function lastBlob(){return (await downloaded()).blob;}
async function makeVideo() {
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d'), stream=canvas.captureStream(10);
  const chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
  const done=new Promise(resolve=>recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'})));
  recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
  for(let i=0;i<15;i++){ctx.fillStyle=i%2?'#f00':'#00f';ctx.fillRect(0,0,64,64);await pause(100);}
  recorder.stop();const blob=await done;stream.getTracks().forEach(t=>t.stop());return blob;
}
document.getElementById('run').onclick=async()=>{
  document.getElementById('run').disabled=true;log.replaceChildren();passed=failed=0;
  const savedTheme=localStorage.getItem('se-theme'),savedLang=localStorage.getItem('se-lang'), savedCooldown=localStorage.getItem('aiCooldownData_v2');
  try {
    localStorage.setItem('se-lang','en');localStorage.setItem('se-theme','light');
    for(const name of ['home','ai-cooldown','audio-editor','base64-converter','csv-converter','hash-calculator','image-editor','image-sharp-resize','json-formatter','markdown-editor','media-converter','svg-optimizer','url-encoder']) {
      await test(name+' theme/language/navigation',async()=>{
        await page(name);
        const controls=[...d.querySelectorAll('.se-toolbar > *')];
        assert(controls.map(e=>e.dataset.seControl).join(',')===(name==='home'?'theme,language':'theme,language,home'),'wrong order');
        assert(d.documentElement.dataset.theme==='light','initial theme');
        controls[0].click();await pause(30);assert(d.documentElement.dataset.theme==='dark','dark theme');
        if(name==='image-editor')assert(!d.documentElement.classList.contains('light-theme'),'image theme class');
        controls[1].click();await pause(30);assert(d.documentElement.lang==='zh-Hant','Chinese lang');
        assert(controls[1].textContent==='🌐 English','language label');
        controls[1].click();controls[0].click();await pause(30);
        assert(d.documentElement.lang==='en','English lang');assert(d.documentElement.dataset.theme==='light','restore light');
        assert(errors.length===0,errors.join('; '));
      });
    }
    await test('Base64 Unicode, literal HTML, 1 MiB and file download',async()=>{
      await page('base64-converter');value('encodeTextInput','中文 😀 é <b>hello</b>');click('btnEncode');
      assert(el('encodeOutput').value===btoa(unescape(encodeURIComponent('中文 😀 é <b>hello</b>'))),'UTF-8');
      value('decodeInput',el('encodeOutput').value);value('decodeOutputType','text','change');click('btnDecode');
      assert(el('decodeOutput').textContent==='中文 😀 é <b>hello</b>'&&!el('decodeOutput').querySelector('b'),'literal text');
      choose('encodeFileInput',[await fixture('large.bin')]);click('btnEncode');await until(()=>el('encodeOutput').value.length>1000000,'large encode');
      value('decodeInput',el('encodeOutput').value);value('decodeOutputType','file','change');value('decodeFileName','roundtrip.bin');click('btnDecode');click('btnDecodeDownload');
      const bytes=new Uint8Array(await (await lastBlob()).arrayBuffer());assert(bytes.length===1048576&&bytes.every((v,i)=>v===i%256),'binary round trip');
    });
    await test('CSV quoted multiline parse and JSON export',async()=>{
      await page('csv-converter');choose('csvFileInput',[await fixture('sample.csv')]);click('btnCsvToJson');await until(()=>el('jsonOutput').value,'CSV parse');
      const rows=JSON.parse(el('jsonOutput').value);assert(rows[0].note==='hello, world'&&rows[1].note.replace(/\r\n/g,'\n')==='line 1\nline 2','CSV quoting: '+JSON.stringify(rows));
      value('jsonTextInput',JSON.stringify(rows));click('btnJsonToCsv');assert(el('csvOutput').value.replace(/\r\n/g,'\n').includes('"line 1\nline 2"'),'CSV output');click('btnDownloadCsv');assert((await lastBlob()).size>20,'CSV download');
    });
    await test('Hash MD5 / SHA-256 known values and copy',async()=>{
      await page('hash-calculator');value('hashTextInput','abc');value('hashAlgorithm','MD5','change');click('btnCalculate');await until(()=>el('resultHash').textContent,'MD5');assert(el('resultHash').textContent==='900150983cd24fb0d6963f7d28e17f72','MD5');
      value('hashAlgorithm','SHA-256','change');click('btnCalculate');await until(()=>el('resultHash').textContent.length===64,'SHA256');assert(el('resultHash').textContent==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad','SHA256');
      let copied='';w.SharedSettings.copyText=async text=>{copied=text};click('btnCopyHash');await pause(20);assert(copied===el('resultHash').textContent,'copy');
    });
    await test('JSON and URL transformations',async()=>{
      await page('json-formatter');value('jsonInput','{"中文": [1,true]}');click('btnProcess');assert(JSON.parse(el('jsonOutput').value)['中文'][1]===true,'JSON');value('jsonAction','minify','change');click('btnProcess');assert(el('jsonOutput').value==='{"中文":[1,true]}','minify');
      await page('url-encoder');value('encodeInput','中文 &?');click('btnEncode');value('decodeInput',el('encodeOutput').value);click('btnDecode');assert(el('decodeOutput').value==='中文 &?','URL round trip');
    });
    await test('SVG optimization controls, preview and download',async()=>{
      await page('svg-optimizer');value('svgTextInput','<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><metadata>test</metadata><rect width="64" height="64" fill="#ff0000"/></svg>');click('btnOptimize');await until(()=>el('svgOutput').value,'SVG');assert(el('svgOutput').value.includes('viewBox')&&!el('svgOutput').value.includes('metadata'),'SVG geometry');
      el('optConvertColors').checked=false;click('btnOptimize');await until(()=>!el('btnOptimize').disabled,'SVG option');assert(el('svgOutput').value.includes('#ff0000'),'color unchecked');click('btnDownload');assert((await lastBlob()).type==='image/svg+xml','SVG download');
    });
    await test('Image resize algorithms and repeat download',async()=>{
      await page('image-sharp-resize');choose('imageInput',[await fixture('sample.png')]);value('width','32');value('height','32');
      for(const mode of ['lanczos3','bilinear','nearest']){value('resizeMode',mode,'change');click('btnResize');await until(()=>!el('btnResize').disabled,'resize');click('btnDownload');const bitmap=await createImageBitmap(await lastBlob());assert(bitmap.width===32&&bitmap.height===32,mode);bitmap.close();}
      click('btnDownload');assert((await lastBlob()).size>0,'second download');
    });
    await test('Audio playback, pause/resume and >30-second WAV export',async()=>{
      await page('audio-editor');choose('audioFiles',[await fixture('long.wav')]);click('btnLoad');await until(()=>d.querySelector('.track'),'audio load');
      const buttons=d.querySelector('.track-controls').querySelectorAll('button');buttons[0].click();await until(()=>buttons[0].disabled,'audio start');await pause(600);buttons[1].click();await pause(100);const first=parseFloat(d.querySelector('.track .progress-bar div').style.width);buttons[0].click();await until(()=>buttons[0].disabled,'audio resume');await pause(600);buttons[1].click();await pause(100);assert(parseFloat(d.querySelector('.track .progress-bar div').style.width)>first,'resume position: '+first+' -> '+d.querySelector('.track .progress-bar div').style.width);
      click('btnDownloadMix');const blob=await lastBlob();const buffer=await blob.arrayBuffer(),view=new DataView(buffer);assert(view.getUint32(40,true)/view.getUint32(28,true)>=31,'long WAV duration');assert(view.getUint16(22,true)===2,'stereo');
    });
    await test('Media audio formats and trimming',async()=>{
      await page('media-converter');choose('audioInput',[await fixture('tone.wav')]);
      for(const format of ['mp3','wav','ogg','aac']){value('audioFormat',format,'change');click('btnConvertAudio');await until(()=>!el('btnConvertAudio').disabled,'convert '+format,90000);assert(el('hintConvertAudio').textContent==='Complete!',el('hintConvertAudio').textContent);const a=el('audioOutput').querySelector('a');assert(a&&a.download.endsWith('.'+format),'output '+format);assert((await (await fetch(a.href)).blob()).size>0,'audio bytes');}
      choose('trimInput',[await fixture('tone.wav')]);value('startTime','0.2');value('endTime','0.8');click('btnTrimMedia');await until(()=>!el('btnTrimMedia').disabled,'trim');assert(el('hintTrimMedia').textContent==='Complete!',el('hintTrimMedia').textContent);
    });
    await test('Media video MP4, WebM and GIF',async()=>{
      videoFixture=await makeVideo();await page('media-converter');choose('videoInput',[new w.File([videoFixture],'test.webm',{type:'video/webm'})]);
      for(const format of ['mp4','webm','gif','ogg']){value('videoFormat',format,'change');click('btnConvertVideo');await until(()=>!el('btnConvertVideo').disabled,'video '+format,90000);assert(el('hintConvertVideo').textContent==='Complete!',format+': '+el('hintConvertVideo').textContent);}
    });
    await test('Image editor resize / color / SVG / PNG',async()=>{
      await page('image-editor');choose('file-input',[await fixture('sample.png')]);await until(()=>el('dims-label').textContent.includes('64'),'image load');
      el('live-apply').checked=false;value('resize-w','32');click('btn-apply-resize');assert(el('dims-label').textContent.includes('32'),'resize');
      d.querySelector('#static-toolbar [data-tool="crop"]').click();value('crop-x','0','change');value('crop-y','0','change');value('crop-w','16','change');value('crop-h','16','change');click('btn-crop-apply');assert(el('dims-label').textContent.includes('16'),'crop');
      value('c-bright','120');click('btn-apply-color');click('btn-download');assert((await lastBlob()).size>0,'PNG');
      click('btn-svg-preview');await until(()=>!el('btn-svg-download').disabled,'image to SVG');click('btn-svg-download');assert((await lastBlob()).type==='image/svg+xml','SVG export');
      click('btn-lang-toggle');click('btn-lang-toggle');assert(el('val-svg-colors'),'language preserves nested controls');
    });
    await test('Animated GIF/APNG decode, frame edit and export',async()=>{
      await page('image-editor');choose('anim-file-input',[await fixture('sample.apng')]);await until(()=>el('anim-frame-count').textContent.startsWith('2'),'APNG decode');
      value('output-format','apng','change');click('btn-render-anim');assert((await lastBlob()).type==='image/png','APNG output');
      value('output-format','gif','change');click('btn-render-anim');assert((await lastBlob()).type==='image/gif','GIF output');
      choose('anim-file-input',[await fixture('sample.gif')]);await until(()=>el('anim-frame-count').textContent.startsWith('1'),'GIF decode');
      const frameButtons=el('anim-frame-strip').querySelectorAll('button');assert(frameButtons.length>=2,'frame editing buttons');frameButtons[0].click();assert(el('anim-frame-count').textContent.startsWith('2'),'duplicate');
    });
    await test('AI Cooldown add, persist and edit',async()=>{
      localStorage.setItem('aiCooldownData_v2',JSON.stringify({entries:[],nextId:1}));await page('ai-cooldown');value('siteName','Test');value('accountName','Fixture');click('addBtn');assert(d.querySelector('tbody').textContent.includes('Fixture'),'add');await page('ai-cooldown');assert(d.querySelector('tbody').textContent.includes('Fixture'),'persist');
      d.querySelector('.edit-btn').click();value('accountName','Updated');click('addBtn');assert(d.querySelector('tbody').textContent.includes('Updated'),'edit');d.querySelector('.btn-star').click();assert(d.querySelector('.btn-star.active'),'star');d.querySelector('.delete-btn').click();d.querySelector('.confirm-delete-btn').click();assert(!d.querySelector('tbody').textContent.includes('Updated'),'delete');
    });
    await test('Image editor video to animation frames',async()=>{
      if(!videoFixture)videoFixture=await makeVideo();await page('image-editor');choose('video-file-input',[new w.File([videoFixture],'test.webm',{type:'video/webm'})]);await until(()=>el('video-preview').readyState>=1,'video metadata');
      value('video-start','0');value('video-end','1');value('video-fps','3');click('btn-convert-video');await until(()=>parseInt(el('anim-frame-count').textContent)>=3,'video frames',30000);assert(!el('video-status').textContent.includes('failed'),'video extraction');
    });
    await test('Markdown preview, formatting and MD export',async()=>{
      await page('markdown-editor');const ta=d.querySelector('textarea');ta.value='# Test\n\n**Bold**';ta.dispatchEvent(new w.Event('input',{bubbles:true}));assert(d.querySelector('.preview strong')?.textContent==='Bold','preview');click('exportMdBtn');assert((await (await lastBlob()).text()).includes('**Bold**'),'MD export');
    });
  } finally {
    for(const [key,value] of [['se-theme',savedTheme],['se-lang',savedLang],['aiCooldownData_v2',savedCooldown]])if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);
    line('DONE '+passed+' passed, '+failed+' failed',failed===0);document.getElementById('run').disabled=false;
  }
};

