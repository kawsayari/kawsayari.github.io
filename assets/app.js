
const DATA_URL='assets/diccionario.json';
const MAP_URL='assets/traductor-map.json';
let DICT=[], MAPS=null;
const SITE='https://kawsayari.github.io/';

function normalizeText(str){return (str||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\wñáéíóúü'\-\s]/gi,' ').replace(/\s+/g,' ').trim();}
function escapeHtml(s){return (s||'').toString().replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function loadData(){if(!DICT.length){DICT=await (await fetch(DATA_URL)).json();} if(!MAPS){MAPS=await (await fetch(MAP_URL)).json();}}

function seededIndex(max){const d=new Date(); const seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); return seed%max;}
function randomItem(){return DICT[Math.floor(Math.random()*DICT.length)];}

function translatePhrase(raw, direction='es-ka'){
  const direct={}; DICT.forEach(item=>direct[normalizeText(item['Término original'])]=item['Significado']);
  const tokens=(raw||'').split(/(\s+|[,.!?;:]+)/).filter(t=>t.length);
  let out=[], details=[];
  tokens.forEach(tok=>{
    const clean=normalizeText(tok);
    if(!clean || /^\s+$|^[,.!?;:]+$/.test(tok)){out.push(tok);return;}
    if(direction==='ka-es'){
      const meaning=direct[clean];
      if(meaning){out.push(meaning.split(';')[0].split('.')[0]); details.push({from:tok,to:meaning});}
      else{out.push('['+tok+']'); details.push({from:tok,to:'sin coincidencia'});}
    }else{
      const candidate=MAPS.manual[clean]||MAPS.reverse[clean];
      if(candidate){out.push(candidate); details.push({from:tok,to:candidate});}
      else{out.push('['+tok+']'); details.push({from:tok,to:'sin coincidencia'});}
    }
  });
  return {text:out.join(' ').replace(/\s+([,.!?;:])/g,'$1'), details};
}

function initDictionarySearch(){
  const input=document.getElementById('searchInput'); if(!input)return;
  const rows=Array.from(document.querySelectorAll('tbody tr'));
  const count=document.getElementById('resultCount');
  const categories=Array.from(document.querySelectorAll('.dict-category'));
  function filterRows(){
    const q=input.value.trim().toLowerCase(); let visible=0;
    rows.forEach(row=>{const ok=!q||row.dataset.search.includes(q); row.style.display=ok?'':'none'; if(ok)visible++;});
    categories.forEach(sec=>{const has=Array.from(sec.querySelectorAll('tbody tr')).some(r=>r.style.display!=='none'); sec.style.display=has?'':'none';});
    if(count)count.textContent=visible;
  }
  input.addEventListener('input',filterRows);
}

async function initTranslator(){
  const input=document.getElementById('translatorInput'); if(!input)return;
  await loadData();
  const output=document.getElementById('translatorOutput'), tokenBox=document.getElementById('translatorTokens'), direction=document.getElementById('direction');
  function run(){
    const res=translatePhrase(input.value,direction.value);
    output.textContent=res.text;
    tokenBox.innerHTML=res.details.map(x=>`<span class="token">${escapeHtml(x.from)} <b>→</b> ${escapeHtml(x.to)}</span>`).join('');
  }
  run();
  input.addEventListener('input',run); direction.addEventListener('change',run);
  document.getElementById('translateBtn')?.addEventListener('click',run);
  document.getElementById('clearBtn')?.addEventListener('click',()=>{input.value='';run();});
  document.getElementById('copyBtn')?.addEventListener('click',async()=>{const t=output.textContent||''; if(t)await navigator.clipboard.writeText(t);});
}

function nameToKawsayari(name){
  const clean=(name||'').trim();
  if(!clean)return {name:'Kawsayari', title:'Kawsa-yari', meaning:'voz viva con identidad propia'};
  const n=normalizeText(clean);
  const roots=['kawsa','sumaq','yaku','sonqo','llaqta','simi','allpa','inti','mayu','ayllu','rimay','pacha'];
  let score=0; for(const ch of n)score+=ch.charCodeAt(0);
  const r1=roots[score%roots.length], r2=roots[(score+n.length*3)%roots.length];
  const suffix=['-yari','-ri','-pacha','-simi','-sonqo'][score%5];
  const title=(r1+'-'+r2+suffix).replace('--','-');
  const meanings=[
    'voz de vida y territorio','corazón que habla con identidad','camino propio de comunidad',
    'palabra viva de raíz andino-amazónica','energía que une memoria y futuro','nombre con fuerza de casa, barrio y paisaje'
  ];
  return {name:clean, title, meaning:meanings[score%meanings.length]};
}

const themes={
  cream:{bg:'#f6f0de', fg:'#042d1f', accent:'#ac4633', paper:'#fffaf0'},
  green:{bg:'#042d1f', fg:'#f6f0de', accent:'#d67a56', paper:'#073b2a'},
  red:{bg:'#ac4633', fg:'#f6f0de', accent:'#042d1f', paper:'#bf5a43'},
  black:{bg:'#101511', fg:'#f6f0de', accent:'#ac4633', paper:'#171f19'}
};
let currentTheme='cream';
function setTheme(theme){currentTheme=theme; document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));}
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{setTheme(b.dataset.theme); renderAllCards();}));

