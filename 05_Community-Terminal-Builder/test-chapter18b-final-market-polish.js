const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

for(const p of ['01_Landing-Page/public/index.html','02_Whale-Activity-Tracker/public/index.html','04_Meme-Intel/public/index.html']){
  const html=read(p);
  const updated=html.indexOf('class="market-line market-updated-line"');
  const contract=html.indexOf('class="market-line contract-address-line"');
  assert(updated>=0,`${p}: Updated row missing`);
  assert(contract>=0,`${p}: Contract row missing`);
  assert(updated<contract,`${p}: Updated must appear before CA row; generated project links follow CA`);
}

for(const p of ['01_Landing-Page/public/style.css','02_Whale-Activity-Tracker/public/style.css','04_Meme-Intel/public/style.css']){
  const css=read(p);
  assert(css.includes('market-updated-line .market-value') && css.includes('var(--green)'),`${p}: Updated green styling missing`);
}
for(const p of ['01_Landing-Page/public/style.css','02_Whale-Activity-Tracker/public/style.css','04_Meme-Intel/public/style.css']){
  const css=read(p);
  assert(css.includes('contract-value-wrap .contract-value{display:inline!important'),`${p}: mobile inline CA value override missing`);
  assert(css.includes('contract-value-wrap .copy-contract{display:inline-block!important'),`${p}: mobile inline copy control override missing`);
}
console.log('Chapter 18B final market/mobile polish regression checks passed.');
