let DATA = { countries: [] };
let INFO = {};
let CENT = {};
let ISO3 = {};
const EARTH = 'https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg';
const FLAG = i => 'https://flagcdn.com/w40/' + i.toLowerCase() + '.png';
const FLAGL = i => 'https://flagcdn.com/w160/' + i.toLowerCase() + '.png';
const pick = a => a[Math.floor(Math.random() * a.length)];
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function others(name){
  const cs = shuffle(DATA.countries.filter(c => c.name !== name && c.proverbs && c.proverbs.length));
  return cs.slice(0,3).map(c => ({ text: pick(c.proverbs), from: c.name, iso: c.iso }));
}
function latLonToVec(lat,lon,r){
  const p=(90-lat)*Math.PI/180, t=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-Math.sin(p)*Math.cos(t), Math.cos(p), Math.sin(p)*Math.sin(t)).multiplyScalar(r||1);
}
function destQuat(iso){
  const ll = CENT[iso] || [20,0];
  const target = latLonToVec(ll[0], ll[1], 1).normalize();
  const north = new THREE.Vector3(0,1,0);
  const yAxis = north.clone().sub(target.clone().multiplyScalar(north.dot(target)));
  if (yAxis.lengthSq() < 1e-8) yAxis.set(0,1,0); else yAxis.normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, target).normalize();
  const y2 = new THREE.Vector3().crossVectors(target, xAxis).normalize();
  const m = new THREE.Matrix4().makeBasis(xAxis, y2, target);
  return new THREE.Quaternion().setFromRotationMatrix(m).invert();
}
let score=0, streak=0, locked=false, current=null;
let scene, camera, renderer, globeMesh, paintGroup, pendingGeo=null;
let spinSpeed=0.01, targetSpeed=0.01, hold=false, travel=null;
let pageR=null, pageS=null, pageC=null, pageM=null, pageG=null;
const qTmp = new THREE.Quaternion();
const canvas = document.getElementById('globe');
function initGlobe(){
  if (typeof THREE === 'undefined') return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32,1,0.1,80);
  camera.position.set(0,0,3.45);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0x000000,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
  new THREE.TextureLoader().load(EARTH, tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshPhongMaterial({ map: tex, shininess: 16 }));
    scene.add(globeMesh);
    if (pendingGeo) { const g = pendingGeo; pendingGeo = null; paintCountry(g); }
  });
  scene.add(new THREE.AmbientLight(0x667788, 1.05));
  const sun = new THREE.DirectionalLight(0xfff4dd, 2.2);
  sun.position.set(4,2,6); scene.add(sun);
  function resize(){
    const w = canvas.clientWidth || 320, h = canvas.clientHeight || 280;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);
  (function loop(){
    requestAnimationFrame(loop);
    spinSpeed += (targetSpeed - spinSpeed) * 0.06;
    if (globeMesh){
      if (travel){
        const u = Math.min(1, (performance.now() - travel.t0) / travel.dur);
        const e = u < 0.5 ? 4*u*u*u : 1 - Math.pow(-2*u+2,3)/2;
        qTmp.copy(travel.from).slerp(travel.to, e);
        globeMesh.quaternion.copy(qTmp);
        if (u >= 1){ globeMesh.quaternion.copy(travel.to); travel = null; hold = true; }
      } else if (!hold){
        globeMesh.rotateY(spinSpeed);
        globeMesh.quaternion.normalize();
      }
    }
    if (renderer) renderer.render(scene, camera);
    if (pageR && document.getElementById('page').classList.contains('open')){
      const cvs = document.getElementById('pageGlobe');
      if (cvs){
        const w = cvs.clientWidth, h = cvs.clientHeight || 220;
        pageR.setSize(w,h,false); pageC.aspect = w/Math.max(h,1); pageC.updateProjectionMatrix();
        pageR.render(pageS, pageC);
      }
    }
  })();
}
function paintCountry(geo){
  if (!globeMesh){ pendingGeo = geo; return; }
  if (paintGroup){ globeMesh.remove(paintGroup); paintGroup = null; }
  const g = new THREE.Group();
  const stroke = new THREE.LineBasicMaterial({ color: 0xffd45a });
  const feats = geo.type === 'FeatureCollection' ? geo.features : [geo];
  for (const f of feats){
    if (!f || !f.geometry) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    for (const poly of polys){
      const ring = poly && poly[0]; if (!ring || ring.length < 4) continue;
      g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la]) => latLonToVec(la,lo,1.016))), stroke));
    }
  }
  paintGroup = g; globeMesh.add(g);
}
function lookCountry(iso, mesh){
  if (!mesh) return;
  mesh.quaternion.copy(destQuat(iso));
}
function aimAt(iso){
  if (globeMesh){
    travel = { from: globeMesh.quaternion.clone(), to: destQuat(iso), t0: performance.now(), dur: 1400 };
    targetSpeed = 0; spinSpeed = 0; hold = false;
  }
  const code = ISO3[iso];
  if (!code) return;
  fetch('https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries/' + code + '.geo.json')
    .then(r => { if (!r.ok) throw 0; return r.json(); }).then(paintCountry).catch(() => {});
}
function startSpin(){
  hold = false; travel = null; targetSpeed = 0.22; locked = true;
  document.getElementById('opts').innerHTML = '';
  document.getElementById('result').textContent = '';
  document.getElementById('hint').textContent = 'Finding a country';
  document.getElementById('q').classList.add('hidden');
  document.getElementById('flag').classList.add('hidden');
  document.getElementById('infoBtn').classList.add('hidden');
  document.getElementById('spinBtn').disabled = true;
  if (paintGroup && globeMesh){ globeMesh.remove(paintGroup); paintGroup = null; }
  pendingGeo = null;
  setTimeout(() => { targetSpeed = 0.02; setTimeout(showRound, 500); }, 1300);
}
function showRound(){
  const pool = DATA.countries.filter(c => c.proverbs && c.proverbs.length);
  const c = pick(pool); const correct = pick(c.proverbs);
  const ch = shuffle([{ text: correct, ok: true, from: c.name, iso: c.iso }, ...others(c.name)]);
  current = { country: c, correct }; aimAt(c.iso);
  document.getElementById('country').textContent = c.name;
  const fl = document.getElementById('flag'); fl.src = FLAGL(c.iso); fl.classList.remove('hidden');
  document.getElementById('infoBtn').classList.remove('hidden');
  document.getElementById('hint').textContent = '';
  document.getElementById('q').classList.remove('hidden');
  const box = document.getElementById('opts'); box.innerHTML = '';
  ch.forEach(opt => {
    const b = document.createElement('button'); b.className = 'opt';
    b.innerHTML = '<span class="proverb"></span><span class="meta"><img alt=""/><span></span></span>';
    b.querySelector('.proverb').textContent = opt.text;
    b.querySelector('.meta img').src = FLAG(opt.iso);
    b.querySelector('.meta span').textContent = opt.from;
    b.onclick = () => answer(b, opt); box.appendChild(b);
  });
  locked = false; document.getElementById('spinBtn').disabled = false; document.getElementById('spinBtn').textContent = 'Next country';
}
function answer(btn, ch){
  if (locked) return; locked = true;
  [...document.getElementById('opts').children].forEach(el => {
    el.classList.add('revealed');
    if (el.querySelector('.proverb').textContent === current.correct) el.classList.add('correct');
  });
  if (ch.ok){ btn.classList.add('correct'); score += 10; streak++; document.getElementById('result').textContent = 'Correct. +10'; }
  else { btn.classList.add('wrong'); streak = 0; document.getElementById('result').textContent = 'Not this one. That proverb is from ' + ch.from + '.'; }
  document.getElementById('score').textContent = score; document.getElementById('streak').textContent = streak;
}
function openCountryPage(){
  if (!current || !current.country) return;
  const c = current.country; const info = INFO[c.iso] || { capital: '—', population: '—', language: '—' };
  document.getElementById('pageFlag').src = FLAGL(c.iso);
  document.getElementById('pageName').textContent = c.name;
  document.getElementById('pageCap').textContent = info.capital || info[0] || '—';
  document.getElementById('pagePop').textContent = info.population || info[1] || '—';
  document.getElementById('pageLang').textContent = info.language || info[2] || '—';
  document.getElementById('page').classList.add('open');
  const cvs = document.getElementById('pageGlobe');
  if (cvs && typeof THREE !== 'undefined'){
    if (!pageR){
      pageS = new THREE.Scene();
      pageC = new THREE.PerspectiveCamera(32,1,0.1,80); pageC.position.set(0,0,3.15);
      pageR = new THREE.WebGLRenderer({ canvas: cvs, antialias: true }); pageR.setClearColor(0x000000,1);
      if (pageR.outputColorSpace !== undefined) pageR.outputColorSpace = THREE.SRGBColorSpace;
      pageS.add(new THREE.AmbientLight(0x667788, 1.1));
      const sun = new THREE.DirectionalLight(0xfff4dd, 2.2); sun.position.set(4,2,6); pageS.add(sun);
      pageM = new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshPhongMaterial({ color: 0x1b3a5a }));
      pageS.add(pageM);
      new THREE.TextureLoader().load(EARTH, tex => { tex.colorSpace = THREE.SRGBColorSpace; pageM.material = new THREE.MeshPhongMaterial({ map: tex, shininess: 16 }); });
    }
    lookCountry(c.iso, pageM);
    if (pageG){ pageM.remove(pageG); pageG = null; }
    const code = ISO3[c.iso];
    if (code) fetch('https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries/' + code + '.geo.json').then(r => { if (!r.ok) throw 0; return r.json(); }).then(geo => {
      const g = new THREE.Group();
      const stroke = new THREE.LineBasicMaterial({ color: 0xffd45a });
      const feats = geo.type === 'FeatureCollection' ? geo.features : [geo];
      for (const f of feats){
        if (!f || !f.geometry) continue;
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
        for (const poly of polys){
          const ring = poly && poly[0]; if (!ring || ring.length < 4) continue;
          g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la]) => latLonToVec(la,lo,1.016))), stroke));
        }
      }
      pageG = g; pageM.add(g);
    }).catch(() => {});
  }
}
document.getElementById('spinBtn').onclick = startSpin;
document.getElementById('backBtn').onclick = () => document.getElementById('page').classList.remove('open');
document.getElementById('infoBtn').onclick = e => { e.stopPropagation(); openCountryPage(); };
document.getElementById('countryRow').onclick = openCountryPage;
Promise.all([
  fetch('c0.json?v=30'), fetch('c1.json?v=30'), fetch('c2.json?v=30'), fetch('c3.json?v=30'), fetch('meta.json?v=30')
].map(p => p.then(r => { if (!r.ok) throw 0; return r.json(); })))
  .then(([a,b,c,d,m]) => {
    DATA = { countries: [].concat(a,b,c,d) };
    INFO = m.info || {};
    CENT = m.cent || {};
    ISO3 = m.iso3 || {};
  })
  .catch(() => {
    DATA = { countries: [
      {name:'Japan',iso:'JP',proverbs:['Fall seven times and stand up eight.']},
      {name:'Turkey',iso:'TR',proverbs:['A cup of coffee commits one to forty years of friendship.']},
      {name:'USA',iso:'US',proverbs:['The early bird catches the worm.']},
      {name:'United Kingdom',iso:'GB',proverbs:['A stitch in time saves nine.']},
      {name:'Brazil',iso:'BR',proverbs:['A sleeping fox finds no meat.']},
      {name:'Egypt',iso:'EG',proverbs:['A beautiful thing is never perfect.']},
      {name:'India',iso:'IN',proverbs:['Learning is a treasure no thief can touch.']},
      {name:'Germany',iso:'DE',proverbs:['All beginnings are hard.']},
      {name:'Mexico',iso:'MX',proverbs:['Better late than never.']},
      {name:'Bolivia',iso:'BO',proverbs:['It is better to eat bread with love than fowl with grief.']}
    ]};
  })
  .finally(() => initGlobe());
