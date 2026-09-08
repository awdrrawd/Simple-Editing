const fs = require('node:fs');
const path = require('node:path');
const out=path.resolve('_site');
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','LICENSE','README.md','assets','tools']) fs.cpSync(file,path.join(out,file),{recursive:true});
console.log('Static site prepared in _site/');
