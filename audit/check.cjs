const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', ...fs.readdirSync(path.join(root, 'tools')).map(n => `tools/${n}/index.html`)];
let passed = 0;
function check(name, ok, details = '') { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${details ? ': ' + details : ''}`); if (ok) passed++; else process.exitCode = 1; }
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  try { for (const [, attrs, code] of scripts) if (!/type="module"/.test(attrs)) new vm.Script(code); check(`syntax ${page}`, true); } catch(e) { check(`syntax ${page}`, false, e.message); }
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  check(`unique IDs ${page}`, !duplicates.length, duplicates.join(', '));
  for (const [, attrs] of scripts) {
    const source=attrs.match(/src="([^"]+)"/);
    if (source && !/^https?:/.test(source[1])) check(`local script ${page}: ${source[1]}`,fs.existsSync(path.resolve(root,path.dirname(page),source[1].split('?')[0])));
  }
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const missing = [...new Set([...css.matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]).filter(n => !defined.has(n)))];
  check(`CSS variables ${page}`, !missing.length, missing.join(', '));
}
for (const file of fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js'))) {
  try { new vm.Script(fs.readFileSync(path.join(root,'assets',file),'utf8'));check(`syntax assets/${file}`,true); }
  catch(e){check(`syntax assets/${file}`,false,e.message)}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const name of fs.readdirSync(path.join(root, 'tools'))) check(`home link ${name}`, home.includes(`href="tools/${name}/"`));

// Execute the actual inline handlers with a minimal DOM fixture. This is not a browser test.
function load(name) {
  const html = fs.readFileSync(path.join(root, `tools/${name}/index.html`), 'utf8');
  const nodes = new Map(); const alerts = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', files: [], style: {}, dataset: {}, textContent: '', innerHTML: '', checked: false, handlers: {}, children:[], replaceChildren(){this.children=[];this.innerHTML=''}, appendChild(el){this.children.push(el)}, classList: {add(){},remove(){}}, addEventListener(k,f){this.handlers[k]=f}, setAttribute(){}, getAttribute(){return 'light'}, select(){}, querySelectorAll(){return []} });
    return nodes.get(id);
  }
  const ctx = { document: {documentElement:node('root'), getElementById:node, querySelectorAll(){return []}}, SharedSettings:{getLang:()=> 'zh',getTheme:()=> 'light',hasExplicitTheme:()=>false,setLang(){},setTheme(){},paintHomeLinks(){}}, window:{matchMedia:()=>({addEventListener(){}})}, alert:s=>alerts.push(s), console, TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Blob,URL,btoa,atob,crypto:require('node:crypto').webcrypto };
  ctx.document.createElement = tag => ({tagName:tag,textContent:'',style:{},select(){},remove(){}});
  ctx.document.readyState = 'loading'; ctx.document.addEventListener = () => {};
  ctx.document.body = {appendChild(){}};
  let copied = '';
  ctx.document.execCommand = () => true;
  ctx.navigator = {language:'zh',clipboard:{writeText: async value => {copied=value}}};
  ctx.window.isSecureContext = true;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/shared.js'),'utf8'),ctx);
  ctx.SharedSettings=ctx.window.SharedSettings;
  ctx.md5=require('../node_modules/js-md5');
  for (const [,attrs,code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if (!/src=|type="module"/.test(attrs)) vm.runInContext(code,ctx);
  return {node,alerts,ctx,copied:()=>copied};
}
(async()=>{
  const b = load('base64-converter');
  b.node('encodeTextInput').value='hello'; b.node('btnEncode').handlers.click(); check('Base64 ASCII',b.node('encodeOutput').value==='aGVsbG8=');
  b.node('encodeTextInput').value='中文'; b.node('btnEncode').handlers.click(); check('Base64 UTF-8 Chinese',b.node('encodeOutput').value===Buffer.from('中文').toString('base64'),b.alerts.join('; '));
  b.node('decodeInput').value=Buffer.from('<b>hello</b>').toString('base64'); b.node('decodeOutputType').value='text'; b.node('btnDecode').handlers.click(); check('Base64 decoded text is not HTML',b.node('decodeOutput').children[0]?.textContent==='<b>hello</b>');
  const bytes=new Uint8Array(1024*1024);bytes.forEach((_,i)=>bytes[i]=i%256);check('Base64 1 MiB byte round trip',Buffer.from(b.ctx.SharedSettings.bytesToBase64(bytes),'base64').equals(Buffer.from(bytes)));
  const h=load('hash-calculator'); h.node('hashTextInput').value='abc'; h.node('hashAlgorithm').value='SHA-256'; await h.node('btnCalculate').handlers.click(); check('SHA-256 known vector',h.node('resultHash').textContent==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  h.node('hashAlgorithm').value='MD5'; await h.node('btnCalculate').handlers.click(); check('MD5 known vector',h.node('resultHash').textContent==='900150983cd24fb0d6963f7d28e17f72',h.alerts.join('; '));
  delete h.node('resultHash').select; await h.node('btnCopy').handlers.click(); check('hash copy from span',h.copied()==='900150983cd24fb0d6963f7d28e17f72');
  const j=load('json-formatter');j.node('jsonInput').value='{"a":1}';j.node('jsonAction').value='format';j.node('btnProcess').handlers.click();check('JSON beautify',j.node('jsonOutput').value==='{\n  "a": 1\n}');j.node('jsonInput').value='{';j.node('btnValidate').handlers.click();check('JSON invalid input',j.node('jsonStatus').className==='status invalid');
  const u=load('url-encoder');u.node('encodeInput').value='中文 &?';u.node('btnEncode').handlers.click();u.node('decodeInput').value=u.node('encodeOutput').value;u.node('btnDecode').handlers.click();check('URL Unicode round trip',u.node('decodeOutput').value==='中文 &?');u.node('decodeInput').value='%zz';u.node('btnDecode').handlers.click();check('URL invalid escape',u.node('decodeOutput').value==='');
})().catch(e=>{console.error(e);process.exitCode=1});
