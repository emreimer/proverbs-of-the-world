const I18N = {
  en: {
    brand: 'Proverbs of the World',
    quizTitle: 'Proverbs Quiz',
    score: 'Score',
    streak: 'Streak',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    appInfo: 'App Info',
    countryInfo: 'Country Info',
    spinHint: 'Spin to land on a country',
    finding: 'Finding a country',
    question: 'Which of these four proverbs is from this country?',
    spin: 'Spin the world',
    next: 'Next country',
    correct: 'Correct. +10',
    wrong: 'Not this one. That proverb is from {country}.',
    back: 'Back',
    population: 'Population',
    language: 'Official language',
    capital: 'Capital',
    million: 'million',
    billion: 'billion',
    appCopy: 'This quiz was made by the author of Proverbs of the World. The game uses proverbs from that book so you can guess which country a saying comes from.',
    authorBio: 'Emre Imer calls himself a citizen of the world. He was born in Turkey, spent part of his childhood in Germany, and lived in Czechia and Japan as an exchange student. He co-founded a company in Greece and later founded his own company in Estonia. He holds a bachelor’s degree in Mechanical Engineering and a master’s degree in Insurance, and works in international business development. As an author and editor he shares what he has learned across cultures.',
    bookSub: 'Over 2000 proverbs from 162 countries',
    buyBook: 'Buy the book on Amazon',
    langLabel: 'Language'
  },
  tr: {
    brand: 'Dünya Atasözleri',
    quizTitle: 'Atasözü Testi',
    score: 'Skor',
    streak: 'Seri',
    soundOn: 'Ses açık',
    soundOff: 'Ses kapalı',
    appInfo: 'Uygulama Bilgisi',
    countryInfo: 'Ülke Bilgisi',
    spinHint: 'Bir ülkede durması için dünyayı çevir',
    finding: 'Ülke aranıyor',
    question: 'Bu dört atasözünden hangisi bu ülkeye ait?',
    spin: 'Dünyayı çevir',
    next: 'Sonraki ülke',
    correct: 'Doğru. +10',
    wrong: 'Bu değil. Bu atasözü {country} ülkesine ait.',
    back: 'Geri',
    population: 'Nüfus',
    language: 'Resmi dil',
    capital: 'Başkent',
    million: 'milyon',
    billion: 'milyar',
    appCopy: 'Bu oyun, Dünya Atasözleri kitabının yazarı tarafından geliştirildi. Kitaptaki atasözlerini kullanarak sözün hangi ülkeden geldiğini tahmin ediyorsunuz.',
    authorBio: 'Emre Imer kendisini dünya vatandaşı olarak tanımlar. Türkiye’de doğdu, çocukluğunun bir dönemini Almanya’da geçirdi, Çekya ve Japonya’da değişim öğrencisi olarak yaşadı. Yunanistan’da bir şirketin kurucu ortaklarından oldu, ardından Estonya’da kendi şirketini kurdu. Makine Mühendisliği lisansının ve Sigortacılık yüksek lisansının ardından uluslararası iş geliştirme alanında çalışır. Yazar ve editör olarak kültürler arasında öğrendiklerini paylaşır.',
    bookSub: '162 ülkeden 2000’den fazla atasözü',
    buyBook: 'Kitabı Amazon’dan al',
    langLabel: 'Dil'
  }
};

const COUNTRY_TR = {
  AF:'Afganistan',AL:'Arnavutluk',DZ:'Cezayir',AO:'Angola',AR:'Arjantin',AM:'Ermenistan',
  AU:'Avustralya',AT:'Avusturya',AZ:'Azerbaycan',BS:'Bahamalar',BD:'Bangladeş',BE:'Belçika',
  BZ:'Belize',BJ:'Benin',BO:'Bolivya',BA:'Bosna-Hersek',BW:'Botsvana',BR:'Brezilya',
  BG:'Bulgaristan',BI:'Burundi',KH:'Kamboçya',CM:'Kamerun',CA:'Kanada',CL:'Şili',
  CO:'Kolombiya',CG:'Kongo',CR:'Kosta Rika',HR:'Hırvatistan',CU:'Küba',CZ:'Çekya',
  DK:'Danimarka',DO:'Dominik Cumhuriyeti',EC:'Ekvador',EG:'Mısır',SV:'El Salvador',EE:'Estonya',
  ET:'Etiyopya',FO:'Faroe Adaları',FI:'Finlandiya',FR:'Fransa',GM:'Gambiya',GE:'Gürcistan',
  DE:'Almanya',GH:'Gana',GR:'Yunanistan',GT:'Guatemala',GN:'Gine',HT:'Haiti',
  HN:'Honduras',HU:'Macaristan',IS:'İzlanda',IN:'Hindistan',ID:'Endonezya',IR:'İran',
  IQ:'Irak',IE:'İrlanda',IL:'İsrail',IT:'İtalya',CI:'Fildişi Sahili',JM:'Jamaika',
  JP:'Japonya',KE:'Kenya',KR:'Kore',LA:'Laos',LV:'Letonya',LB:'Lübnan',
  LR:'Liberya',LT:'Litvanya',LU:'Lüksemburg',MW:'Malavi',MY:'Malezya',ML:'Mali',
  MT:'Malta',MR:'Moritanya',MX:'Meksika',MN:'Moğolistan',ME:'Karadağ',MA:'Fas',
  MZ:'Mozambik',NA:'Namibya',NP:'Nepal',NI:'Nikaragua',NE:'Nijer',NG:'Nijerya',
  NO:'Norveç',OM:'Umman',PK:'Pakistan',PA:'Panama',PY:'Paraguay',PE:'Peru',
  PH:'Filipinler',PL:'Polonya',PT:'Portekiz',PR:'Porto Riko',RO:'Romanya',RU:'Rusya',
  RW:'Ruanda',WS:'Samoa',SN:'Senegal',RS:'Sırbistan',SL:'Sierra Leone',SG:'Singapur',
  SO:'Somali',ZA:'Güney Afrika',ES:'İspanya',SD:'Sudan',SE:'İsveç',CH:'İsviçre',
  SY:'Suriye',PF:'Tahiti',TH:'Tayland',TG:'Togo',TN:'Tunus',TR:'Türkiye',
  US:'ABD',UA:'Ukrayna',GB:'Birleşik Krallık',VN:'Vietnam',ZM:'Zambiya',ZW:'Zimbabve'
};
const COUNTRY_TR_BY_NAME = {
  Scotland:'İskoçya', Wales:'Galler', 'United Kingdom':'Birleşik Krallık', USA:'ABD',
  'Dominic Republic':'Dominik Cumhuriyeti', 'Puerto Rica':'Porto Riko', Somali:'Somali',
  Korea:'Kore', Tahiti:'Tahiti', Congo:'Kongo'
};

function detectLang(){
  const saved = localStorage.getItem('potw-lang');
  if (saved === 'tr' || saved === 'en') return saved;
  return 'tr';
}
let LANG = detectLang();
function t(key){ return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key; }
function countryLabel(c){
  if (LANG !== 'tr') return c.name;
  return COUNTRY_TR_BY_NAME[c.name] || COUNTRY_TR[c.iso] || c.name;
}
function proverbText(text){ return text; }
function setLang(next){
  LANG = next;
  localStorage.setItem('potw-lang', next);
  if (typeof applyI18n === 'function') applyI18n();
}
