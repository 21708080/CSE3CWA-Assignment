import type { WordSearchPuzzle, WordSearchSettings } from "@/types/wordSearch";

export function generateWordSearchHtml(
  settings: WordSearchSettings,
  puzzle: WordSearchPuzzle,
  customCss = "",
) {
  const settingsData = JSON.stringify(settings).replace(/</g, "\\u003c");
  const puzzleData = JSON.stringify(puzzle).replace(/</g, "\\u003c");
  const safeCustomCss = customCss.replace(/<\/style/gi, "<\\/style");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Phoneme Word Search</title>
<style>
:root{
  --game-bg:#fff7f7;--game-bg-accent:#ffe8e9;--game-surface:#ffffff;--game-surface-soft:#fffafa;
  --game-text:#29181b;--game-muted:#79676a;--game-primary:#b4232d;--game-primary-hover:#8f1b24;
  --game-border:#ead7da;--game-highlight:#fff0a8;--game-found:#dff6e9;--game-found-text:#176443;
  --game-answer:#f9dcef;--game-radius:16px;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:var(--game-text);background:var(--game-bg)
}
*{box-sizing:border-box}
body{margin:0;padding:clamp(14px,3vw,32px);min-height:100vh;background:radial-gradient(circle at 10% 0%,var(--game-bg-accent) 0,transparent 32rem),var(--game-bg);color:var(--game-text)}
.shell{max-width:980px;margin:auto}.card{background:var(--game-surface);border:1px solid var(--game-border);border-radius:calc(var(--game-radius) + 12px);padding:clamp(18px,4vw,34px);box-shadow:0 18px 55px rgba(50,25,30,.10)}
.eyebrow{font-size:.75rem;font-weight:850;text-transform:uppercase;letter-spacing:.16em;color:var(--game-primary);margin-bottom:8px}h1{margin:0;font-size:clamp(2rem,6vw,4rem);letter-spacing:-.045em}.sub{color:var(--game-muted);line-height:1.6;margin:10px 0 0}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:24px 0 12px}.help-dialog{width:min(560px,calc(100% - 28px));max-width:none;padding:0;border:0;border-radius:20px;background:transparent;color:var(--game-text)}.help-dialog::backdrop{background:rgba(21,24,31,.58);backdrop-filter:blur(4px)}.help-card{background:var(--game-surface);border:1px solid var(--game-border);border-radius:20px;overflow:hidden;box-shadow:0 28px 90px rgba(15,23,42,.28)}.help-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;border-bottom:1px solid var(--game-border)}.help-head h2{margin:0;font-size:1.35rem}.help-close{width:36px;height:36px;border:1px solid var(--game-border);border-radius:10px;background:var(--game-surface-soft);color:var(--game-text);font-size:1.3rem;cursor:pointer}.help-body{padding:19px 22px;color:var(--game-muted);line-height:1.6}.help-body ol{margin:0;padding-left:1.25rem;display:grid;gap:9px}.help-body strong{color:var(--game-text)}.help-foot{display:flex;justify-content:flex-end;padding:0 20px 20px}.help-foot button{background:var(--game-primary);border:1px solid var(--game-primary);color:#fff;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}.btn{appearance:none;border:1px solid var(--game-border);background:var(--game-surface);color:var(--game-text);border-radius:calc(var(--game-radius) - 5px);padding:9px 12px;font:750 .85rem inherit;cursor:pointer}.btn:hover{border-color:var(--game-primary);background:var(--game-surface-soft)}.counter{margin-left:auto;border-radius:999px;background:color-mix(in srgb,var(--game-primary) 10%,var(--game-surface));color:var(--game-primary);padding:8px 11px;font-size:.8rem;font-weight:800}
.grid-wrap{overflow:auto;padding:4px 0 8px}.grid{display:grid;gap:clamp(3px,.8vw,7px);margin:12px auto;max-width:720px;touch-action:none;user-select:none}.cell{appearance:none;min-width:0;aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--game-border);border-radius:calc(var(--game-radius) - 6px);background:var(--game-surface-soft);color:var(--game-text);font:850 clamp(.7rem,2.4vw,1.05rem) inherit;cursor:crosshair;padding:0;transition:background .12s,border-color .12s,transform .08s}.cell:hover{border-color:var(--game-primary)}.cell.active{background:var(--game-highlight);border-color:color-mix(in srgb,var(--game-primary) 55%,#d0a529)}.cell.found{background:var(--game-found);border-color:color-mix(in srgb,var(--game-found-text) 45%,var(--game-border));color:var(--game-found-text)}.cell.answer:not(.found){background:var(--game-answer);border-color:color-mix(in srgb,var(--game-primary) 35%,var(--game-border))}.cell:focus-visible{outline:3px solid var(--game-primary);outline-offset:2px}
.words{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:20px}.word{padding:9px 12px;border-radius:999px;background:var(--game-surface-soft);border:1px solid var(--game-border);font-weight:750;font-size:.9rem}.word.found{text-decoration:line-through;background:var(--game-found);color:var(--game-found-text)}.hint{font-size:.78rem;color:var(--game-muted);margin-left:6px}.complete{display:flex;align-items:center;gap:14px;margin-top:20px;padding:18px;border-radius:calc(var(--game-radius) + 1px);background:linear-gradient(135deg,var(--game-found),color-mix(in srgb,var(--game-found) 45%,var(--game-surface)));color:var(--game-found-text);border:1px solid color-mix(in srgb,var(--game-found-text) 35%,var(--game-border));font-weight:800;box-shadow:0 14px 34px rgba(20,70,45,.10);animation:pop .35s ease-out}.complete .icon{width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--game-found-text) 10%,var(--game-surface));font-size:1.25rem}.complete strong{display:block;font-size:1.05rem}.complete small{display:block;margin-top:4px;opacity:.82}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}.confetti{position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden}.confetti-piece{position:absolute;top:-24px;width:9px;height:16px;border-radius:2px;opacity:0;animation:confettiFall 2.2s cubic-bezier(.15,.68,.32,1) forwards}@keyframes confettiFall{0%{opacity:0;transform:translateY(-4vh) rotate(0)}8%{opacity:1}100%{opacity:.95;transform:translateY(105vh) rotate(760deg)}}.footer{margin-top:26px;color:var(--game-muted);font-size:.8rem;text-align:center}
@media(max-width:640px){.card{border-radius:calc(var(--game-radius) + 4px)}.counter{width:100%;margin-left:0;text-align:center}.grid{gap:3px}.cell{border-radius:max(4px,calc(var(--game-radius) - 10px))}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}.confetti{display:none}}

