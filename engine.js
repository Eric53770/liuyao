(function(root){
const Z='子丑寅卯辰巳午未申酉戌亥',G='甲乙丙丁戊己庚辛壬癸',E='木火土金水',ZE=[4,2,0,0,2,1,1,2,3,3,2,4],ST=['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養'];
const T={7:['乾',3,'甲壬',[0,2,4,6,8,10]],3:['兌',3,'丁丁',[5,3,1,11,9,7]],5:['離',1,'己己',[3,1,11,9,7,5]],1:['震',0,'庚庚',[0,2,4,6,8,10]],6:['巽',0,'辛辛',[1,11,9,7,5,3]],2:['坎',4,'戊戊',[2,4,6,8,10,0]],4:['艮',2,'丙丙',[4,6,8,10,0,2]],0:['坤',2,'乙癸',[7,5,3,1,11,9]]};
const names={7:['乾為天','天風姤','天山遯','天地否','風地觀','山地剝','火地晉','火天大有'],3:['兌為澤','澤水困','澤地萃','澤山咸','水山蹇','地山謙','雷山小過','雷澤歸妹'],5:['離為火','火山旅','火風鼎','火水未濟','山水蒙','風水渙','天水訟','天火同人'],1:['震為雷','雷地豫','雷水解','雷風恆','地風升','水風井','澤風大過','澤雷隨'],6:['巽為風','風天小畜','風火家人','風雷益','天雷無妄','火雷噬嗑','山雷頤','山風蠱'],2:['坎為水','水澤節','水雷屯','水火既濟','澤火革','雷火豐','地火明夷','地水師'],4:['艮為山','山火賁','山天大畜','山澤損','火澤睽','天澤履','風澤中孚','風山漸'],0:['坤為地','地雷復','地澤臨','地天泰','雷天大壯','澤天夬','水天需','水地比']};
const HEX={};for(const k in T){let base=Number(k)*9;[0,1,3,7,15,31,23,16].forEach((mask,j)=>HEX[base^mask]={name:names[k][j],palace:T[k][0],element:T[k][1],pure:base,shi:[5,0,1,2,3,4,3,2][j],stage:['本宮','一世','二世','三世','四世','五世','遊魂','歸魂'][j]});}
const kin=(p,e)=>['兄弟','子孫','妻財','官鬼','父母'][(e-p+5)%5];
const phase=(e,z)=>ST[(z-[11,2,8,5,8][e]+12)%12];
const generates=(a,b)=>(a+1)%5===b,controls=(a,b)=>(a+2)%5===b,clash=(a,b)=>(a+6)%12===b,combine=(a,b)=>[1,0,11,10,9,8,7,6,5,4,3,2][a]===b;
function lines(bits,p){return Array.from({length:6},(_,i)=>{let t=T[i<3?bits&7:bits>>3],z=t[3][i];return {i,z,e:ZE[z],gan:t[2][i<3?0:1],yang:!!(bits&(1<<i)),kin:kin(p,ZE[z])}})}
function calendar(value,roll){let a=value.match(/\d+/g)?.map(Number);if(!a||a.length<5||a[0]<1900||a[0]>2100)throw Error('請輸入 1900–2100 年間的有效日期與時間。');let solar=Solar.fromYmdHms(a[0],a[1],a[2],a[3],a[4],0),l=solar.getLunar(),day=roll==='23'?l.getDayInGanZhiExact():l.getDayInGanZhiExact2(),d=Z.indexOf(day[1]),g=G.indexOf(day[0]),h=Math.floor((a[3]+1)/2)%12,j=Array.from({length:60},(_,i)=>G[i%10]+Z[i%12]).indexOf(day),empty=[(10-Math.floor(j/10)*2+12)%12,(11-Math.floor(j/10)*2+12)%12];return {year:l.getYearInGanZhiExact(),month:l.getMonthInGanZhiExact(),day,time:G[((g%5)*2+h)%10]+Z[h],d,g,m:Z.indexOf(l.getMonthZhiExact()),empty,...calendarDates(solar,l,a[3],roll)};}
function calendarDates(solar,lunar,hour,roll){
  const shifted=roll==='23'&&hour===23;
  const adopted=shifted?solar.next(1):solar;
  const format=l=>(l.getYearInChinese()+'年 '+l.getMonthInChinese()+'月'+l.getDayInChinese()).replace(/闰/g,'閏').replace(/腊/g,'臘');
  return {lunar:format(lunar),civilDate:solar.toYmd(),adoptedDate:adopted.toYmd(),adoptedLunar:format(adopted.getLunar()),shifted,roll};
}
function plate(values,c,target){let bits=values.reduce((n,v,i)=>n|((v%2)<<i),0),changed=values.reduce((n,v,i)=>n|(((v===6||v===9)?1-v%2:v%2)<<i),0),hex=HEX[bits],to=HEX[changed],rows=lines(bits,hex.element),after=lines(changed,hex.element),pure=lines(hex.pure,hex.element),missing=['兄弟','子孫','妻財','官鬼','父母'].filter(k=>!rows.some(r=>r.kin===k)),start=[0,0,1,1,2,3,4,4,5,5][c.g],body=((rows[hex.shi].yang?0:6)+hex.shi)%12,shen=rows[hex.shi].z%6;
rows.forEach((r,i)=>{r.moving=values[i]===6||values[i]===9;r.after=after[i];r.beast=['青龍','朱雀','勾陳','螣蛇','白虎','玄武'][(start+i)%6];r.tags=[];if(i===hex.shi)r.tags.push('世');if(i===(hex.shi+3)%6)r.tags.push('應');if(i===shen)r.tags.push('世身');if(r.z===body)r.tags.push('卦身');if(i>Math.min(hex.shi,(hex.shi+3)%6)&&i<Math.max(hex.shi,(hex.shi+3)%6))r.tags.push('間爻');if(c.empty.includes(r.z))r.tags.push('旬空');if(clash(r.z,c.m))r.tags.push('月破');if(clash(r.z,c.d))r.tags.push('日沖');if(combine(r.z,c.m))r.tags.push('月合');if(combine(r.z,c.d))r.tags.push('日合');if(phase(r.e,c.m)==='墓')r.tags.push('入月墓');if(phase(r.e,c.d)==='墓')r.tags.push('入日墓');r.fu=missing.includes(pure[i].kin)?pure[i]:null;r.trans=[];if(r.moving){let b=after[i];if(generates(b.e,r.e))r.trans.push('回頭生');if(controls(b.e,r.e))r.trans.push('回頭克');if(clash(b.z,r.z))r.trans.push('回頭沖');if(combine(b.z,r.z))r.trans.push('回頭合');let advances=[[11,0],[2,3],[5,6],[8,9],[1,4],[4,7],[7,10],[10,1]];if(advances.some(([a,x])=>a===r.z&&x===b.z))r.trans.push('進神');if(advances.some(([a,x])=>x===r.z&&a===b.z))r.trans.push('退神');r.trans.push('化'+phase(r.e,b.z));if(c.empty.includes(b.z))r.trans.push('化空');if(clash(b.z,c.m))r.trans.push('化月破');if(clash(b.z,c.d))r.trans.push('化日沖');if(b.z===r.z)r.trans.push('伏吟');}});
return {bits,changed,hex,to,rows,body,shen};}
// Uniform 4-bit draw: 老陰/老陽 each 3/16, 少陽/少陰 each 5/16.
function valueFromDraw(draw){
  if(!Number.isInteger(draw)||draw<0||draw>15)throw Error('抽樣值須介於 0–15');
  return draw<3?6:draw<6?9:draw<11?7:8;
}
function randomCast(){
  const bytes=new Uint8Array(6);
  root.crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>valueFromDraw(b&15));
}
function relation(a,b){if(a===b)return '比和';if(generates(a,b))return '生';if(controls(a,b))return '克';if(generates(b,a))return '受生';return '受克';}
root.LY={randomCast,valueFromDraw,Z,G,E,ZE,ST,T,HEX,kin,phase,lines,calendar,plate,generates,controls,clash,combine,relation};if(typeof module!=='undefined')module.exports=root.LY;
})(typeof window==='undefined'?globalThis:window);
