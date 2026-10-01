const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.Solar=require('../lunar.js').Solar;
const LY=require('../engine.js'),drawn=[];
let encoding;
const ctx={measureText:t=>({width:Array.from(t).length*12}),fillRect(){},fillText:t=>drawn.push(t),scale(){}};
const canvas={width:0,height:0,getContext:()=>ctx,toBlob(callback,type,quality){encoding={type,quality,width:this.width,height:this.height};callback(new Blob(['image'],{type}));}};
const root={LY};
vm.runInNewContext(fs.readFileSync(require.resolve('../export-image.js'),'utf8'),{window:root,document:{createElement:()=>canvas},Intl,Blob});
(async()=>{
 const c=LY.calendar('2026-10-01T23:30','23'),p=LY.plate([6,7,8,9,7,8],c);
 const data={p,c,when:'2026-10-01T23:30',subject:'測試',title:p.hex.name,meta:'測試',target:'不指定用神',roles:[],structure:[],notes:'第一行備註\n第二行備註'};
 const blob=await root.GuanyaoImage.createJPG(data);
 assert.equal(blob.type,'image/jpeg');assert.equal(encoding.type,'image/jpeg');assert.equal(encoding.quality,.92);
 assert.ok(drawn.includes('盤面備註'));assert.ok(drawn.includes('第一行備註'));assert.ok(drawn.includes('第二行備註'));
 assert.ok(encoding.width*encoding.height<=16000000);assert.ok(encoding.height<=12000);assert.equal(canvas.width,1);
 await assert.rejects(root.GuanyaoImage.createJPG({...data,notes:'太長\n'.repeat(10000)}),/備註過長/);
 console.log('通過：JPG 編碼參數、備註換行繪製、畫布記憶體限制與過長備註錯誤（模擬 Canvas）。');
})();
