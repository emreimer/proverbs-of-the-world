let muted=localStorage.getItem('pq-muted')==='1';
let audioCtx=null,spinGain=null,activeOsc=[];
function syncMute(){const b=document.getElementById('muteBtn'); if(b) b.textContent=muted?'Sound off':'Sound on';}
function ensureAudio(){
 const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
 if(!audioCtx){ audioCtx=new AC(); spinGain=audioCtx.createGain(); spinGain.gain.value=0; spinGain.connect(audioCtx.destination); }
 if(audioCtx.state==='suspended') audioCtx.resume();
 return audioCtx;
}
function stopSpinSound(){
 if(!audioCtx||!spinGain) return;
 try{ spinGain.gain.cancelScheduledValues(audioCtx.currentTime); spinGain.gain.setValueAtTime(Math.max(spinGain.gain.value,0.0001),audioCtx.currentTime); spinGain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.2);}catch(e){}
 const nodes=activeOsc.slice(); activeOsc=[];
 setTimeout(()=>{ nodes.forEach(n=>{ try{n.stop();}catch(e){} }); },250);
}
function startSpinSound(){
 if(muted) return;
 const ctx=ensureAudio(); if(!ctx) return;
 try{
  activeOsc.forEach(n=>{ try{n.stop();}catch(e){} }); activeOsc=[];
  spinGain.gain.cancelScheduledValues(ctx.currentTime);
  spinGain.gain.setValueAtTime(0.0001,ctx.currentTime);
  spinGain.gain.exponentialRampToValueAtTime(0.55,ctx.currentTime+0.05);
  const o1=ctx.createOscillator(); o1.type='sawtooth';
  o1.frequency.setValueAtTime(220,ctx.currentTime); o1.frequency.exponentialRampToValueAtTime(70,ctx.currentTime+1.8);
  const o2=ctx.createOscillator(); o2.type='square';
  o2.frequency.setValueAtTime(110,ctx.currentTime); o2.frequency.exponentialRampToValueAtTime(48,ctx.currentTime+1.8);
  const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1400;
  const g2=ctx.createGain(); g2.gain.value=0.35;
  o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(spinGain);
  o1.start(); o2.start(); activeOsc=[o1,o2];
  for(let i=0;i<8;i++){
    const t0=ctx.currentTime+0.08+i*0.16;
    const click=ctx.createOscillator(); click.type='square'; click.frequency.value=680-i*40;
    const cg=ctx.createGain();
    cg.gain.setValueAtTime(0.0001,t0);
    cg.gain.exponentialRampToValueAtTime(0.28,t0+0.01);
    cg.gain.exponentialRampToValueAtTime(0.0001,t0+0.07);
    click.connect(cg); cg.connect(spinGain);
    click.start(t0); click.stop(t0+0.08);
    activeOsc.push(click);
  }
 }catch(e){}
}
syncMute();
document.addEventListener('pointerdown',()=>{ if(!muted) ensureAudio(); });
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=()=>{ muted=!muted; localStorage.setItem('pq-muted',muted?'1':'0'); if(muted) stopSpinSound(); else ensureAudio(); syncMute(); };
const spinBtn=document.getElementById('spinBtn');
if(spinBtn) spinBtn.addEventListener('click',function(){ startSpinSound(); });
setInterval(()=>{ if(typeof hold!=='undefined' && hold) stopSpinSound(); },250);
