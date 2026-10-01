(function(root){
  'use strict';
  const WIDTH=1200, MARGIN=40;
  const FONT='system-ui, -apple-system, "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const C={ink:'#192b32',muted:'#63767d',teal:'#176b68',red:'#b44736',line:'#dce3e6',paper:'#f1f4f5'};
  const ELEMENTS=['#2f8f4e','#c33d2e','#b9782f','#9b7912','#2879b9'];
  const POS=['初爻','二爻','三爻','四爻','五爻','上爻'];
  const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh-Hant',{granularity:'grapheme'}):null;

  // Measure and draw with the same layout so long questions and tags never crop.
  function painter(ctx,draw){
    function font(size,weight=400){ctx.font=`${weight} ${size}px ${FONT}`;ctx.textBaseline='top';}
    function wrap(value,width){
      const lines=[];
      for(const paragraph of String(value).split('\n')){
        let line='';
        const chars=segmenter?Array.from(segmenter.segment(paragraph),s=>s.segment):Array.from(paragraph);
        for(const char of chars){
          if(line&&ctx.measureText(line+char).width>width){lines.push(line);line=char;}
          else line+=char;
        }
        lines.push(line);
      }
      return lines;
    }
    function text(value,x,y,width,{size=18,color=C.ink,weight=400,lineHeight=Math.ceil(size*1.6)}={}){
      font(size,weight);
      const lines=wrap(value,width);
      if(draw){ctx.fillStyle=color;lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));}
      return y+lines.length*lineHeight;
    }
    function box(x,y,w,h,color){if(draw){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}}
    function rule(x,y,w){box(x,y,w,1,C.line);}
    function glyph(yang,moving,x,y){
      const color=moving?C.red:C.ink;
      if(yang)box(x,y,50,7,color);
      else{box(x,y,21,7,color);box(x+29,y,21,7,color);}
    }
    function tags(items,x,y,width){
      if(!items.length)return y;
      let left=x,top=y;
      for(const item of items){
        font(15);
        const w=Math.ceil(ctx.measureText(item).width)+16;
        if(left>x&&left+w>x+width){left=x;top+=31;}
        const key=['世','應'].includes(item),warn=/空|破|墓/.test(item);
        box(left,top,w,26,key?C.teal:warn?'#fcf1ed':'#f1f4f5');
        text(item,left+8,top+1,w-16,{size:15,color:key?'#fff':warn?C.red:C.ink,lineHeight:24});
        left+=w+5;
      }
      return top+26;
    }
    function desc(row,x,y,width,size=19){
      const {Z,E}=root.LY;
      const label=`${row.kin} ${Z[row.z]}`;
      const end=text(label,x,y,width,{size,weight:600});
      font(size,600);
      text(E[row.e],x+ctx.measureText(label).width,y,size+2,{size,weight:600,color:ELEMENTS[row.e]});
      return end;
    }
    return {text,box,rule,glyph,tags,desc};
  }

  function report(ctx,data,draw){
    const a=painter(ctx,draw),measure=painter(ctx,false);
    const {p,c}=data,{Z,E,phase}=root.LY;
    const w=WIDTH-2*MARGIN,x=MARGIN;
    let y=36;
    a.box(x,y+3,44,44,C.teal);
    a.text('爻',x+8,y+4,34,{size:28,color:'#fff'});
    a.text('觀爻 · 六爻排盤',x+60,y,w-60,{size:29,weight:600});
    y+=62;
    a.rule(x,y,w);y+=22;
    y=a.text(`占卦時間  ${data.when.replace('T',' ')}  ·  台灣 UTC+8`,x,y,w,{size:17,color:C.muted})+20;

    function calendarBlock(q,top){
      const start=top;
      [['年柱',c.year],['月柱',c.month],['日柱',c.day],['時柱',c.time]].forEach(([label,value],i)=>{
        const left=x+24+i*(w-48)/4;
        q.text(label,left,top+18,230,{size:15,color:'#b5c8cc'});
        q.text(value,left,top+46,230,{size:31,color:'#fff',weight:600});
      });
      top+=106;
      top=q.text(`曆日農曆 ${c.lunar}　｜　國曆 ${c.civilDate}`,x+24,top,w-48,{size:17,color:'#e2eded'})+5;
      top=q.text(`旬空 ${c.empty.map(z=>Z[z]).join('、')}　｜　月建 ${Z[c.m]} · 日辰 ${Z[c.d]}`,x+24,top,w-48,{size:17,color:'#e2eded'})+12;
      q.box(x+24,top,w-48,1,'#466167');top+=12;
      top=q.text(c.roll==='23'?'子初 23:00 換日':'午夜 00:00 換日',x+24,top,w-48,{size:17,color:'#fff',weight:600});
      top=q.text(c.shifted?`已採次日排盤：${c.adoptedDate}（農曆 ${c.adoptedLunar}）`:'排盤採用日與曆日相同',x+24,top,w-48,{size:16,color:'#e2eded'});
      top=q.text('曆日農曆固定於午夜換日；日柱、時干、旬空與六獸依所選換日規則。年柱、月柱按實際節氣交接。',x+24,top+6,w-48,{size:15,color:'#b5c8cc'});
      return Math.max(start+240,top+20);
    }
    const calendarEnd=calendarBlock(measure,y);
    a.box(x,y,w,calendarEnd-y,'#20373d');calendarBlock(a,y);y=calendarEnd+24;

    const headingTop=y;
    function heading(q,top){
      top=q.text(data.title,x+24,top+20,w-48,{size:30,weight:600})+6;
      top=q.text(data.meta,x+24,top,w-48,{size:17,color:C.muted})+5;
      return q.text('土寄水宮 · 本卦由上爻至初爻顯示',x+24,top,w-48,{size:15,color:C.teal})+18;
    }
    y=heading(measure,y);a.box(x,headingTop,w,y-headingTop,'#fff');heading(a,headingTop);
    const columns=[105,165,250,135,250,215];
    const lefts=columns.map((_,i)=>x+columns.slice(0,i).reduce((sum,v)=>sum+v,0));
    a.box(x,y,w,48,'#e8eeef');
    ['爻位／六獸','伏神','本卦 · 納甲六親','月／日長生','變卦 · 納甲六親','動變標注'].forEach((label,i)=>{
      a.text(label,lefts[i]+12,y+11,columns[i]-24,{size:15,color:C.muted});
    });
    y+=48;
    function row(q,r,top){
      const inner=top+17;
      q.text(POS[r.i],lefts[0]+12,inner,columns[0]-24,{size:16,color:C.muted});
      q.text(r.beast,lefts[0]+12,inner+28,columns[0]-24,{size:22});
      let hiddenEnd=inner;
      if(r.fu){
        hiddenEnd=q.desc(r.fu,lefts[1]+12,inner,columns[1]-24,18)+4;
        hiddenEnd=q.text(`月 ${phase(r.fu.e,c.m)}／日 ${phase(r.fu.e,c.d)}`,lefts[1]+12,hiddenEnd,columns[1]-24,{size:15,color:C.muted});
      }else q.text('—',lefts[1]+12,inner,columns[1]-24,{color:C.muted});
      q.glyph(r.yang,r.moving,lefts[2]+12,inner+12);
      q.desc(r,lefts[2]+72,inner,columns[2]-84);
      const originalEnd=q.tags(r.tags,lefts[2]+12,inner+38,columns[2]-24);
      q.text(`月 ${phase(r.e,c.m)}\n日 ${phase(r.e,c.d)}`,lefts[3]+12,inner,columns[3]-24,{size:18});
      let changedEnd=inner;
      if(p.bits!==p.changed){
        q.glyph(r.after.yang,false,lefts[4]+12,inner+12);
        q.desc(r.after,lefts[4]+72,inner,columns[4]-84);
        changedEnd=q.text(`月 ${phase(r.after.e,c.m)}／日 ${phase(r.after.e,c.d)}`,lefts[4]+12,inner+38,columns[4]-24,{size:15,color:C.muted});
        if(!r.moving)changedEnd=q.text('非動爻',lefts[4]+12,changedEnd,columns[4]-24,{size:15,color:C.muted});
      }else q.text('—',lefts[4]+12,inner,columns[4]-24,{color:C.muted});
      const transformEnd=r.trans.length?q.tags(r.trans,lefts[5]+12,inner,columns[5]-24):q.text('—',lefts[5]+12,inner,columns[5]-24,{color:C.muted});
      return Math.max(top+112,hiddenEnd+18,originalEnd+18,changedEnd+18,transformEnd+18);
    }
    for(const r of [...p.rows].reverse()){
      const end=row(measure,r,y);
      a.box(x,y,w,end-y,'#fff');
      if(r.moving)a.box(lefts[4],y,columns[4],end-y,'#fcf1ed');
      row(a,r,y);a.rule(x,end,w);y=end;
    }
    a.box(x,y,w,48,'#fff');
    a.box(x+24,y+22,8,8,C.red);
    a.text('動爻',x+40,y+12,100,{size:15,color:C.muted});
    a.tags(['世','應'],x+132,y+9,100);
    a.text('世爻／應爻',x+220,y+12,240,{size:15,color:C.muted});
    y+=72;

    const gap=20,panelWidth=(w-gap)/2,lowerTop=y;
    function roles(q,left,top){
      const innerWidth=panelWidth-44;
      top=q.text('用神關係標注',left+22,top+20,innerWidth,{size:22,weight:600})+9;
      top=q.text(data.target,left+22,top,innerWidth,{size:16,color:C.teal})+12;
      if(!data.roles.length){
        top=q.text('尚未指定用神。可在排盤中選擇本卦爻或伏神後，再匯出圖片。',left+22,top,innerWidth,{size:17,color:C.muted})+12;
      }
      for(const role of data.roles){
        top=q.text(role.label,left+22,top,innerWidth,{size:18,weight:600});
        top=q.text(role.detail,left+22,top,innerWidth,{size:17,color:C.muted})+10;
        q.rule(left+22,top,innerWidth);top+=12;
      }
      return q.text('只依五行標出用、原、忌、仇，不判力量與有效性。',left+22,top,innerWidth,{size:15,color:C.muted})+22;
    }
    function structure(q,left,top){
      const innerWidth=panelWidth-44;
      top=q.text('結構與飛伏',left+22,top+20,innerWidth,{size:22,weight:600})+12;
      for(const item of data.structure){
        top=q.text(item.title,left+22,top,innerWidth,{size:18});
        if(item.detail)top=q.text(item.detail,left+22,top,innerWidth,{size:16,color:C.muted});
        top+=10;q.rule(left+22,top,innerWidth);top+=12;
      }
      return top+10;
    }
    y=Math.max(roles(measure,x,lowerTop),structure(measure,x+panelWidth+gap,lowerTop));
    a.box(x,lowerTop,panelWidth,y-lowerTop,'#fff');
    a.box(x+panelWidth+gap,lowerTop,panelWidth,y-lowerTop,'#fff');
    roles(a,x,lowerTop);structure(a,x+panelWidth+gap,lowerTop);
    if(data.notes){
      y+=24;
      const noteTop=y;
      let noteEnd=measure.text('盤面備註',x+24,y+20,w-48,{size:22,weight:600})+12;
      noteEnd=measure.text(data.notes,x+24,noteEnd,w-48,{size:20,lineHeight:32})+24;
      a.box(x,noteTop,w,noteEnd-noteTop,'#fff');
      const textTop=a.text('盤面備註',x+24,noteTop+20,w-48,{size:22,weight:600})+12;
      a.text(data.notes,x+24,textTop,w-48,{size:20,lineHeight:32});
      y=noteEnd;
    }
    return Math.ceil(y+MARGIN);
  }

  async function createImage(data,type='image/jpeg'){
    if(document.fonts)await document.fonts.ready;
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(!ctx)throw Error('此瀏覽器無法產生圖片，請改用較新的瀏覽器。');
    const height=report(ctx,data,false);
    // Bound memory and canvas dimensions without silently clipping notes.
    const scale=Math.min(2,12000/height,Math.sqrt(16000000/(WIDTH*height)));
    if(scale<0.8)throw Error('備註過長，無法完整放入一張清晰圖片。請縮短備註後再試。');
    canvas.width=WIDTH*scale;canvas.height=height*scale;
    ctx.scale(scale,scale);
    ctx.fillStyle=C.paper;ctx.fillRect(0,0,WIDTH,height);
    report(ctx,data,true);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>{
      // Release the large backing buffer after encoding, especially on phones.
      canvas.width=canvas.height=1;
      if(blob)resolve(blob);else reject(Error('圖片產生失敗，請再試一次。'));
    },type,0.92));
  }

  root.GuanyaoImage={createPNG:data=>createImage(data,'image/png'),createJPG:data=>createImage(data,'image/jpeg')};
})(window);
