const assert=require('node:assert/strict');
global.Solar=require('../lunar.js').Solar;
const {calendar,plate}=require('../engine.js');
for(const date of ['2026-09-27','2026-02-16','2026-12-31','2025-07-24','2025-08-22']){
 const day=Solar.fromYmd(...date.split('-').map(Number));
 const next=day.next(1).toYmd();
 const before=calendar(date+'T22:59','23');
 const late=calendar(date+'T23:00','23');
 const end=calendar(date+'T23:59','23');
 const midnight=calendar(next+'T00:00','23');
 const civilLate=calendar(date+'T23:00','00');
 assert.equal(before.shifted,false);assert.equal(late.shifted,true);assert.equal(midnight.shifted,false);
 assert.equal(late.lunar,before.lunar);assert.equal(late.adoptedLunar,midnight.lunar);
 assert.equal(late.adoptedDate,next);assert.equal(civilLate.adoptedDate,date);
 assert.equal(late.day,midnight.day);assert.equal(late.time,midnight.time);assert.equal(end.day,late.day);
 assert.deepEqual(late.empty,midnight.empty);assert.equal(civilLate.day,before.day);
 assert.deepEqual(plate([7,8,7,8,7,8],late).rows.map(r=>r.beast),plate([7,8,7,8,7,8],midnight).rows.map(r=>r.beast));
 assert.equal(late.year,civilLate.year);assert.equal(late.month,civilLate.month);
}
const leap=calendar('2025-07-25T00:00','00');assert.ok(leap.lunar.includes('閏'));
console.log('通過：22:59／23:00／23:59／00:00，兩種換日規則、農曆年／月／閏月交界、旬空與六獸同步。');
