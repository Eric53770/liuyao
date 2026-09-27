(function(){
  const {calendar,plate,randomCast,ST,ZE,E,kin,relation}=LY;
  const inputRoot=document.querySelector('#inputs');
  const values=[7,8,7,8,7,8];
  const options=[[6,'老陰'],[7,'少陽'],[8,'少陰'],[9,'老陽']];

  function optionMarkup(selected){return options.map(([value,label])=>`<option value="${value}"${value===selected?' selected':''}>${label}</option>`).join('');}
  function setupInputs(){
    inputRoot.innerHTML=values.map((value,index)=>`<label>${index===0?'初爻':index===5?'上爻':`${['二','三','四','五'][index-1]}爻`}<select data-line="${index}" aria-label="第 ${index+1} 爻">${optionMarkup(value)}</select></label>`).join('');
    inputRoot.addEventListener('change',event=>{if(event.target.matches('select'))values[Number(event.target.dataset.line)]=Number(event.target.value);});
  }
  function calendarMarkup(c){
    const items=[['曆日',c.lunar],['排盤採用日',c.adoptedLunar],['年柱',c.year],['月柱',c.month],['日柱',c.day],['時柱',c.time],['旬空',c.empty.map(z=>Z[z]).join('、')]];
    return `<div class="calendar-grid">${items.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
  }
  function lineMarkup(row){
    const cls=`line ${row.yang?'yang':'yin'}${row.moving?' moving':''}`;
    return `<div class="${cls}"><i></i>${row.yang?'':'<i></i>'}</div>`;
  }
  function rowMarkup(row){
    const tags=row.tags.length?`<div class="tags">${row.tags.join(' · ')}</div>`:'';
    const transformed=row.moving?`${row.after.gan}${Z[row.after.z]} ${row.after.kin}`:'—';
    return `<tr><td class="row-label"><strong>${row.beast}</strong><small>${['初爻','二爻','三爻','四爻','五爻','上爻'][row.i]}</small>${tags}</td><td>${row.fu?`${row.fu.gan}${Z[row.fu.z]}<br>${row.fu.kin}`:'—'}</td><td class="line-cell">${lineMarkup(row)}<small>${row.gan}${Z[row.z]} · ${row.kin}</small></td><td>${ST[LY.phase(row.e,window.currentCalendar.m)]}<br><small>${ST[LY.phase(row.e,window.currentCalendar.d)]}</small></td><td class="line-cell">${row.moving?lineMarkup(row.after):'—'}<small>${transformed}</small></td><td>${row.moving?(row.trans.length?row.trans.join('<br>'):'動'):'—'}</td></tr>`;
  }
  function renderDetails(result){
    const rows=result.rows.slice().reverse();
    document.querySelector('#hex-title').textContent=`${result.hex.name} → ${result.to.name}`;
    document.querySelector('#hex-meta').textContent=`${result.hex.stage} · ${result.hex.palace} ${E[result.hex.element]}宮`;
    document.querySelector('#plate').innerHTML=rows.map(rowMarkup).join('');
    document.querySelector('#roles').innerHTML=rows.map(row=>`<div class="role-row"><span>${row.beast} ${row.kin}</span><strong>${relation(result.hex.element,row.e)}</strong></div>`).join('');
    document.querySelector('#structure').innerHTML=`<p>本卦：${result.hex.stage}</p><p>世爻：${result.rows[result.hex.shi].beast} · 應爻：${result.rows[(result.hex.shi+3)%6].beast}</p><p>世身：${result.rows[result.shen].beast} · 卦身：${Z[result.body]}</p>`;
  }
  function render(){
    const when=document.querySelector('#when').value;
    if(!when){document.querySelector('#error').textContent='請先選擇占卦時間。';return;}
    try{
      const c=calendar(when,document.querySelector('#roll').value);window.currentCalendar=c;
      document.querySelector('#calendar').innerHTML=calendarMarkup(c);
      document.querySelector('#question').textContent=document.querySelector('#subject').value.trim();
      renderDetails(plate(values,c,document.querySelector('#target').value));
      document.querySelector('#error').textContent='';
      document.querySelector('#cast-status').textContent='排盤已更新';
    }catch(error){document.querySelector('#error').textContent=error.message;}
  }
  function setNow(){
    const now=new Date();const pad=value=>String(value).padStart(2,'0');
    document.querySelector('#when').value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  function populateTarget(){
    document.querySelector('#target').innerHTML=['不指定用神','兄弟','子孫','妻財','官鬼','父母'].map(value=>`<option value="${value}">${value}</option>`).join('');
  }
  function populateReference(){
    document.querySelector('#reference').innerHTML=`<thead><tr><th>階段</th>${Z.split('').map(z=>`<th>${z}</th>`).join('')}</tr></thead><tbody>${ST.map((stage,index)=>`<tr><th>${stage}</th>${Z.split('').map((z,zIndex)=>`<td>${ST[(zIndex-index+12)%12]===stage?'●':''}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }
  setupInputs();populateTarget();populateReference();setNow();
  document.querySelector('#now').addEventListener('click',()=>{setNow();render();});
  document.querySelector('#random-cast').addEventListener('click',()=>{randomCast().forEach((value,index)=>values[index]=value);setupInputs();render();});
  document.querySelector('#cast').addEventListener('click',render);
  document.querySelector('#roll').addEventListener('change',render);
  document.querySelector('#target').addEventListener('change',render);
  render();
})();
