const CHO = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const VOW = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
/** Coda after sandhi. Compounds that never resyllabified use the pronounced coda. */
const JONG = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];

const SPLIT = {
  3: [1, 9],
  5: [4, 12],
  6: [4, 18],
  9: [8, 0],
  10: [8, 6],
  11: [8, 7],
  12: [8, 9],
  13: [8, 16],
  14: [8, 17],
  15: [8, 18],
  18: [17, 9],
};

const TO_CHO = [-1, 0, 1, -1, 2, -1, -1, 3, 5, -1, -1, -1, -1, -1, -1, -1, 6, 7, -1, 9, 10, -1, 12, 14, 15, 16, 17, 18];

const NASAL = {
  1: 21,
  2: 21,
  3: 21,
  9: 21,
  24: 21,
  5: 4,
  7: 4,
  19: 4,
  20: 4,
  22: 4,
  23: 4,
  25: 4,
  27: 4,
  11: 16,
  14: 16,
  17: 16,
  18: 16,
  26: 16,
};

const ASP_NEXT = { 0: 15, 3: 16, 7: 17, 12: 14 };
const ASP_FROM = {
  1: 15,
  2: 15,
  3: 15,
  7: 16,
  9: 15,
  17: 17,
  18: 17,
  19: 16,
  20: 16,
  22: 16,
  23: 16,
  24: 15,
  25: 16,
  26: 17,
  27: 18,
};

function isSyl(x) {
  return typeof x !== "string";
}

function sandhi(a, b) {
  if (!a.jong) return;
  if (a.cho === 7 && a.jung === 0 && a.jong === 11 && b.cho !== 11) a.jong = 17;

  if (a.jong === 27 || a.jong === 6 || a.jong === 15) {
    const asp = ASP_NEXT[b.cho];
    if (asp !== undefined) {
      b.cho = asp;
      a.jong = a.jong === 6 ? 4 : a.jong === 15 ? 8 : 0;
    } else if (b.cho === 11) {
      a.jong = a.jong === 6 ? 4 : a.jong === 15 ? 8 : 0;
    }
  } else if (b.cho === 18 && ASP_FROM[a.jong] !== undefined) {
    b.cho = ASP_FROM[a.jong];
    a.jong = 0;
  }

  if (!a.jong) return;

  if (b.cho === 11 && a.jong !== 21) {
    const split = SPLIT[a.jong];
    let moved = false;
    if (split) {
      a.jong = split[0];
      b.cho = split[1];
      moved = true;
    } else if (TO_CHO[a.jong] !== undefined && TO_CHO[a.jong] >=  0) {
      b.cho = TO_CHO[a.jong];
      a.jong = 0;
      moved = true;
    }
    if (moved && b.jung === 20 && (b.cho === 3 || b.cho === 16)) b.cho = b.cho === 3 ? 12 : 14;
    return;
  }

  if (a.jong === 4 && b.cho === 5) {
    a.jong = 8;
    return;
  }
  if ((a.jong === 8 || a.jong === 15) && b.cho === 2) {
    b.cho = 5;
    if (a.jong === 15) a.jong = 8;
    return;
  }
  if (b.cho === 5 && a.jong !== 8) {
    b.cho = 2;
    if (NASAL[a.jong] !== undefined) a.jong = NASAL[a.jong];
    return;
  }
  if ((b.cho === 2 || b.cho === 6) && NASAL[a.jong] !== undefined) a.jong = NASAL[a.jong];
}

/** Revised Romanization, with liaison, aspiration, nasalization, and ㄹ changes. */
function koreanRomanize(text) {
  const tokens = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      const jong = i % 28;
      const jung = Math.floor(i / 28) % 21;
      const cho = Math.floor(i / 588);
      tokens.push({ cho, jung, jong });
    } else tokens.push(ch);
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (isSyl(a) && isSyl(b)) sandhi(a, b);
  }
  let out = "";
  let prevJong = -1;
  for (const t of tokens) {
    if (!isSyl(t)) {
      out += t;
      if (/\s|[.,!?…~]/.test(t)) prevJong = -1;
      continue;
    }
    const onset = t.cho === 5 && prevJong === 8 ? "l" : CHO[t.cho];
    out += onset + VOW[t.jung] + (t.jong ? JONG[t.jong] : "");
    prevJong = t.jong;
  }
  return out;
}


function hangulReading(text) {
  if (!text || !/[\uac00-\ud7a3]/.test(text)) return "";
  return koreanRomanize(text);
}
