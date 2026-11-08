// "1.2.3" -> [1, 2, 3] · aceita prefixo "v" · inválido/vazio -> null
export function parseVersion(v) {
  if (v == null || String(v).trim() === '') return null;
  const parts = String(v).trim().replace(/^v/i, '').split('.')
    .map((n) => (/^\d+$/.test(n) ? parseInt(n, 10) : NaN));
  return parts.every((n) => !Number.isNaN(n)) ? parts : null;
}

// Compara versões número a número (1.10 vem depois de 1.9). Devolve -1, 0 ou 1
function cmpVersion(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0, y = b[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export const fmtVersion = (v) => (v ? String(v).replace(/^v/i, '') : '—');
export const fmtYear = (y) => (y == null ? '—' : String(y));

// Resultados: correct (verde) · partial (laranja) · wrong (vermelho)
//             higher / lower (vermelho + seta) · unknown (cinza)
// higher = o monstro do dia veio DEPOIS do palpite (seta para cima)
// lower  = o monstro do dia veio ANTES do palpite (seta para baixo)
export function compare(guess, answer, key) {
  if (key === 'name') return guess.id === answer.id ? 'correct' : 'wrong';

  if (key === 'rarity') {
    if (guess.rarity == null || answer.rarity == null || guess.rarity === '' || answer.rarity === '') return 'unknown';
    return guess.rarity === answer.rarity ? 'correct' : 'wrong';
  }

  if (key === 'version') {
    const g = parseVersion(guess.version), a = parseVersion(answer.version);
    if (!g || !a) return 'unknown';
    const c = cmpVersion(g, a);
    return c === 0 ? 'correct' : c < 0 ? 'higher' : 'lower';
  }

  if (key === 'year') {
    if (guess.year == null || answer.year == null) return 'unknown';
    const g = Number(guess.year), a = Number(answer.year);
    if (!Number.isFinite(g) || !Number.isFinite(a)) return 'unknown';
    return g === a ? 'correct' : a > g ? 'higher' : 'lower';
  }

  const A = [].concat(guess[key] ?? []);
  const B = [].concat(answer[key] ?? []);
  const common = A.filter((x) => B.includes(x)).length;
  if (common === A.length && common === B.length) return 'correct';
  return common > 0 ? 'partial' : 'wrong';
}

export const EMOJI = { correct: '🟩', partial: '🟧', wrong: '🟥', higher: '⬆️', lower: '⬇️', unknown: '⬜' };
