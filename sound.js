let muted=localStorage.getItem('pq-muted')==='1';
let audioCtx=null,master=null;
function syncMute(){const b=document.getElementById('muteBtn'); if(b) b.textContent=muted?'Sound off':'Sound on';}
function getCtx(){
 const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
 if(!audioCtx){
  try{ audioCtx=new AC({latencyHint:'interactive'}); }catch(e){ audioCtx=new AC(); }
  master=audioCtx.createGain(); master.gain.value=muted?0:1; master.connect(audioCtx.destination);
 }
 return audioCtx;
}
function unlock(){ const a=getCtx(); if(a&&a.state==='suspended') a.resume(); }
function playSpinChime(){
 if(muted) return;
 const audio=getCtx(); if(!audio||!master) return;
 const go=()=>{
  const notes=[523.25,659.25,783.99,987.77,1046.5,1174.66,1318.51,1567.98];
  notes.forEach((freq,i)=>{
    const t0=audio.currentTime+i*0.1;
    const sine=audio.createOscillator(); sine.type='sine'; sine.frequency.value=freq;
    const tri=audio.createOscillator(); tri.type='triangle'; tri.frequency.value=freq*2;
    const g=audio.createGain();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.7,t0+0.018);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.28);
    const sparkle=audio.createGain(); sparkle.gain.value=0.22;
    sine.connect(g); tri.connect(sparkle); sparkle.connect(g); g.connect(master);
    sine.start(t0); tri.start(t0); sine.stop(t0+0.3); tri.stop(t0+0.22);
  });
 };
 if(audio.state==='suspended'){ const p=audio.resume(); if(p&&p.then) p.then(go); else go(); } else go();
}
syncMute();
document.addEventListener('pointerdown',()=>{ if(!muted) unlock(); });
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=()=>{ muted=!muted; localStorage.setItem('pq-muted',muted?'1':'0'); if(master&&audioCtx){ master.gain.setTargetAtTime(muted?0:1,audioCtx.currentTime,0.02);} syncMute(); unlock(); };
const spinBtn=document.getElementById('spinBtn');
if(spinBtn) spinBtn.addEventListener('click',function(){ unlock(); playSpinChime(); });
