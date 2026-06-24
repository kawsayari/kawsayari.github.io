
const DATA_URL='assets/kawsayari-data.json';
const SITE='https://kawsayari.github.io/';
let PACK=null, DICT=[], MAPS=null;

function normalizeText(str){return (str||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\wñáéíóúü'\-\s]/gi,' ').replace(/\s+/g,' ').trim();}
function escapeHtml(s){return (s||'').toString().replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function loadData(){if(!PACK){PACK=await (await fetch(DATA_URL)).json(); DICT=PACK.entries; MAPS=PACK;}}

function hashString(s){let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return Math.abs(h>>>0);}
function seededIndex(max){const d=new Date(); const seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); return seed%max;}
function randomItem(){return DICT[Math.floor(Math.random()*DICT.length)];}

function translatePhrase(raw,direction='es-ka'){
  const tokens=(raw||'').split(/(\s+|[,.!?;:]+)/).filter(t=>t.length);
  let out=[], details=[];
  tokens.forEach(tok=>{
    const clean=normalizeText(tok);
    if(!clean || /^\s+$|^[,.!?;:]+$/.test(tok)){out.push(tok);return;}
    if(direction==='ka-es'){
      const meaning=MAPS.term[clean];
      if(meaning){out.push(meaning.split(';')[0].split('.')[0]); details.push({from:tok,to:meaning});}
      else{out.push('['+tok+']'); details.push({from:tok,to:'sin coincidencia'});}
    }else{
      const candidate=MAPS.manual[clean]||MAPS.manual[tok.toLowerCase()]||MAPS.reverse[clean];
      if(candidate){out.push(candidate); details.push({from:tok,to:candidate});}
      else{out.push('['+tok+']'); details.push({from:tok,to:'sin coincidencia'});}
    }
  });
  return {text:out.join(' ').replace(/\s+([,.!?;:])/g,'$1'), details};
}

function nameToKawsayari(name){
  const clean=(name||'').trim()||'Kawsayari';
  const n=normalizeText(clean);
  const roots=['kawsa','sumaq','yaku','sonqo','llaqta','simi','allpa','inti','mayu','ayllu','rimay','pacha','ñan','mama','tayta','munay','qillqa','sacha'];
  const suffixes=['yari','ri','pacha','simi','sonqo','mayu','wasi','inti','allpa'];
  const h=hashString(n);
  const parts=[
    roots[h%roots.length],
    roots[Math.floor(h/7)%roots.length],
    suffixes[Math.floor(h/13)%suffixes.length]
  ];
  const title=(parts[0]+'-'+parts[1]+'-'+parts[2]).replace(/--/g,'-');
  const meanings=[
    'voz que une memoria y futuro',
    'corazón de territorio vivo',
    'camino propio de comunidad',
    'luz interior con raíz profunda',
    'palabra que cuida casa y mundo',
    'energía que nace del agua y la tierra',
    'identidad que habla desde el sonqo',
    'presencia de barrio, paisaje y afecto',
    'nombre con fuerza de sol y río'
  ];
  const archetypes=['Voz','Agua','Sol','Tierra','Ciudad','Corazón','Camino','Bosque','Memoria'];
  return {name:clean,title,meaning:meanings[h%meanings.length],archetype:archetypes[Math.floor(h/5)%archetypes.length],hash:h};
}

const themes={
  cream:{bg:'#f6f0de',fg:'#042d1f',accent:'#ac4633',soft:'#fffaf0',gold:'#c9953b'},
  green:{bg:'#042d1f',fg:'#f6f0de',accent:'#d67a56',soft:'#073b2a',gold:'#c9953b'},
  red:{bg:'#ac4633',fg:'#f6f0de',accent:'#042d1f',soft:'#bf5a43',gold:'#f2c36b'},
  black:{bg:'#101511',fg:'#f6f0de',accent:'#ac4633',soft:'#171f19',gold:'#c9953b'},
  gold:{bg:'#efe1bd',fg:'#042d1f',accent:'#ac4633',soft:'#fff8e7',gold:'#b8862c'}
};
let currentTheme='cream';
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{currentTheme=b.dataset.theme; document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('active',x===b)); renderAllCards();}));

function wrapLines(ctx,text,maxWidth,maxLines=8){
  const words=(text||'').split(/\s+/); let lines=[], line='';
  words.forEach(w=>{const test=line?line+' '+w:w; if(ctx.measureText(test).width<=maxWidth)line=test; else{if(line)lines.push(line); line=w;}});
  if(line)lines.push(line); if(lines.length>maxLines){lines=lines.slice(0,maxLines); lines[maxLines-1]+='…';} return lines;
}

