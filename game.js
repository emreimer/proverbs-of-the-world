let DATA = { countries: [] };
let INFO = {};
let CENT = {};
let ISO3 = {};
const EARTH = 'https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg';
const FLAG = i => 'https://flagcdn.com/w40/' + i.toLowerCase() + '.png';
const FLAGL = i => 'https://flagcdn.com/w160/' + i.toLowerCase() + '.png';
const pick = a => a[Math.floor(Math.random() * a.length)];
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function sayings(c){
  const pack = (typeof ORIG !== "undefined" && ORIG[LANG] && ORIG[LANG][c.iso]) || null;
  if (pack && pack.length) return pack;
  return c.proverbs || [];
}
function shown(line){ return proverbText(line); }
function others(country){
  const used = new Set();
  const correctLine = shown(country._correct);
  used.add(correctLine);
  const cs = shuffle(DATA.countries.filter(c => c.iso !== country.iso && sayings(c).length));
  const out = [];
  for (const c of cs){
    const options = shuffle(sayings(c)).filter(line => !used.has(shown(line)));
    if (!options.length) continue;
    const line = options[0];
    used.add(shown(line));
    out.push({ text: shown(line), from: countryLabel(c), iso: c.iso, ok: false });
    if (out.length === 3) break;
  }
  return out;
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
function fmtPop(n){
  if (typeof n !== 'number') return '—';
  if (n >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'') + ' ' + t('billion');
  if (n >= 1e6) return (n/1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/,'') + ' ' + t('million');
  return n.toLocaleString(LANG === 'tr' ? 'tr' : 'en');
}
const FALLBACK_INFO = {
  JP:{capital:'Tokyo',population:'123 million',language:'Japanese'},
  TR:{capital:'Ankara',population:'85 million',language:'Turkish'},
  US:{capital:'Washington, D.C.',population:'340 million',language:'English'},
  GB:{capital:'London',population:'68 million',language:'English'},
  BR:{capital:'Brasília',population:'216 million',language:'Portuguese'},
  EG:{capital:'Cairo',population:'116 million',language:'Arabic'},
  IN:{capital:'New Delhi',population:'1.4 billion',language:'Hindi, English'},
  DE:{capital:'Berlin',population:'84 million',language:'German'},
  MX:{capital:'Mexico City',population:'130 million',language:'Spanish'},
  BO:{capital:'Sucre',population:'12 million',language:'Spanish, Quechua, Aymara'},
  IL:{capital:'Jerusalem',population:'10 million',language:'Hebrew'}
};
const OFFICIAL_LANG = { IL: 'Hebrew' };
function officialLang(iso, raw){
  if (OFFICIAL_LANG[iso]) return OFFICIAL_LANG[iso];
  return raw || '—';
}
function placeLine(row, role){
  const name = capitalName(row.name);
  const titled = role ? name + " (" + role + ")" : name;
  if (!row.pop) return titled;
  const year = LANG === "ja" ? "（" + row.year + "年）" : "(" + row.year + ")";
  return titled + " — " + localizeFact(row.pop) + " " + year;
}
function fillFacts(iso){
  const box = document.getElementById("facts");
  if (!box) return;
  const info = (typeof FACTS !== "undefined" && FACTS[iso]) || null;
  const c = current && current.country;
  const name = c ? countryLabel(c) : "";
  if (!info){ box.innerHTML = ""; return; }
  const cities = []
    .concat((info.capitals || []).map(row => placeLine(row, t("capitalTag"))))
    .concat((info.cities || []).map(row => placeLine(row)));
  const blocks = [
    [t("population"), localizeFact(info.population || "")],
    [t("language"), info.language ? localizeFact(info.language) : t("noOfficial")],
    [t("cities"), cities.join("\n")]
  ];
  box.innerHTML = blocks.map(([k,v]) => '<div class="fact"><span>' + k + '</span><b>' + String(v).replace(/\n/g, "<br>") + '</b></div>').join("");
}
function applyInfo(info, iso){ fillFacts(iso); }
function loadInfo(iso){ fillFacts(iso); return Promise.resolve(FACTS[iso] || {}); }
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
  document.getElementById('hint').textContent = t('finding');
  document.getElementById('country').textContent = '…';
  document.getElementById('q').classList.add('hidden');
  document.getElementById('flag').classList.add('hidden');
  document.getElementById('infoBtn').classList.add('hidden');
  const dictBox = document.getElementById('dictBox'); if (dictBox) dictBox.classList.add('hidden');
  dictOpen = false;
  if (typeof renderDict === 'function') renderDict();
  document.getElementById('spinBtn').disabled = true;
  if (paintGroup && globeMesh){ globeMesh.remove(paintGroup); paintGroup = null; }
  pendingGeo = null;
  setTimeout(() => { targetSpeed = 0.02; setTimeout(showRound, 500); }, 1300);
}
function showRound(force){
  const pool = DATA.countries.filter(c => sayings(c).length);
  const c = force || pick(pool);
  const correct = pick(sayings(c));
  c._correct = correct;
  const ch = shuffle([{ text: shown(correct), ok: true, from: countryLabel(c), iso: c.iso }, ...others(c)]);
  current = { country: c, correct: shown(correct), lines: ch.map(x => x.text) }; aimAt(c.iso);
  const dictBox = document.getElementById('dictBox'); if (dictBox) dictBox.classList.remove('hidden'); if (typeof renderDict === 'function') renderDict();
  document.getElementById('country').textContent = countryLabel(c);
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
  if (typeof paintReadings === "function") paintReadings();
  locked = false; document.getElementById('spinBtn').disabled = false; document.getElementById('spinBtn').textContent = t('next');
}
function answer(btn, ch){
  if (locked) return; locked = true;
  [...document.getElementById('opts').children].forEach(el => {
    el.classList.add('revealed');
    if (el.querySelector('.proverb').textContent === current.correct) el.classList.add('correct');
  });
  if (ch.ok){ btn.classList.add('correct'); score += 10; streak++; document.getElementById('result').textContent = t('correct'); }
  else { btn.classList.add('wrong'); streak = 0; var origin = (LANG === 'tr' && typeof trAblative === 'function') ? trAblative(ch.from) : (typeof proverbOrigin === 'function' ? proverbOrigin(ch.iso, ch.from) : ch.from); document.getElementById('result').textContent = t('wrong').replace('{country}', origin); }
  document.getElementById('score').textContent = score; document.getElementById('streak').textContent = streak;
}
function openCountryPage(){
  if (!current || !current.country) return;
  const c = current.country;
  document.getElementById('pageFlag').src = FLAGL(c.iso);
  document.getElementById('pageName').textContent = countryLabel(c);
  applyInfo(INFO[c.iso] || FALLBACK_INFO[c.iso] || { capital:'…', population:'…', language:'…' }, c.iso);
  loadInfo(c.iso).then(info => applyInfo(info, c.iso));
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
function applyI18n(){
  document.documentElement.lang = LANG;
  const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  set('brand','brand');
  set('scoreLbl','score');
  set('streakLbl','streak');
  set('appBtn','appInfo');
  set('infoBtn','countryInfo');
  set('q','question');
  set('appTitle','appInfo');
  set('appCopy','appCopy');
  set('authorBio','authorBio');
  set('bookSub','bookSub');
  set('buyBook','buyBook');
  set('backBtn','back');
  set('appBack','back');
  if (current) fillFacts(current.country.iso);
  if (typeof renderDict === 'function') renderDict();
  const hint = document.getElementById('hint');
  if (hint && !current) hint.textContent = t('spinHint');
  const spin = document.getElementById('spinBtn');
  if (spin) spin.textContent = current ? t('next') : t('spin');
  const country = document.getElementById('country');
  if (country && current) country.textContent = countryLabel(current.country);
  else if (country && country.textContent !== '…') country.textContent = t('quizTitle');
  if (typeof window.syncMuteLabel === "function") window.syncMuteLabel();
  else {
    const mute = document.getElementById('muteBtn');
    if (mute) mute.textContent = (window.SOUND_MUTED ? t('soundOff') : t('soundOn'));
  }
  const sel = document.getElementById('langSel');
  if (sel) sel.value = LANG;
  if (typeof syncStudentBtn === "function") syncStudentBtn();
}
document.getElementById('spinBtn').onclick = startSpin;
document.getElementById('backBtn').onclick = () => document.getElementById('page').classList.remove('open');
document.getElementById('infoBtn').onclick = e => { e.stopPropagation(); openCountryPage(); };
document.getElementById('countryRow').onclick = openCountryPage;
const V = "68";
function loadJson(path){
  return fetch(path + "?v=" + V).then(r => { if (!r.ok) throw 0; return r.json(); });
}
const DICT_LOADED = {};
function loadDict(lang){
  if (!lang) return Promise.resolve();
  if (DICT_LOADED[lang]) return DICT_LOADED[lang];
  const job = loadJson("data/dict-" + lang + ".json").then(table => {
    DICT_ENTRIES[lang] = table || {};
    if (typeof renderDict === "function") renderDict();
  }).catch(() => { delete DICT_LOADED[lang]; });
  DICT_LOADED[lang] = job;
  return job;
}
function ensureLang(lang){
  if (!lang) return Promise.resolve();
  const jobs = [loadDict(lang)];
  if (lang !== "en") {
    if (!MAPS[lang]) jobs.push(loadJson("data/map-" + lang + ".json").then(d => { MAPS[lang] = d; }));
    if (!BGS[lang]) jobs.push(loadJson("data/bg-" + lang + ".json").then(d => { BGS[lang] = d; }).catch(() => { BGS[lang] = {}; }));
  }
  return Promise.all(jobs);
}
window.onLangChange = function(next){
  ensureLang(next).then(() => {
    applyI18n();
    if (current) showRound(current.country);
  });
};
let DICT_ENTRIES = {};
let JA_ROMAJI = {};
let JA_READ = {};
let dictTo = "en";
let dictOpen = false;
let student = false;
try { student = localStorage.getItem("potw-student") === "1"; } catch (e) {}
const POSL = {
  en:{n:"n.",v:"v.",a:"adj.",d:"adv.",p:"prep."},
  tr:{n:"i.",v:"f.",a:"sf.",d:"zf.",p:"edat"},
  ja:{n:"名",v:"動",a:"形",d:"副",p:"助"},
  es:{n:"s.",v:"v.",a:"adj.",d:"adv.",p:"prep."},
  fr:{n:"n.",v:"v.",a:"adj.",d:"adv.",p:"prép."},
  de:{n:"n.",v:"v.",a:"adj.",d:"adv.",p:"Präp."},
  it:{n:"s.",v:"v.",a:"agg.",d:"avv.",p:"prep."},
  ko:{n:"명",v:"동",a:"형",d:"부",p:"조"},
  ru:{n:"сущ.",v:"гл.",a:"прил.",d:"нар.",p:"предл."},
  el:{n:"ουσ.",v:"ρ.",a:"επίθ.",d:"επίρ.",p:"πρόθ."},
  pt:{n:"s.",v:"v.",a:"adj.",d:"adv.",p:"prep."}
};
function esc(s){ return String(s).replace(/&/g,"&").replace(/</g,"<"); }
function dictGroups(){
  const table = (DICT_ENTRIES && DICT_ENTRIES[LANG]) || {};
  const lines = (current && current.lines) || [];
  const groups = [];
  for (let i = 0; i < lines.length; i++){
    const seen = {};
    const items = [];
    const list = table[lines[i]] || [];
    for (let j = 0; j < list.length; j++){
      const e = list[j];
      if (e && e.l && !seen[e.l]){ seen[e.l] = 1; items.push(e); }
    }
    if (items.length) groups.push({ line: lines[i], items: items });
  }
  return groups;
}
function lineReading(text){
  if (LANG === "ko") {
    if (!/[\uac00-\ud7a3]/.test(text) || typeof koreanRomanize !== "function") return "";
    return koreanRomanize(text).replace(/[A-Za-z]/, function (ch) { return ch.toUpperCase(); });
  }
  if (LANG === "ja") return JA_READ[text] || "";
  return "";
}
function syncStudentBtn(){
  const b = document.getElementById("studentBtn");
  if (!b) return;
  const show = LANG === "ja" || LANG === "ko";
  b.classList.toggle("hidden", !show);
  b.classList.toggle("on", !!student);
  b.textContent = "Latin transliteration";
  b.setAttribute("aria-pressed", student ? "true" : "false");
}
function paintReadings(){
  const box = document.getElementById("opts");
  if (!box) return;
  Array.prototype.forEach.call(box.children, function (el) {
    const proverb = el.querySelector(".proverb");
    if (!proverb) return;
    let read = el.querySelector(".read");
    const text = (LANG === "ja" || LANG === "ko") && student ? lineReading(proverb.textContent || "") : "";
    if (!text) { if (read) read.remove(); return; }
    if (!read) {
      read = document.createElement("span");
      read.className = "read";
      proverb.after(read);
    }
    read.textContent = text;
  });
}
function withRoma(text, kind){
  let r = "";
  if (kind === "ja") r = JA_ROMAJI[text] || "";
  else if (kind === "ko" && typeof hangulReading === "function") r = hangulReading(text);
  return esc(text) + (r ? ' <span class="roma">(' + esc(r) + ")</span>" : "");
}
function renderDict(){
  const btn = document.getElementById("dictBtn");
  if (btn) btn.textContent = t("dict");
  const sel = document.getElementById("dictSel");
  const names = {de:"Deutsch",en:"English",es:"Español",fr:"Français",it:"Italiano",pt:"Português",tr:"Türkçe",el:"Ελληνικά",ru:"Русский",ko:"한국어",ja:"日本語"};
  if (sel && document.activeElement !== sel){
    if (dictTo === LANG) dictTo = LANG === "en" ? "tr" : "en";
    sel.innerHTML = "";
    Object.keys(names).forEach(id => {
      if (id === LANG) return;
      const o = document.createElement("option");
      o.value = id; o.textContent = names[id];
      sel.appendChild(o);
    });
    sel.value = dictTo;
  }
  const list = document.getElementById("dictList");
  if (!list) return;
  list.classList.toggle("hidden", !dictOpen);
  const target = dictTo === LANG ? (LANG === "en" ? "tr" : "en") : dictTo;
  const labels = POSL[LANG] || POSL.en;
  list.innerHTML = dictGroups().map(group => {
    const words = group.items.map(e => {
      const word = (e.g && e.g[target]) || "—";
      const pos = labels[e.p] || "";
      return "<li><b>" + withRoma(e.l, LANG === "ja" ? "ja" : LANG === "ko" ? "ko" : "") + "</b> <span>" + esc(pos) + " — " + withRoma(word, target === "ja" ? "ja" : target === "ko" ? "ko" : "") + "</span></li>";
    }).join("");
    return '<li class="dict-group"><p class="dict-proverb">' + esc(group.line) + "</p><ul>" + words + "</ul></li>";
  }).join("");
}
Promise.all([
  loadJson("data/countries.json"),
  loadJson("data/meta.json"),
  loadJson("data/factbook.json"),
  loadJson("data/originals.json"),
  loadJson("data/ja-romaji.json").catch(() => ({})),
  loadJson("data/ja-readings.json").catch(() => ({}))
]).then(([countries, meta, facts, originals, jaRomaji, jaRead]) => {
  DATA = { countries };
  CENT = meta.cent || {};
  ISO3 = meta.iso3 || {};
  FACTS = facts || {};
  ORIG = originals || {};
  JA_ROMAJI = jaRomaji || {};
  JA_READ = jaRead || {};
  return ensureLang(LANG);
}).catch(() => {
  DATA = { countries: [] };
}).finally(() => {
  initGlobe();
  applyI18n();
  const sel = document.getElementById("langSel");
  if (sel){
    sel.innerHTML = "";
    [["de","Deutsch"],["en","English"],["es","Español"],["fr","Français"],["it","Italiano"],["pt","Português"],["tr","Türkçe"],["el","Ελληνικά"],["ru","Русский"],["ko","한국어"],["ja","日本語"]].forEach(([id,name]) => {
      const o = document.createElement("option");
      o.value = id; o.textContent = name; sel.appendChild(o);
    });
    sel.value = LANG;
    sel.onchange = () => setLang(sel.value);
  }
  const dictBtn = document.getElementById("dictBtn");
  if (dictBtn) dictBtn.onclick = () => { dictOpen = !dictOpen; renderDict(); };
  const dictSel = document.getElementById("dictSel");
  if (dictSel) dictSel.onchange = () => { dictTo = dictSel.value; renderDict(); };
  const studentBtn = document.getElementById("studentBtn");
  if (studentBtn) studentBtn.onclick = () => {
    student = !student;
    try { localStorage.setItem("potw-student", student ? "1" : "0"); } catch (e) {}
    syncStudentBtn();
    paintReadings();
  };
  syncStudentBtn();
  renderDict();
});
