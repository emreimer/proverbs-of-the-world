const EARTH_TEX='https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg';
const FLAG=iso=>'https://flagcdn.com/w40/'+iso.toLowerCase()+'.png';
const FLAG_LG=iso=>'https://flagcdn.com/w160/'+iso.toLowerCase()+'.png';
const DATA={countries:[
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
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function others(name){const p=[];for(const c of DATA.countries){if(c.name===name)continue;for(const x of c.proverbs)p.push({text:x,from:c.name,iso:c.iso});}const o=[],u={};while(o.length<3){const x=pick(p);if(!u[x.text]){u[x.text]=1;o.push(x);}}return o;}
let scene,camera,renderer,globeMesh,spinSpeed=0.012,targetSpeed=0.012,hold=false,locked=false,score=0,streak=0,current=null;
const canvas=document.getElementById('globe');
function resize(){if(!renderer||!camera)return;const w=canvas.clientWidth||320,h=canvas.clientHeight||280;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function initGlobe(){
 if(typeof THREE==='undefined')return;
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(32,1,0.1,80);
 camera.position.set(0,0,3.45);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setClearColor(0x000000,1);
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 new THREE.TextureLoader().load(EARTH_TEX,tex=>{
  tex.colorSpace=THREE.SRGBColorSpace;
  globeMesh=new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshPhongMaterial({map:tex,shininess:16}));
  scene.add(globeMesh);
 });
 scene.add(new THREE.AmbientLight(0x445566,0.7));
 const sun=new THREE.DirectionalLight(0xfff4dd,2); sun.position.set(5,2,3); scene.add(sun);
 resize(); window.addEventListener('resize',resize);
 (function loop(){
  requestAnimationFrame(loop);
  spinSpeed+=(targetSpeed-spinSpeed)*0.06;
  if(globeMesh && !hold) globeMesh.rotation.y+=spinSpeed;
  if(renderer&&scene&&camera) renderer.render(scene,camera);
 })();
}
function startSpin(){
 hold=false; targetSpeed=0.22; locked=true;
 document.getElementById('opts').innerHTML='';
 document.getElementById('result').textContent='';
 document.getElementById('hint').textContent='Finding a country';
 document.getElementById('q').classList.add('hidden');
 document.getElementById('flag').classList.add('hidden');
 document.getElementById('spinBtn').disabled=true;
 setTimeout(()=>{targetSpeed=0.02;setTimeout(showRound,400);},1400);
}
function showRound(){
 targetSpeed=0; hold=true;
 const c=pick(DATA.countries);
 const correct=pick(c.proverbs);
 const ch=shuffle([{text:correct,ok:true,from:c.name,iso:c.iso},...others(c.name)]);
 current={country:c,correct};
 document.getElementById('country').textContent=c.name;
 const fl=document.getElementById('flag'); fl.src=FLAG_LG(c.iso); fl.classList.remove('hidden');
 document.getElementById('hint').textContent='';
 document.getElementById('q').classList.remove('hidden');
 const box=document.getElementById('opts'); box.innerHTML='';
 ch.forEach(opt=>{
  const b=document.createElement('button'); b.className='opt';
  b.innerHTML='<span class="proverb"></span><span class="meta"><img alt=""/><span></span></span>';
  b.querySelector('.proverb').textContent=opt.text;
  b.querySelector('.meta img').src=FLAG(opt.iso);
  b.querySelector('.meta span').textContent=opt.from;
  b.onclick=()=>answer(b,opt);
  box.appendChild(b);
 });
 locked=false; document.getElementById('spinBtn').disabled=false; document.getElementById('spinBtn').textContent='Next country';
}
function answer(btn,ch){
 if(locked)return; locked=true;
 [...document.getElementById('opts').children].forEach(el=>{el.classList.add('revealed'); if(el.querySelector('.proverb').textContent===current.correct) el.classList.add('correct');});
 if(ch.ok){btn.classList.add('correct');score+=10;streak++;document.getElementById('result').textContent='Correct.';}
 else {btn.classList.add('wrong');streak=0;document.getElementById('result').textContent='Not this one. That proverb is from '+ch.from+'.';}
 document.getElementById('score').textContent=score; document.getElementById('streak').textContent=streak;
}
document.getElementById('spinBtn').onclick=startSpin;
window.addEventListener('load', initGlobe);