function drawPersonalSigil(ctx,cx,cy,r,hash,theme){
  const sides=5+(hash%5);
  const layers=3+((hash>>3)%3);
  ctx.save();
  ctx.translate(cx,cy);
  ctx.strokeStyle=theme.fg; ctx.fillStyle=theme.fg;
  ctx.lineWidth=7;
  for(let l=0;l<layers;l++){
    const rr=r-(l*28);
    ctx.beginPath();
    for(let i=0;i<sides;i++){
      const a=(-Math.PI/2)+(Math.PI*2*i/sides)+((hash%31)/100);
      const rad=rr*(i%2?0.82:1);
      const x=Math.cos(a)*rad, y=Math.sin(a)*rad;
      if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }
  const spokes=6+((hash>>5)%7);
  ctx.lineWidth=5;
  for(let i=0;i<spokes;i++){
    const a=Math.PI*2*i/spokes + ((hash>>8)%20)/100;
    const inner=r*.22, outer=r*.92;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
    ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);
    ctx.stroke();
  }
  ctx.fillStyle=theme.accent;
  ctx.beginPath(); ctx.arc(0,0,r*.18,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=theme.accent; ctx.lineWidth=6;
  const rings=1+((hash>>2)%3);
  for(let i=0;i<rings;i++){ctx.beginPath(); ctx.arc(0,0,r*(.34+i*.18),0,Math.PI*2); ctx.stroke();}
  // small moons/dots
  ctx.fillStyle=theme.gold || theme.accent;
  const dots=4+((hash>>7)%6);
  for(let i=0;i<dots;i++){
    const a=Math.PI*2*i/dots;
    ctx.beginPath(); ctx.arc(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1,8+(hash+i)%5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawStory(canvas,opts){
  if(!canvas)return;
  const t=themes[opts.theme||currentTheme]||themes.cream, ctx=canvas.getContext('2d'), W=canvas.width,H=canvas.height;
  ctx.fillStyle=t.bg; ctx.fillRect(0,0,W,H);
  // subtle warm panels
  ctx.fillStyle=t.soft; ctx.globalAlpha=.28; ctx.fillRect(70,70,W-140,H-140); ctx.globalAlpha=1;
  ctx.strokeStyle=t.fg; ctx.lineWidth=26; ctx.strokeRect(46,46,W-92,H-92);
  ctx.strokeStyle=t.fg; ctx.lineWidth=2; ctx.strokeRect(86,86,W-172,H-172);
  ctx.fillStyle=t.fg; ctx.textAlign='center';
  ctx.font='900 46px Arial'; ctx.fillText('KAWSAYARI',W/2,150);
  ctx.strokeStyle=t.fg; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(250,215);ctx.lineTo(480,215);ctx.moveTo(600,215);ctx.lineTo(830,215);ctx.stroke();
  ctx.fillStyle=t.accent; ctx.beginPath(); ctx.arc(W/2,215,15,0,Math.PI*2);ctx.fill();

  ctx.fillStyle=t.fg; ctx.font='900 54px Arial'; ctx.fillText(opts.label||'MI HISTORIA',W/2,330);
  drawPersonalSigil(ctx,W/2,535,120,opts.hash||12345,t);

  ctx.font='900 82px Arial'; ctx.fillStyle=t.fg;
  let mainLines=wrapLines(ctx,opts.main||'Kawsayari',860,4);
  let y=780;
  mainLines.forEach(line=>{ctx.fillText(line.toUpperCase(),W/2,y); y+=92;});

  ctx.fillStyle=t.accent; ctx.fillRect(W/2-80,y-26,160,10); y+=82;
  ctx.font='700 42px Arial'; ctx.fillStyle=t.fg;
  let subLines=wrapLines(ctx,opts.sub||'',820,7);
  subLines.forEach(line=>{ctx.fillText(line,W/2,y); y+=56;});

  if(opts.note){
    y+=20; ctx.font='700 30px Arial'; ctx.fillStyle=t.accent;
    wrapLines(ctx,opts.note,760,2).forEach(line=>{ctx.fillText(line,W/2,y); y+=40;});
  }
  ctx.fillStyle=t.fg; ctx.font='800 34px Arial'; ctx.fillText('kawsayari.github.io',W/2,H-180);
  ctx.fillStyle=t.accent; ctx.font='800 30px Arial'; ctx.fillText('Diccionario · Traductor · Historias',W/2,H-122);
}

function canvasToBlob(canvas){return new Promise(res=>canvas.toBlob(res,'image/png',0.95));}
function downloadCanvas(canvas,filename){const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; a.click();}
async function nativeShareCanvas(canvas,text){
  try{const blob=await canvasToBlob(canvas); const file=new File([blob],'kawsayari-historia.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'Kawsayari',text,files:[file]});}
    else{await navigator.clipboard.writeText(text+' '+SITE); alert('Texto copiado. Descarga la imagen y súbela como historia.');}
  }catch(e){await navigator.clipboard.writeText(text+' '+SITE);}
}
function shareUrl(platform,text,url=SITE){const encoded=encodeURIComponent(text+' '+url); if(platform==='wa')window.open('https://wa.me/?text='+encoded,'_blank'); if(platform==='fb')window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank'); if(platform==='x')window.open('https://twitter.com/intent/tweet?text='+encoded,'_blank');}

function renderName(){
  const input=document.getElementById('nameInput'), out=document.getElementById('nameOutput'), canvas=document.getElementById('nameCanvas');
  if(!input||!out||!canvas)return;
  const n=nameToKawsayari(input.value);
  const text=`${n.name} en Kawsayari: ${n.title} — ${n.meaning}. Arquetipo: ${n.archetype}.`;
  out.textContent=text;
  drawStory(canvas,{theme:currentTheme,label:'MI NOMBRE EN KAWSAYARI',main:n.title,sub:`${n.name} · ${n.meaning}`,note:`Arquetipo ${n.archetype}`,hash:n.hash});
}
function initName(){
  if(!document.getElementById('nameCanvas'))return;
  renderName();
  document.getElementById('nameInput').addEventListener('input',renderName);
  document.getElementById('generateName').addEventListener('click',renderName);
  document.getElementById('randomName').addEventListener('click',()=>{const s=['Mayra','Adrián','Luz','Camila','Renato','Valeria','Diego','Inti','María','Santiago']; document.getElementById('nameInput').value=s[Math.floor(Math.random()*s.length)]; renderName();});
  document.getElementById('downloadName').addEventListener('click',()=>downloadCanvas(document.getElementById('nameCanvas'),'mi-nombre-kawsayari.png'));
  document.getElementById('shareName').addEventListener('click',()=>nativeShareCanvas(document.getElementById('nameCanvas'),document.getElementById('nameOutput').textContent));
  document.getElementById('copyName').addEventListener('click',async()=>navigator.clipboard.writeText(document.getElementById('nameOutput').textContent+' '+SITE+'nombre.html'));
  document.getElementById('waName').addEventListener('click',()=>shareUrl('wa',document.getElementById('nameOutput').textContent,SITE+'nombre.html'));
  document.getElementById('fbName').addEventListener('click',()=>shareUrl('fb',document.getElementById('nameOutput').textContent,SITE+'nombre.html'));
  document.getElementById('xName').addEventListener('click',()=>shareUrl('x',document.getElementById('nameOutput').textContent,SITE+'nombre.html'));
}

function renderStoryFromInputs(){
  const canvas=document.getElementById('storyCanvas'); if(!canvas)return;
  const mode=document.getElementById('storyMode').value, text=(document.getElementById('storyText').value||'Kawsayari').trim();
  let opts={theme:currentTheme,label:'MI HISTORIA',main:text,sub:'Lengua construida peruana de raíz andino-amazónica',hash:hashString(text)};
  if(mode==='nombre'){const n=nameToKawsayari(text); opts={theme:currentTheme,label:'MI NOMBRE EN KAWSAYARI',main:n.title,sub:`${n.name} · ${n.meaning}`,note:`Arquetipo ${n.archetype}`,hash:n.hash};}
  if(mode==='frase'&&MAPS){const tr=translatePhrase(text,'es-ka').text; opts={theme:currentTheme,label:'MI FRASE EN KAWSAYARI',main:tr,sub:text,hash:hashString(text)};}
  if(mode==='palabra'&&DICT.length){const item=DICT[seededIndex(DICT.length)]; opts={theme:currentTheme,label:'PALABRA DEL DÍA',main:item['Término original'],sub:item['Significado'],hash:hashString(item['Término original'])};}
  if(mode==='reto'){opts={theme:currentTheme,label:'RETO KAWSAYARI',main:'ESCRIBE TU PALABRA',sub:'Déjame una palabra y la convierto en Kawsayari',hash:hashString('reto-'+text)};}
  drawStory(canvas,opts); return opts;
}
async function initStories(){
  if(!document.getElementById('storyCanvas'))return; await loadData();
  const render=()=>renderStoryFromInputs(); render();
  ['storyMode','storyText'].forEach(id=>document.getElementById(id).addEventListener('input',render));
  document.getElementById('generateStory').addEventListener('click',render);
  document.getElementById('randomStory').addEventListener('click',()=>{const it=randomItem(); document.getElementById('storyMode').value='palabra'; document.getElementById('storyText').value=it['Término original']; render();});
  document.getElementById('downloadStory').addEventListener('click',()=>downloadCanvas(document.getElementById('storyCanvas'),'kawsayari-historia.png'));
  document.getElementById('nativeShare').addEventListener('click',()=>nativeShareCanvas(document.getElementById('storyCanvas'),'Creé mi historia en Kawsayari.'));
  document.getElementById('copyStory').addEventListener('click',async()=>navigator.clipboard.writeText('Creé mi historia en Kawsayari: '+SITE+'historias.html'));
  document.getElementById('whatsappStory').addEventListener('click',()=>shareUrl('wa','Crea tu historia Kawsayari:',SITE+'historias.html'));
  document.getElementById('facebookStory').addEventListener('click',()=>shareUrl('fb','Crea tu historia Kawsayari:',SITE+'historias.html'));
  document.getElementById('xStory').addEventListener('click',()=>shareUrl('x','Crea tu historia Kawsayari:',SITE+'historias.html'));
}

async function renderPhrase(){
  const input=document.getElementById('phraseInput'), out=document.getElementById('phraseOutput'), canvas=document.getElementById('phraseCanvas');
  if(!input||!out||!canvas)return; await loadData();
  const original=input.value.trim(); const tr=translatePhrase(original,'es-ka').text; const text=`${original} → ${tr}`;
  out.textContent=text; drawStory(canvas,{theme:currentTheme,label:'MI FRASE EN KAWSAYARI',main:tr,sub:original,hash:hashString(original)});
}
function renderWall(){const wall=document.getElementById('phraseWall'); if(!wall)return; const items=JSON.parse(localStorage.getItem('kawsayariWall')||'[]'); wall.innerHTML=items.map(x=>`<div class="card"><p>${escapeHtml(x)}</p></div>`).join('');}
async function initPhrase(){
  if(!document.getElementById('phraseCanvas'))return; await renderPhrase(); renderWall();
  document.getElementById('phraseInput').addEventListener('input',renderPhrase);
  document.getElementById('generatePhrase').addEventListener('click',renderPhrase);
  document.getElementById('savePhrase').addEventListener('click',()=>{const arr=JSON.parse(localStorage.getItem('kawsayariWall')||'[]'); arr.unshift(document.getElementById('phraseOutput').textContent); localStorage.setItem('kawsayariWall',JSON.stringify(arr.slice(0,12))); renderWall();});
  document.getElementById('downloadPhrase').addEventListener('click',()=>downloadCanvas(document.getElementById('phraseCanvas'),'frase-kawsayari.png'));
  document.getElementById('sharePhrase').addEventListener('click',()=>nativeShareCanvas(document.getElementById('phraseCanvas'),document.getElementById('phraseOutput').textContent));
  document.getElementById('copyPhrase').addEventListener('click',async()=>navigator.clipboard.writeText(document.getElementById('phraseOutput').textContent+' '+SITE+'frases.html'));
  document.getElementById('waPhrase').addEventListener('click',()=>shareUrl('wa',document.getElementById('phraseOutput').textContent,SITE+'frases.html'));
  document.getElementById('fbPhrase').addEventListener('click',()=>shareUrl('fb',document.getElementById('phraseOutput').textContent,SITE+'frases.html'));
  document.getElementById('xPhrase').addEventListener('click',()=>shareUrl('x',document.getElementById('phraseOutput').textContent,SITE+'frases.html'));
}

async function initTranslator(){
  const input=document.getElementById('translatorInput'); if(!input)return; await loadData();
  const output=document.getElementById('translatorOutput'), tokenBox=document.getElementById('translatorTokens'), direction=document.getElementById('direction');
  function run(){const res=translatePhrase(input.value,direction.value); output.textContent=res.text; tokenBox.innerHTML=res.details.map(x=>`<span class="token">${escapeHtml(x.from)} <b>→</b> ${escapeHtml(x.to)}</span>`).join('');}
  run(); input.addEventListener('input',run); direction.addEventListener('change',run);
  document.getElementById('translateBtn').addEventListener('click',run);
  document.getElementById('clearBtn').addEventListener('click',()=>{input.value='';run();});
  document.getElementById('copyBtn').addEventListener('click',async()=>{const t=output.textContent||''; if(t)await navigator.clipboard.writeText(t);});
}
function initDictionarySearch(){
  const input=document.getElementById('searchInput'); if(!input)return;
  const rows=Array.from(document.querySelectorAll('tbody tr')), count=document.getElementById('resultCount'), cats=Array.from(document.querySelectorAll('.dict-category'));
  function filter(){const q=input.value.trim().toLowerCase(); let visible=0; rows.forEach(row=>{const ok=!q||row.dataset.search.includes(q); row.style.display=ok?'':'none'; if(ok)visible++;}); cats.forEach(sec=>{const has=Array.from(sec.querySelectorAll('tbody tr')).some(r=>r.style.display!=='none'); sec.style.display=has?'':'none';}); count.textContent=visible;}
  input.addEventListener('input',filter);
}
async function initLearning(){
  const word=document.getElementById('flashWord'); if(!word)return; await loadData();
  const category=document.getElementById('flashCategory'), meaning=document.getElementById('flashMeaning'), card=document.getElementById('flashCard'), daily=document.getElementById('dailyWord');
  let current=null; function setCard(item){current=item; word.textContent=item['Término original']; meaning.textContent=item['Significado']; category.textContent=item['Categoría']; card.classList.remove('show');}
  setCard(DICT[seededIndex(DICT.length)]);
  if(daily){const item=DICT[seededIndex(DICT.length)]; daily.innerHTML=`<h3>${escapeHtml(item['Término original'])}</h3><p>${escapeHtml(item['Significado'])}</p>`;}
  document.getElementById('newCard').addEventListener('click',()=>setCard(randomItem()));
  document.getElementById('showMeaning').addEventListener('click',()=>card.classList.toggle('show'));
  document.getElementById('copyCard').addEventListener('click',async()=>{if(current)await navigator.clipboard.writeText(`${current['Término original']} — ${current['Significado']}`);});
}
async function initAssistant(){
  const log=document.getElementById('assistantLog'); if(!log)return; await loadData();
  const input=document.getElementById('assistantInput');
  function add(cls,text){const div=document.createElement('div'); div.className='bubble '+cls; div.innerHTML=text; log.appendChild(div); log.scrollTop=log.scrollHeight;}
  function answer(q){
    const nq=normalizeText(q); if(!nq)return 'Escribe una palabra, frase o nombre.';
    if(nq.includes('palabra del dia')||nq.includes('palabra del día')){const it=DICT[seededIndex(DICT.length)]; return `<strong>${escapeHtml(it['Término original'])}</strong><br>${escapeHtml(it['Significado'])}`;}
    if(nq.includes('historia')) return `Puedes generar una tarjeta vertical lista para historia aquí:<br><a href="historias.html">Crear historia Kawsayari</a>`;
    if(nq.includes('nombre')) return `Prueba el generador de símbolo personal aquí:<br><a href="nombre.html">Mi nombre en Kawsayari</a>`;
    if(nq.startsWith('traduce')||nq.includes('traducir')){const phrase=q.replace(/traduce|traducir/gi,'').trim(); return `<strong>${escapeHtml(translatePhrase(phrase,'es-ka').text)}</strong><br><a href="traductor.html">Abrir traductor</a>`;}
    const term=DICT.find(x=>normalizeText(x['Término original'])===nq); if(term)return `<strong>${escapeHtml(term['Término original'])}</strong><br>${escapeHtml(term['Significado'])}`;
    const tr=translatePhrase(q,'es-ka').text; return `Puedo convertirlo como:<br><strong>${escapeHtml(tr)}</strong><br><a href="historias.html">Crear tarjeta compartible</a>`;
  }
  add('bot','Soy el Asistente Kawsayari. Puedo traducir, buscar significados y ayudarte a crear tarjetas para historias.');
  function send(){const q=input.value.trim(); if(!q)return; add('user',escapeHtml(q)); add('bot',answer(q)); input.value='';}
  document.getElementById('assistantSend').addEventListener('click',send); input.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
  document.querySelectorAll('.quickAsk').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.q;send();}));
}
function renderAllCards(){if(document.getElementById('nameCanvas'))renderName(); if(document.getElementById('storyCanvas'))renderStoryFromInputs(); if(document.getElementById('phraseCanvas'))renderPhrase();}
async function boot(){await loadData(); initDictionarySearch(); initTranslator(); initStories(); initName(); initPhrase(); initLearning(); initAssistant();}
boot();
