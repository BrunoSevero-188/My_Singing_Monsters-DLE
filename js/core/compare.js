// Aceita "AAAA-MM-DD", "AAAA-MM" ou "AAAA"
function toTime(d) {
  if (!d) return NaN;
  const full = /^\d{4}$/.test(d) ? `${d}-01-01` : /^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d;
  return Date.parse(`${full}T12:00:00Z`);
}

// "AAAA-MM-DD" -> "DD/MM/AAAA"
export function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return d ? `${d}/${m}/${y}` : m ? `${m}/${y}` : y;
}

// Resultados: correct (verde) · partial (laranja) · wrong (vermelho)
//             higher / lower (vermelho + seta) · unknown (cinza)
// higher = o monstro do dia foi lançado DEPOIS do palpite (seta para cima)
// lower  = o monstro do dia foi lançado ANTES do palpite (seta para baixo)
export function compare(guess, answer, key) {
  if (key === 'name') return guess.id === answer.id ? 'correct' : 'wrong';

  if (key === 'releaseDate') {
    const g = toTime(guess.releaseDate);
    const a = toTime(answer.releaseDate);
    if (Number.isNaN(g) || Number.isNaN(a)) return 'unknown';
    return g === a ? 'correct' : a > g ? 'higher' : 'lower';
  }

  const A = [].concat(guess[key] ?? []);
  const B = [].concat(answer[key] ?? []);
  const common = A.filter((x) => B.includes(x)).length;
  if (common === A.length && common === B.length) return 'correct';
  return common > 0 ? 'partial' : 'wrong';
}

export const EMOJI = { correct: '🟩', partial: '🟧', wrong: '🟥', higher: '⬆️', lower: '⬇️', unknown: '⬜' };
