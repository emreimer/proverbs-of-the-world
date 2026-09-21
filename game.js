let DATA={countries:[]};
const INFO={AF:['Kabul','43 million','Dari, Pashto'],AL:['Tirana','2.8 million','Albanian'],BR:['Brasilia','216 million','Portuguese'],EG:['Cairo','116 million','Arabic'],DE:['Berlin','84 million','German'],IN:['New Delhi','1.44 billion','Hindi, English'],JP:['Tokyo','123 million','Japanese'],TR:['Ankara','85 million','Turkish'],US:['Washington, D.C.','340 million','English'],GB:['London','68 million','English']};
const CENT={AF:[33,66],AL:[41,20],BR:[-10,-52],EG:[26,30],DE:[51,10],IN:[21,78],JP:[36,138],TR:[39,35],US:[39,-98],GB:[54,-2]};
const ISO3={AF:'AFG',AL:'ALB',BR:'BRA',EG:'EGY',DE:'DEU',IN:'IND',JP:'JPN',TR:'TUR',US:'USA',GB:'GBR'};
const FALL={countries:[
{name:'Afghanistan',iso:'AF',proverbs:['A little water is a sea to an ant.','A wise enemy is better than a foolish friend.','Patience is bitter, but it has a sweet fruit.','One flower does not bring spring.']},
{name:'Albania',iso:'AL',proverbs:['A day without work can yield a night without sleep.','He who hesitates, regrets.','Patience is the key to paradise.','You cannot hunt with a tied dog.']},
{name:'Brazil',iso:'BR',proverbs:['A sleeping fox finds no meat.','Goodwill makes the road shorter.','Never put off till tomorrow what you can do today.','You cannot cover up the sun with a sieve.']},
{name:'Egypt',iso:'EG',proverbs:['A beautiful thing is never perfect.','Friendship doubles joy and halves grief.','What comes easily is lost easily.','The opinion of the intelligent is better than the certainty of the ignorant.']},
{name:'Germany',iso:'DE',proverbs:['All beginnings are hard.','He who rests grows rusty.','Practice is what makes a master.','Actions say more than words.']},
{name:'India',iso:'IN',proverbs:['Learning is a treasure no thief can touch.','Where the needle goes, the thread follows.','Among the blind, the one-eyed man is king.','Don\'t bargain for fish which are still in the water.']},
{name:'Japan',iso:'JP',proverbs:['Fall seven times and stand up eight.','The nail that sticks out gets hammered down.','One kind word can warm three winter months.','Vision without action is a daydream.']},
{name:'Turkey',iso:'TR',proverbs:['A cup of coffee commits one to forty years of friendship.','No matter how far you have gone on the wrong road, turn back.','The dog barks, but the caravan moves on.','Patience is bitter, but its fruit is sweet.']},
{name:'USA',iso:'US',proverbs:['Actions speak louder than words.','The early bird catches the worm.','If it ain\'t broke, don\'t fix it.','Talk is cheap.']},
{name:'United Kingdom',iso:'GB',proverbs:['A stitch in time saves nine.','Look before you leap.','Every cloud has a silver lining.','Make hay while the sun shines.']}
]};
const EARTH='https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg';
const FLAG=i=>'https://flagcdn.com/w40/'+i.toLowerCase()+'.png';
const FLAGL=i=>'https://flagcdn.com/w160/'+i.toLowerCase()+'.png';
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function others(name){const cs=shuffle(DATA.countries.filter(c=>c.name!==name&&c.proverbs&&c.proverbs.length));return cs.slice(0,3).map(c=>({text:pick(c.proverbs),from:c.name,iso:c.iso}));}
function latLonToVec(lat,lon,r){const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;return new THREE.Vector3(-Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t)).multiplyScalar(r||1);}
function destRot(iso){
 const ll=CENT[iso]||[20,0];
 const v=latLonToVec(ll[0],ll[1],1);
 const q=new THREE.Quaternion().setFromUnitVectors(v.clone().normalize(), new THREE.Vector3(0,0,1));
 return new THREE.Euler().setFromQuaternion(q,'YXZ');
}
let score=0,streak=0,locked=false,current=null,scene,camera,renderer,globeMesh,paintGroup,pendingGeo=null,spinSpeed=0.01,targetSpeed=0.01,hold=false,travel=null;
let pageR=null,pageS=null,pageC=null,pageM=null,pageG=null;
const canvas=document.getElementById('globe');
function initGlobe(){
 if(typeof THREE==='undefined')return;
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(32,1,0.1,80); camera.position.set(0,0,3.45);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setClearColor(0x000000,1);
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 new THREE.TextureLoader().load(EARTH,tex=>{
  tex.colorSpace=THREE.SRGBColorSpace;
  globeMesh=new THREE.Mesh(new THREE.SphereGeometry(1,64,64),new THREE.MeshPhongMaterial({map:tex,shininess:16}));
  scene.add(globeMesh);
  if(pendingGeo){const g=pendingGeo;pendingGeo=null;paintCountry(g);}
 });
 scene.add(new THREE.AmbientLight(0x445566,.7));
 const sun=new THREE.DirectionalLight(0xfff4dd,2);sun.position.set(5,2,3);scene.add(sun);
 function resize(){const w=canvas.clientWidth||320,h=canvas.clientHeight||280;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 resize(); addEventListener('resize',resize);
 (function loop(){
  requestAnimationFrame(loop);
  spinSpeed+=(targetSpeed-spinSpeed)*0.06;
  if(globeMesh){
   if(travel){
    const u=Math.min(1,(performance.now()-travel.t0)/travel.dur);
    const e=u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
    globeMesh.rotation.x=travel.fromX+(travel.toX-travel.fromX)*e;
    globeMesh.rotation.y=travel.fromY+(travel.toY-travel.fromY)*e;
    globeMesh.rotation.z=0;
    if(u>=1){ globeMesh.rotation.x=travel.toX; globeMesh.rotation.y=travel.toY; travel=null; hold=true; }
   } else if(!hold){
    globeMesh.rotation.x+=(0-globeMesh.rotation.x)*0.08;
    globeMesh.rotation.y+=spinSpeed;
    globeMesh.rotation.z=0;
   }
  }
  if(renderer) renderer.render(scene,camera);
  if(pageR&&document.getElementById('page').classList.contains('open')){
   const cvs=document.getElementById('pageGlobe');
   if(cvs){const w=cvs.clientWidth,h=cvs.clientHeight||220;pageR.setSize(w,h,false);pageC.aspect=w/Math.max(h,1);pageC.updateProjectionMatrix();pageR.render(pageS,pageC);}
  }
 })();
}
function paintCountry(geo){
 if(!globeMesh){pendingGeo=geo;return;}
 if(paintGroup){globeMesh.remove(paintGroup);paintGroup=null;}
 const g=new THREE.Group();
 const stroke=new THREE.LineBasicMaterial({color:0xffd45a});
 const feats=geo.type==='FeatureCollection'?geo.features:[geo];
 for(const f of feats){
  if(!f||!f.geometry)continue;
  const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
  for(const poly of polys){
   const ring=poly&&poly[0]; if(!ring||ring.length<4)continue;
   g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la])=>latLonToVec(la,lo,1.016))),stroke));
  }
 }
 paintGroup=g; globeMesh.add(g);
}
function lookCountry(iso, mesh){
 if(!mesh) return;
 const e=destRot(iso);
 mesh.rotation.set(e.x,e.y,0);
}
function aimAt(iso){
 if(globeMesh){
  const e=destRot(iso);
  let dy=e.y-globeMesh.rotation.y;
  dy=Math.atan2(Math.sin(dy),Math.cos(dy));
  travel={fromX:globeMesh.rotation.x,fromY:globeMesh.rotation.y,toX:e.x,toY:globeMesh.rotation.y+dy,t0:performance.now(),dur:1400};
  targetSpeed=0; spinSpeed=0; hold=false;
 }
 const code=ISO3[iso];
 if(!code)return;
 fetch('https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries/'+code+'.geo.json')
  .then(r=>{if(!r.ok)throw 0;return r.json();}).then(paintCountry).catch(()=>{});
}
function startSpin(){
 hold=false; travel=null; targetSpeed=0.22; locked=true;
 document.getElementById('opts').innerHTML='';
 document.getElementById('result').textContent='';
 document.getElementById('hint').textContent='Finding a country';
 document.getElementById('q').classList.add('hidden');
 document.getElementById('flag').classList.add('hidden');
 document.getElementById('infoBtn').classList.add('hidden');
 document.getElementById('spinBtn').disabled=true;
 if(paintGroup&&globeMesh){globeMesh.remove(paintGroup);paintGroup=null;}
 pendingGeo=null;
 setTimeout(()=>{targetSpeed=0.02;setTimeout(showRound,500);},1300);
}
function showRound(){
 const c=pick(DATA.countries); const correct=pick(c.proverbs);
 const ch=shuffle([{text:correct,ok:true,from:c.name,iso:c.iso},...others(c.name)]);
 current={country:c,correct}; aimAt(c.iso);
 document.getElementById('country').textContent=c.name;
 const fl=document.getElementById('flag'); fl.src=FLAGL(c.iso); fl.classList.remove('hidden');
 document.getElementById('infoBtn').classList.remove('hidden');
 document.getElementById('hint').textContent='';
 document.getElementById('q').classList.remove('hidden');
 const box=document.getElementById('opts'); box.innerHTML='';
 ch.forEach(opt=>{
  const b=document.createElement('button'); b.className='opt';
  b.innerHTML='<span class="proverb"></span><span class="meta"><img alt=""/><span></span></span>';
  b.querySelector('.proverb').textContent=opt.text;
  b.querySelector('.meta img').src=FLAG(opt.iso);
  b.querySelector('.meta span').textContent=opt.from;
  b.onclick=()=>answer(b,opt); box.appendChild(b);
 });
 locked=false; document.getElementById('spinBtn').disabled=false; document.getElementById('spinBtn').textContent='Next country';
}
function answer(btn,ch){
 if(locked)return;locked=true;
 [...document.getElementById('opts').children].forEach(el=>{el.classList.add('revealed');if(el.querySelector('.proverb').textContent===current.correct)el.classList.add('correct');});
 if(ch.ok){btn.classList.add('correct');score+=10;streak++;document.getElementById('result').textContent='Correct.';}
 else {btn.classList.add('wrong');streak=0;document.getElementById('result').textContent='Not this one. That proverb is from '+ch.from+'.';}
 document.getElementById('score').textContent=score; document.getElementById('streak').textContent=streak;
}
function openCountryPage(){
 if(!current||!current.country)return;
 const c=current.country; const info=INFO[c.iso]||['\u2014','\u2014','\u2014'];
 document.getElementById('pageFlag').src=FLAGL(c.iso);
 document.getElementById('pageName').textContent=c.name;
 document.getElementById('pageCap').textContent=info[0];
 document.getElementById('pagePop').textContent=info[1];
 document.getElementById('pageLang').textContent=info[2];
 document.getElementById('page').classList.add('open');
 const cvs=document.getElementById('pageGlobe');
 if(cvs && typeof THREE!=='undefined'){
  if(!pageR){
   pageS=new THREE.Scene();
   pageC=new THREE.PerspectiveCamera(32,1,0.1,80); pageC.position.set(0,0,3.15);
   pageR=new THREE.WebGLRenderer({canvas:cvs,antialias:true}); pageR.setClearColor(0x000000,1);
   pageS.add(new THREE.AmbientLight(0x445566,.8));
   const sun=new THREE.DirectionalLight(0xfff4dd,2); sun.position.set(5,2,3); pageS.add(sun);
   pageM=new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshPhongMaterial({color:0x1b3a5a}));
   pageS.add(pageM);
   new THREE.TextureLoader().load(EARTH,tex=>{tex.colorSpace=THREE.SRGBColorSpace;pageM.material=new THREE.MeshPhongMaterial({map:tex,shininess:16});});
  }
  lookCountry(c.iso, pageM);
  if(pageG){pageM.remove(pageG);pageG=null;}
  const code=ISO3[c.iso];
  if(code) fetch('https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries/'+code+'.geo.json').then(r=>{if(!r.ok)throw 0;return r.json();}).then(geo=>{const g=new THREE.Group();const stroke=new THREE.LineBasicMaterial({color:0xffd45a});const feats=geo.type==='FeatureCollection'?geo.features:[geo];for(const f of feats){if(!f||!f.geometry)continue;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];for(const poly of polys){const ring=poly&&poly[0];if(!ring||ring.length<4)continue;g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la])=>latLonToVec(la,lo,1.016))),stroke));}}pageG=g;pageM.add(g);}).catch(()=>{});
 }
}
document.getElementById('spinBtn').onclick=startSpin;
document.getElementById('backBtn').onclick=()=>document.getElementById('page').classList.remove('open');
document.getElementById('infoBtn').onclick=e=>{e.stopPropagation();openCountryPage();};
document.getElementById('countryRow').onclick=openCountryPage;
Promise.all(['c0.json','c1.json','c2.json','c3.json'].map(f=>fetch(f).then(r=>{if(!r.ok)throw 0;return r.json();})))
 .then(p=>{DATA={countries:p.flat()};})
 .catch(()=>{DATA=FALL;})
 .finally(()=>initGlobe());
