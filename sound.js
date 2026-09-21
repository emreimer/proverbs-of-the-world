let muted=localStorage.getItem('pq-muted')==='1';
let audioCtx=null,spinGain=null,activeOsc=[];
function syncMute(){const b=document.getElementById('muteBtn'); if(b) b.textContent=muted?'Sound off':'Sound on';}
function ensureAudio(){
 const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
 if(!audioCtx){ audioCtx=new AC(); spinGain=audioCtx.createGain(); spinGain.gain.value=0.7; spinGain.connect(audioCtx.destination); }
 if(audioCtx.state==='suspended') audioCtx.resume();
 return audioCtx;
}
function stopSpinSound(){
 if(!audioCtx||!spinGain) return;
 try{ spinGain.gain.cancelScheduledValues(audioCtx.currentTime); spinGain.gain.setValueAtTime(Math.max(spinGain.gain.value,0.0001),audioCtx.currentTime); spinGain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.15);}catch(e){}
 const nodes=activeOsc.slice(); activeOsc=[];
 setTimeout(()=>{ nodes.forEach(n=>{ try{n.stop();}catch(e){} }); },200);
}
function startSpinSound(){
 if(muted) return;
 const ctx=ensureAudio(); if(!ctx) return;
 try{
  activeOsc.forEach(n=>{ try{n.stop();}catch(e){} }); activeOsc=[];
  spinGain.gain.cancelScheduledValues(ctx.currentTime);
  spinGain.gain.setValueAtTime(0.7,ctx.currentTime);
  const notes=[523.25,659.25,783.99,987.77,1046.5,1174.7,1318.5,1568];
  notes.forEach((freq,i)=>{
    const t0=ctx.currentTime+i*0.12;
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.4,t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.18);
    o.connect(g); g.connect(spinGain);
    o.start(t0); o.stop(t0+0.2);
    activeOsc.push(o);
  });
 }catch(e){}
}
syncMute();
document.addEventListener('pointerdown',()=>{ if(!muted) ensureAudio(); });
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=()=>{ muted=!muted; localStorage.setItem('pq-muted',muted?'1':'0'); if(muted) stopSpinSound(); else ensureAudio(); syncMute(); };
const spinBtn=document.getElementById('spinBtn');
if(spinBtn) spinBtn.addEventListener('click',function(){ startSpinSound(); });
setInterval(()=>{ if(typeof hold!=='undefined' && hold) stopSpinSound(); },300);