function wrapLines(ctx,text,maxWidth,maxLines=8){
  const words=(text||'').split(/\s+/); let lines=[], line='';
  words.forEach(w=>{const test=line?line+' '+w:w; if(ctx.measureText(test).width<=maxWidth)line=test; else{if(line)lines.push(line); line=w;}});
  if(line)lines.push(line);
  if(lines.length>maxLines){lines=lines.slice(0,maxLines); lines[maxLines-1]+='…';}
  return lines;
}
function drawStory(canvas, opts){
  if(!canvas)return;
  const t=themes[opts.theme||currentTheme]||themes.cream, ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
  ctx.fillStyle=t.bg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=t.fg; ctx.lineWidth=28; ctx.strokeRect(34,34,W-68,H-68);
  ctx.fillStyle=t.fg; ctx.textAlign='center';
  ctx.font='900 46px Arial'; ctx.fillText('KAWSAYARI',W/2,140);
  ctx.strokeStyle=t.fg; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(250,205);ctx.lineTo(480,205);ctx.moveTo(600,205);ctx.lineTo(830,205);ctx.stroke();
  ctx.fillStyle=t.accent; ctx.beginPath(); ctx.arc(W/2,205,15,0,Math.PI*2); ctx.fill();

  ctx.fillStyle=t.fg; ctx.font='900 62px Arial'; ctx.fillText(opts.label||'MI HISTORIA',W/2,330);

  // emblem
  ctx.strokeStyle=t.fg; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(W/2,500,120,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle=t.fg; ctx.beginPath(); ctx.arc(W/2,500,36,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=t.accent; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(W/2-150,500);ctx.lineTo(W/2-60,500);ctx.moveTo(W/2+60,500);ctx.lineTo(W/2+150,500);ctx.stroke();

  ctx.fillStyle=t.fg;
  ctx.font='900 94px Arial';
  let mainLines=wrapLines(ctx,opts.main||'Kawsayari',860,4);
  let y=760;
  mainLines.forEach(line=>{ctx.fillText(line.toUpperCase(),W/2,y); y+=100;});

  ctx.fillStyle=t.accent; ctx.fillRect(W/2-70,y-24,140,10);
  y+=80;

  ctx.fillStyle=t.fg; ctx.font='700 44px Arial';
  let subLines=wrapLines(ctx,opts.sub||'',820,6);
  subLines.forEach(line=>{ctx.fillText(line,W/2,y); y+=58;});

  ctx.fillStyle=t.fg; ctx.font='700 34px Arial';
  ctx.fillText('kawsayari.github.io',W/2,H-170);
  ctx.fillStyle=t.accent; ctx.font='800 30px Arial';
  ctx.fillText('Diccionario · Traductor · Historias',W/2,H-115);
}
function canvasToBlob(canvas){return new Promise(res=>canvas.toBlob(res,'image/png',0.95));}
async function downloadCanvas(canvas,filename){
  const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; a.click();
}
async function nativeShareCanvas(canvas,text){
  try{
    const blob=await canvasToBlob(canvas);
    const file=new File([blob],'kawsayari-historia.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({title:'Kawsayari',text,files:[file]});
    }else{
      await navigator.clipboard.writeText(text+' '+SITE);
      alert('Texto copiado. Descarga la imagen y súbela a tu historia.');
    }
  }catch(e){await navigator.clipboard.writeText(text+' '+SITE);}
}
function shareUrl(platform,text,url=SITE){
  const encoded=encodeURIComponent(text+' '+url);
  if(platform==='wa') window.open('https://wa.me/?text='+encoded,'_blank');
  if(platform==='fb') window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank');
  if(platform==='x') window.open('https://twitter.com/intent/tweet?text='+encoded,'_blank');
}

function renderStoryFromInputs(){
  const canvas=document.getElementById('storyCanvas'); if(!canvas)return;
  const mode=document.getElementById('storyMode').value;
  const text=document.getElementById('storyText').value.trim()||'Kawsayari';
  let opts={theme:currentTheme,label:'MI HISTORIA',main:text,sub:'Lengua construida peruana de raíz andino-amazónica'};
  if(mode==='nombre'){const n=nameToKawsayari(text); opts={theme:currentTheme,label:'MI NOMBRE EN KAWSAYARI',main:n.title,sub:n.name+' · '+n.meaning};}
  if(mode==='frase' && MAPS){const tr=translatePhrase(text,'es-ka').text; opts={theme:currentTheme,label:'MI FRASE EN KAWSAYARI',main:tr,sub:text};}
  if(mode==='palabra' && DICT.length){const item=DICT[seededIndex(DICT.length)]; opts={theme:currentTheme,label:'PALABRA DEL DÍA',main:item['Término original'],sub:item['Significado']};}
  if(mode==='reto'){opts={theme:currentTheme,label:'RETO KAWSAYARI',main:'ESCRIBE TU PALABRA',sub:'Déjame una palabra y la convierto a Kawsayari'};}
  drawStory(canvas,opts);
  return opts;
}
async function initStories(){
  if(!document.getElementById('storyCanvas'))return;
  await loadData();
  const render=()=>renderStoryFromInputs();
  render();
  ['storyMode','storyText'].forEach(id=>document.getElementById(id)?.addEventListener('input',render));
  document.getElementById('generateStory')?.addEventListener('click',render);
  document.getElementById('randomStory')?.addEventListener('click',()=>{const item=randomItem(); document.getElementById('storyMode').value='palabra'; document.getElementById('storyText').value=item['Término original']; render();});
  document.getElementById('downloadStory')?.addEventListener('click',()=>downloadCanvas(document.getElementById('storyCanvas'),'kawsayari-historia.png'));
  document.getElementById('nativeShare')?.addEventListener('click',()=>nativeShareCanvas(document.getElementById('storyCanvas'),'Creé mi historia en Kawsayari.'));
  document.getElementById('copyStory')?.addEventListener('click',async()=>navigator.clipboard.writeText('Creé mi historia en Kawsayari: '+SITE+'historias.html'));
  document.getElementById('whatsappStory')?.addEventListener('click',()=>shareUrl('wa','Crea tu historia Kawsayari:',SITE+'historias.html'));
  document.getElementById('facebookStory')?.addEventListener('click',()=>shareUrl('fb','Crea tu historia Kawsayari:',SITE+'historias.html'));
  document.getElementById('xStory')?.addEventListener('click',()=>shareUrl('x','Crea tu historia Kawsayari:',SITE+'historias.html'));
}

let currentNameText='';
function renderName(){
  const input=document.getElementById('nameInput'); const out=document.getElementById('nameOutput'); const canvas=document.getElementById('nameCanvas');
  if(!input||!out||!canvas)return;
  const n=nameToKawsayari(input.value);
  currentNameText=`${n.name} en Kawsayari: ${n.title} — ${n.meaning}`;
  out.textContent=currentNameText;
  drawStory(canvas,{theme:currentTheme,label:'MI NOMBRE EN KAWSAYARI',main:n.title,sub:n.name+' · '+n.meaning});
}
async function initName(){
  if(!document.getElementById('nameCanvas'))return;
  renderName();
  document.getElementById('nameInput')?.addEventListener('input',renderName);
  document.getElementById('generateName')?.addEventListener('click',renderName);
  document.getElementById('randomName')?.addEventListener('click',()=>{const samples=['Luz','Andrés','Camila','Diego','Valeria','Renato','Adrián']; document.getElementById('nameInput').value=samples[Math.floor(Math.random()*samples.length)]; renderName();});
  document.getElementById('downloadName')?.addEventListener('click',()=>downloadCanvas(document.getElementById('nameCanvas'),'mi-nombre-kawsayari.png'));
  document.getElementById('shareName')?.addEventListener('click',()=>nativeShareCanvas(document.getElementById('nameCanvas'),currentNameText));
  document.getElementById('copyName')?.addEventListener('click',async()=>navigator.clipboard.writeText(currentNameText+' '+SITE+'nombre.html'));
  document.getElementById('waName')?.addEventListener('click',()=>shareUrl('wa',currentNameText,SITE+'nombre.html'));
  document.getElementById('fbName')?.addEventListener('click',()=>shareUrl('fb',currentNameText,SITE+'nombre.html'));
  document.getElementById('xName')?.addEventListener('click',()=>shareUrl('x',currentNameText,SITE+'nombre.html'));
}

let currentPhraseText='';
async function renderPhrase(){
  const input=document.getElementById('phraseInput'); const out=document.getElementById('phraseOutput'); const canvas=document.getElementById('phraseCanvas');
  if(!input||!out||!canvas)return;
  await loadData();
  const original=input.value.trim();
  const tr=translatePhrase(original,'es-ka').text;
  currentPhraseText=`${original} → ${tr}`;
  out.textContent=currentPhraseText;
  drawStory(canvas,{theme:currentTheme,label:'MI FRASE EN KAWSAYARI',main:tr,sub:original});
}
function renderWall(){
  const wall=document.getElementById('phraseWall'); if(!wall)return;
  const items=JSON.parse(localStorage.getItem('kawsayariWall')||'[]');
  wall.innerHTML=items.map(x=>`<div class="card"><strong>${escapeHtml(x.split('→')[0]||'Frase')}</strong><p>${escapeHtml(x)}</p></div>`).join('');
}
async function initPhrase(){
  if(!document.getElementById('phraseCanvas'))return;
  await renderPhrase(); renderWall();
  document.getElementById('phraseInput')?.addEventListener('input',renderPhrase);
  document.getElementById('generatePhrase')?.addEventListener('click',renderPhrase);
  document.getElementById('savePhrase')?.addEventListener('click',()=>{const arr=JSON.parse(localStorage.getItem('kawsayariWall')||'[]'); arr.unshift(currentPhraseText); localStorage.setItem('kawsayariWall',JSON.stringify(arr.slice(0,12))); renderWall();});
  document.getElementById('downloadPhrase')?.addEventListener('click',()=>downloadCanvas(document.getElementById('phraseCanvas'),'frase-kawsayari.png'));
  document.getElementById('sharePhrase')?.addEventListener('click',()=>nativeShareCanvas(document.getElementById('phraseCanvas'),currentPhraseText));
  document.getElementById('copyPhrase')?.addEventListener('click',async()=>navigator.clipboard.writeText(currentPhraseText+' '+SITE+'frases.html'));
  document.getElementById('waPhrase')?.addEventListener('click',()=>shareUrl('wa',currentPhraseText,SITE+'frases.html'));
  document.getElementById('fbPhrase')?.addEventListener('click',()=>shareUrl('fb',currentPhraseText,SITE+'frases.html'));
  document.getElementById('xPhrase')?.addEventListener('click',()=>shareUrl('x',currentPhraseText,SITE+'frases.html'));
}

async function initLearning(){
  const word=document.getElementById('flashWord'); if(!word)return;
  await loadData();
  const category=document.getElementById('flashCategory'), meaning=document.getElementById('flashMeaning'), card=document.getElementById('flashCard'), daily=document.getElementById('dailyWord');
  let current=null;
  function setCard(item){current=item; word.textContent=item['Término original']; meaning.textContent=item['Significado']; category.textContent=item['Categoría']; card.classList.remove('show');}
  setCard(DICT[seededIndex(DICT.length)]);
  if(daily){const item=DICT[seededIndex(DICT.length)]; daily.innerHTML=`<h3>${escapeHtml(item['Término original'])}</h3><p>${escapeHtml(item['Significado'])}</p>`;}
  document.getElementById('newCard')?.addEventListener('click',()=>setCard(randomItem()));
  document.getElementById('showMeaning')?.addEventListener('click',()=>card.classList.toggle('show'));
  document.getElementById('copyCard')?.addEventListener('click',async()=>{if(current)await navigator.clipboard.writeText(`${current['Término original']} — ${current['Significado']}`);});
}

async function initAssistant(){
  const log=document.getElementById('assistantLog'); if(!log)return;
  await loadData();
  const input=document.getElementById('assistantInput');
  function add(cls,text){const div=document.createElement('div'); div.className='bubble '+cls; div.innerHTML=text; log.appendChild(div); log.scrollTop=log.scrollHeight;}
  function answer(q){
    const nq=normalizeText(q);
    if(!nq) return 'Escribe una palabra, una frase o una idea para historia.';
    if(nq.includes('palabra del dia')||nq.includes('palabra del día')){const item=DICT[seededIndex(DICT.length)]; return `<strong>${escapeHtml(item['Término original'])}</strong><br>${escapeHtml(item['Significado'])}`;}
    if(nq.includes('historia')) return `Prueba esto: <strong>“Mi palabra en Kawsayari es ${escapeHtml(randomItem()['Término original'])}”</strong><br><a href="historias.html">Crear tarjeta para historia</a>`;
    if(nq.startsWith('traduce')||nq.includes('traducir')){const phrase=q.replace(/traduce|traducir/gi,'').trim(); return `<strong>${escapeHtml(translatePhrase(phrase,'es-ka').text)}</strong><br><a href="traductor.html">Abrir traductor completo</a>`;}
    const term=DICT.find(x=>normalizeText(x['Término original'])===nq);
    if(term) return `<strong>${escapeHtml(term['Término original'])}</strong><br>${escapeHtml(term['Significado'])}`;
    const tr=translatePhrase(q,'es-ka').text;
    return `Puedo convertirlo como:<br><strong>${escapeHtml(tr)}</strong><br><a href="historias.html">Crear tarjeta compartible</a>`;
  }
  add('bot','Soy el Asistente Kawsayari. Puedo traducir palabras, sugerir frases y ayudarte a crear tarjetas para historias.');
  function send(){const q=input.value.trim(); if(!q)return; add('user',escapeHtml(q)); add('bot',answer(q)); input.value='';}
  document.getElementById('assistantSend')?.addEventListener('click',send);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
  document.querySelectorAll('.quickAsk').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.q;send();}));
}

function renderAllCards(){
  if(document.getElementById('storyCanvas')) renderStoryFromInputs();
  if(document.getElementById('nameCanvas')) renderName();
  if(document.getElementById('phraseCanvas')) renderPhrase();
}

initDictionarySearch();
initTranslator();
initStories();
initName();
initPhrase();
initLearning();
initAssistant();
