const assert=require('node:assert/strict');
const {valueFromDraw,randomCast}=require('../engine.js');
const counts={6:0,7:0,8:0,9:0};
for(let b=0;b<256;b++)counts[valueFromDraw(b&15)]++;
assert.deepEqual(counts,{6:48,7:80,8:80,9:48});
assert.equal((counts[6]+counts[9])/256,3/8);
assert.equal((counts[7]+counts[9])/256,1/2);
const result=randomCast();assert.equal(result.length,6);assert.ok(result.every(v=>[6,7,8,9].includes(v)));
console.log('通過：256 種等機率位元值精確映射至動爻 3/8、陰陽各半；一次產生六爻。');
