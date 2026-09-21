let muted=localStorage.getItem('pq-muted')==='1';
let audioCtx=null,spinGain=null,spinNodes=[];
function syncMute(){const b=document.getElementById('muteBtn'); if(b) b.textContent=muted?'Sound off':'Sound on';}
function ensureAudio(){
 if(muted) return null;
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC) return null;
 if(!audioCtx){ audioCtx=new AC(); spinGain=audioCtx.createGain(); spinGain.gain.value=0; spinGain.connect(audioCtx.destination); }
 if(audioCtx.state==='suspended') audioCtx.resume();
 return audioCtx;
}
function stopSpinSound(){
 if(!audioCtx||!spinGain) return;
 try{ spinGain.gain.cancelScheduledValues(audioCtx.currentTime); spinGain.gain.setValueAtTime(spinGain.gain.value,audioCtx.currentTime); spinGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.2);}catch(e){}
 const nodes=spinNodes.slice(); spinNodes=[];
 setTimeout(()=>{ nodes.forEach(n=>{ try{n.stop();}catch(e){} }); },250);
}
function startSpinSound(){
 if(muted) return;
 const ctx=ensureAudio(); if(!ctx) return;
 stopSpinSound();
 const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=88;
 const o2=ctx.createOscillator(); o2.type='triangle'; o2.frequency.value=44;
 const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380;
 o1.connect(f); o2.connect(f); f.connect(spinGain);
 spinGain.gain.cancelScheduledValues(ctx.currentTime);
 spinGain.gain.setValueAtTime(0,ctx.currentTime);
 spinGain.gain.linearRampToValueAtTime(0.04,ctx.currentTime+0.12);
 o1.start(); o2.start();
 spinNodes=[o1,o2];
}
syncMute();
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=()=>{ muted=!muted; localStorage.setItem('pq-muted',muted?'1':'0'); if(muted) stopSpinSound(); syncMute(); };
const spinBtn=document.getElementById('spinBtn');
if(spinBtn){
 const prev=spinBtn.onclick;
 spinBtn.onclick=function(ev){ startSpinSound(); if(typeof prev==='function') prev.call(this,ev); };
}
setInterval(()=>{ if(typeof hold!=='undefined' && hold) stopSpinSound(); },200);