/* Uploaded classroom theme — embedded into this standalone file. */
${safeCustomCss}
</style>
</head>
<body>
<div id="confetti" class="confetti" aria-hidden="true"></div>
<main class="shell"><section class="card">
<div class="eyebrow">Classroom activity</div>
<h1>Phoneme Word Search</h1>
<p class="sub">Drag in a straight line across each phoneme sequence. Difficulty: <strong>${settings.difficulty}</strong>.</p>
<div class="toolbar"><button class="btn" id="newBtn" type="button">Reset progress</button><button class="btn" id="answersBtn" type="button">Show answers</button><button class="btn" id="helpBtn" type="button">How to play?</button><span class="counter" id="counter" aria-live="polite">0 / ${settings.words.length} found</span></div>
<dialog id="helpDialog" class="help-dialog"><div class="help-card"><div class="help-head"><h2>How to play Phoneme Word Search</h2><button id="helpClose" class="help-close" type="button" aria-label="Close instructions">×</button></div><div class="help-body"><ol><li>Find each phoneme sequence shown below the grid.</li><li>Press or click the first phoneme, then drag in a straight line across the complete word.</li><li>Words may run horizontally, vertically or diagonally, forwards or backwards.</li><li>A correctly selected word stays highlighted and is crossed off the word list.</li><li>Find every word to complete the puzzle. Use <strong>Show answers</strong> only when you need help.</li></ol></div><div class="help-foot"><button id="helpDone" type="button">Got it — play game</button></div></div></dialog>
<div class="grid-wrap"><div class="grid" id="grid" role="grid" aria-label="Phoneme word search"></div></div>
<div class="words" id="words" aria-label="Words to find"></div>
<div id="complete" aria-live="polite"></div>
<div class="footer">Generated with WordleStyle.</div>
</section></main>
<script>
const settings=${settingsData};
const puzzle=${puzzleData};
const gridEl=document.getElementById('grid');
const wordsEl=document.getElementById('words');
const counterEl=document.getElementById('counter');
const completeEl=document.getElementById('complete');
const answersBtn=document.getElementById('answersBtn');
const confettiEl=document.getElementById('confetti');
let selecting=false,start=null,end=null,showAnswers=false,celebrated=false;
function launchConfetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;confettiEl.innerHTML='';const colors=['#b4232d','#e9b949','#2f7d5b','#7c5ce0','#ef7b45'];for(let i=0;i<52;i++){const piece=document.createElement('i');piece.className='confetti-piece';piece.style.left=((i*37)%100)+'%';piece.style.background=colors[i%colors.length];piece.style.animationDelay=((i%10)*.04)+'s';piece.style.animationDuration=(1.8+(i%7)*.12)+'s';confettiEl.appendChild(piece)}setTimeout(()=>{confettiEl.innerHTML=''},3200)}
const foundIds=new Set();
const key=(p)=>p.row+':'+p.col;
function pathBetween(a,b){
  const dr=b.row-a.row,dc=b.col-a.col;
  if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return null;
  const steps=Math.max(Math.abs(dr),Math.abs(dc));
  if(steps===0)return [a];
  const sr=dr===0?0:dr/steps,sc=dc===0?0:dc/steps;
  const path=[];for(let i=0;i<=steps;i++)path.push({row:a.row+sr*i,col:a.col+sc*i});return path;
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function buildGrid(){
  gridEl.style.gridTemplateColumns='repeat('+puzzle.cols+',minmax(0,1fr))';
  gridEl.innerHTML=puzzle.grid.flatMap((row,r)=>row.map((value,c)=>
    '<button type="button" role="gridcell" class="cell" data-wordsearch-cell="true" data-row="'+r+'" data-col="'+c+'" aria-label="Row '+(r+1)+', column '+(c+1)+': '+escapeHtml(value)+'" title="/'+escapeHtml(value)+'/">'+escapeHtml(value)+'</button>'
  )).join('');
}
function updateView(){
  const active=new Set((start&&end?(pathBetween(start,end)||[]):[]).map(key));
  const foundCells=new Set();
  const answerCells=new Set();
  puzzle.placements.forEach(pl=>{
    if(foundIds.has(pl.wordId))pl.coordinates.forEach(p=>foundCells.add(key(p)));
    if(showAnswers)pl.coordinates.forEach(p=>answerCells.add(key(p)));
  });
  gridEl.querySelectorAll('.cell').forEach(cell=>{
    const k=cell.dataset.row+':'+cell.dataset.col;
    cell.classList.toggle('active',active.has(k));
    cell.classList.toggle('found',foundCells.has(k));
    cell.classList.toggle('answer',answerCells.has(k)&&!foundCells.has(k));
  });
  wordsEl.innerHTML=settings.words.map(w=>'<span class="word '+(foundIds.has(w.id)?'found':'')+'">/'+w.phonemes.map(escapeHtml).join(' ')+'/'+(settings.showHints?'<span class="hint">'+escapeHtml(w.english)+'</span>':'')+'</span>').join('');
  counterEl.textContent=foundIds.size+' / '+settings.words.length+' found';
  completeEl.innerHTML=foundIds.size===settings.words.length&&settings.words.length?'<div class="complete"><span class="icon">★</span><span><strong>Outstanding — puzzle conquered!</strong><small>You found all '+settings.words.length+' phoneme words.</small></span></div>':'';
  const isComplete=foundIds.size===settings.words.length&&settings.words.length>0;if(isComplete&&!celebrated){celebrated=true;launchConfetti()}
}
function coordinateFromPoint(x,y){
  const raw=document.elementFromPoint(x,y);
  const cell=raw&&raw.closest?raw.closest('[data-wordsearch-cell="true"]'):null;
  if(!cell)return null;
  const row=Number(cell.dataset.row),col=Number(cell.dataset.col);
  if(!Number.isInteger(row)||!Number.isInteger(col))return null;
  return{row,col};
}
function begin(cell,e){
  e.preventDefault();
  selecting=true;
  start={row:Number(cell.dataset.row),col:Number(cell.dataset.col)};
  end=start;
  updateView();
}
function finish(){
  if(!selecting)return;
  selecting=false;
  if(start&&end){
    const path=pathBetween(start,end);
    if(path){
      const selected=path.map(key),reversed=[...selected].reverse();
      const match=puzzle.placements.find(pl=>{
        if(foundIds.has(pl.wordId))return false;
        const placed=pl.coordinates.map(key);
        if(placed.length!==selected.length)return false;
        return placed.every((k,i)=>k===selected[i])||placed.every((k,i)=>k===reversed[i]);
      });
      if(match)foundIds.add(match.wordId);
    }
  }
  start=null;end=null;updateView();
}
gridEl.addEventListener('pointerdown',e=>{
  const cell=e.target.closest('[data-wordsearch-cell="true"]');
  if(cell)begin(cell,e);
});
window.addEventListener('pointermove',e=>{
  if(!selecting)return;
  const point=coordinateFromPoint(e.clientX,e.clientY);
  if(point){
    if(!end||point.row!==end.row||point.col!==end.col){end=point;updateView();}
  }
},{passive:true});
window.addEventListener('pointerup',finish);
window.addEventListener('pointercancel',finish);
document.getElementById('newBtn').addEventListener('click',()=>{
  foundIds.clear();showAnswers=false;celebrated=false;confettiEl.innerHTML='';answersBtn.textContent='Show answers';selecting=false;start=null;end=null;updateView();
});
const helpDialog=document.getElementById('helpDialog');document.getElementById('helpBtn').addEventListener('click',()=>helpDialog.showModal());document.getElementById('helpClose').addEventListener('click',()=>helpDialog.close());document.getElementById('helpDone').addEventListener('click',()=>helpDialog.close());
answersBtn.addEventListener('click',()=>{
  showAnswers=!showAnswers;answersBtn.textContent=showAnswers?'Hide answers':'Show answers';updateView();
});
buildGrid();
updateView();
</script>
</body></html>`;
}
