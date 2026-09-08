const fs = require('node:fs');
const path = require('node:path');
const files = [
  ['papaparse/papaparse.min.js','papaparse.min.js'],
  ['js-md5/build/md5.min.js','md5.min.js'],
  ['svgo/dist/svgo.browser.js','svgo.browser.js'],
  ['pica/dist/pica.min.js','pica.min.js'],
  ['gif.js/dist/gif.js','gif.js'],
  ['gif.js/dist/gif.worker.js','gif.worker.js'],
  ['imagetracerjs/imagetracer_v1.2.6.js','imagetracer.js'],
  ['marked/marked.min.js','marked.min.js'],
  ['dompurify/dist/purify.min.js','purify.min.js'],
  ['highlight.js/styles/github.min.css','highlight-light.css'],
  ['highlight.js/styles/github-dark.min.css','highlight-dark.css'],
  ['@ffmpeg/ffmpeg/dist/umd/ffmpeg.js','ffmpeg/ffmpeg.js'],
  ['@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js','ffmpeg/814.ffmpeg.js'],
  ['@ffmpeg/core/dist/umd/ffmpeg-core.js','ffmpeg-core/ffmpeg-core.js'],
  ['@ffmpeg/core/dist/umd/ffmpeg-core.wasm','ffmpeg-core/ffmpeg-core.wasm'],
];
for(const [source,destination] of files) {
  const target=path.join('assets/vendor',destination);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join('node_modules',source),target);
}
for(const name of ['papaparse','js-md5','svgo','pica','@ffmpeg/ffmpeg','@ffmpeg/core','gif.js','imagetracerjs','marked','dompurify','highlight.js']) {
  const dir=path.join('node_modules',name);
  for(const file of fs.readdirSync(dir).filter(x=>/^licen[cs]e/i.test(x))) {
    const target=path.join('assets/vendor/licenses',name.replace('/','-')+'-'+file);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(dir,file),target);
  }
}
require('esbuild').buildSync({stdin:{contents:"window.hljs = require('highlight.js/lib/common');",resolveDir:process.cwd()},bundle:true,minify:true,outfile:'assets/vendor/highlight.min.js'});
