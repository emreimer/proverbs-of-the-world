let muted=localStorage.getItem('pq-muted')==='1';
let audioCtx=null,master=null;
let el=document.getElementById('spinAudio');
if(!el){ el=document.createElement('audio'); el.setAttribute('playsinline','true'); el.setAttribute('webkit-playsinline','true'); document.body.appendChild(el); }
function makeWavUrl(){
  var sr=22050,dur=1.12,n=(sr*dur)|0;
  var samples=new Int16Array(n);
  var notes=[[392,0,0.2,0.55],[523.25,0.1,0.22,0.62],[659.25,0.2,0.24,0.7],[783.99,0.32,0.3,0.75],[1046.5,0.46,0.5,0.82]];
  function env(t,d){ if(t<0||t>d) return 0; var a=0.012; if(t<a) return t/a; return Math.exp(-4.2*(t-a)/(d-a)); }
  for(var k=0;k<notes.length;k++){
    var f=notes[k][0],t0=notes[k][1],d=notes[k][2],amp=notes[k][3];
    var i0=(t0*sr)|0,len=(d*sr)|0;
    for(var i=0;i<len;i++){
      var t=i/sr,idx=i0+i; if(idx>=n) break;
      var e=env(t,d)*amp;
      var tri=2*Math.abs(2*((f*t)%1)-1)-1;
      var sine=Math.sin(2*Math.PI*f*t);
      var spark=Math.sin(2*Math.PI*f*2*t);
      var v=samples[idx]/32767+e*(0.72*tri+0.22*sine+0.16*spark);
      v=Math.tanh(v*1.15);
      samples[idx]=(v*32767)|0;
    }
  }
  var buf=new ArrayBuffer(44+n*2),view=new DataView(buf);
  function ws(o,s){ for(var i=0;i<s.length;i++) view.setUint8(o+i,s.charCodeAt(i)); }
  ws(0,'RIFF'); view.setUint32(4,36+n*2,true); ws(8,'WAVE'); ws(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,sr,true); view.setUint32(28,sr*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  ws(36,'data'); view.setUint32(40,n*2,true);
  for(var i=0;i<n;i++) view.setInt16(44+i*2,samples[i],true);
  return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
}
try{ if(el) el.src=makeWavUrl(); }catch(e){}
function syncMute(){ const b=document.getElementById('muteBtn'); if(b) b.textContent=muted?'Sound off':'Sound on'; }
function getCtx(){
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
  if(!audioCtx){
    try{ audioCtx=new AC({latencyHint:'interactive'}); }catch(e){ audioCtx=new AC(); }
    master=audioCtx.createGain(); master.gain.value=muted?0:1; master.connect(audioCtx.destination);
  }
  return audioCtx;
}
function unlock(){ const a=getCtx(); if(a&&a.state==='suspended'){ try{ a.resume(); }catch(e){} } }
function beep(audio,dest,freq,t0,dur,type,gain){
  const osc=audio.createOscillator(); osc.type=type; osc.frequency.setValueAtTime(freq,t0);
  const g=audio.createGain();
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(gain,t0+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  osc.connect(g); g.connect(dest); osc.start(t0); osc.stop(t0+dur+0.02);
}
function playSpinChime(){
  if(muted) return;
  unlock();
  if(el){ try{ el.pause(); el.currentTime=0; el.volume=1; const p=el.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} }
  const audio=getCtx(); if(!audio||!master) return;
  try{
    const t=audio.currentTime+0.02;
    const notes=[[392,0,0.18],[523.25,0.1,0.2],[659.25,0.2,0.22],[783.99,0.32,0.28],[1046.5,0.46,0.42]];
    notes.forEach(function(n){
      beep(audio,master,n[0],t+n[1],n[2],'triangle',0.85);
      beep(audio,master,n[0]*2,t+n[1],n[2]*0.7,'sine',0.28);
    });
  }catch(e){}
}
syncMute();
document.addEventListener('pointerdown',function(){ if(!muted) unlock(); });
document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') unlock(); });
const muteBtn=document.getElementById('muteBtn');
if(muteBtn) muteBtn.onclick=function(){
  muted=!muted;
  localStorage.setItem('pq-muted',muted?'1':'0');
  if(master&&audioCtx) master.gain.setTargetAtTime(muted?0:1,audioCtx.currentTime,0.02);
  syncMute(); unlock();
  if(!muted) playSpinChime();
};
const spinBtn=document.getElementById('spinBtn');
if(spinBtn) spinBtn.addEventListener('click',function(){ unlock(); playSpinChime(); });
