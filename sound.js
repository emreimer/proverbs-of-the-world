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
 try{ spinGain.gain.cancelScheduledValues(audioCtx.currentTime); spinGain.gain.setValueAtTime(Math.max(spinGain.gain.value,0.0001),audioCtx.currentTime); spinGain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.25);}catch(e){}
 const nodes=activeOsc.slice(); activeOsc=[];
 setTimeout(()=>{ nodes.forEach(n=>{ try{n.stop();}catch(e){} }); },280);
}
function startSpinSound(){
 if(muted) return;
 const ctx=ensureAudio(); if(!ctx) return;
 activeOsc.forEach(n=>{ try{n.stop();}catch(e){} }); activeOsc=[];
 const o1=ctx.createOscillator(); o1.type='sawtooth'; o1.frequency.setValueAtTime(140,ctx.currentTime); o1.frequency.linearRampToValueAtTime(70,ctx.currentTime+1.6);
 const o2=ctx.createOscillator(); o2.type='triangle'; o2.frequency.setValueAtTime(280,ctx.currentTime); o2.frequency.linearRampToValueAtTime(90,ctx.currentTime+1.6);
 const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900;
 o1.connect(f); o2.connect(f); f.connect(spinGain);
 spinGain.gain.cancelScheduledValues(ctx.currentTime);
 spinGain.gain.setValueAtTime(0.0001,ctx.currentTime);
 spinGain.gain.exponentialRampToValueAtTime(0.18,ctx.currentTime+0.08);
 o1.start(); o2.start(); activeOsc=[o1,o2];
}
syncMute();
document.addEventListener('pointerdown',()=>{ if(!muted) ensureAudio(); });
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=()=>{ muted=!muted; localStorage.setItem('pq-muted',muted?'1':'0'); if(muted) stopSpinSound(); else ensureAudio(); syncMute(); };
const spinBtn=document.getElementById('spinBtn');
if(spinBtn){
 const prev=spinBtn.onclick;
 spinBtn.addEventListener('click',function(){ startSpinSound(); });
}
setInterval(()=>{ if(typeof hold!=='undefined' && hold) stopSpinSound(); },250);
