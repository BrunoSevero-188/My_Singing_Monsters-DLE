// Lógica da Biblioteca (pokédex), sem DOM. Portada de PesquisarPokemon / ButtonandSelect / Usepokemon
// do projeto FlatlistPokedex, trocando os atributos do Pokémon pelos do monstro:
//   tipos -> elementos (e classe) · altura/peso/exp. -> versão/ano/classe · habilidades -> combinação · movimentos -> ilhas
import { parseVersion } from './compare.js';
import { label } from '../i18n.js';

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// 3 -> "003"
export const dexNumber = (id) => String(id).padStart(3, '0');

// ---------- cores (como POKEMON_COLORS) ----------
export const ELEMENT_COLORS = {
  plant: '#3f9a45', cold: '#5fb7e5', air: '#b58be0', water: '#2f7de1', earth: '#8a5a34',
  fire: '#e2571e', energy: '#e0b800', light: '#f3e08a', psychic: '#8e4fd0', faerie: '#e86fb5',
  bone: '#9a9a9a', plasma: '#1fb5a5', shadow: '#4b3f6b',
};
const FALLBACK = '#6b6591';
export const colorOf = (element) => ELEMENT_COLORS[String(element ?? '').toLowerCase()] ?? FALLBACK;

// Degradê do cartão: cor do 1º elemento -> cor do 2º (ou a mesma, se só tiver um)
export function gradientColors(m) {
  const [a, b] = m.elements ?? [];
  const c1 = colorOf(a);
  return [c1, b ? colorOf(b) : c1];
}

// ---------- pesquisa por campo + condição (como CampoPesquisa / operadoresPorCampo) ----------
const NUMERICOS = [
  { label: 'Igual', value: 'igual' },
  { label: 'Diferente', value: 'diferente' },
  { label: 'Maior', value: 'maior' },
  { label: 'Menor', value: 'menor' },
  { label: 'Maior ou igual', value: 'maior_igual' },
  { label: 'Menor ou igual', value: 'menor_igual' },
];
const TEXTO = [
  { label: 'Igual', value: 'igual' },
  { label: 'Diferente', value: 'diferente' },
  { label: 'Contém', value: 'contem' },
];

// numerico: compara com <, >, ... · lista: o monstro pode ter vários valores (elementos, ilhas...)
export const CAMPOS = [
  { value: 'nome', label: 'Nome', operadores: TEXTO },
  { value: 'id', label: 'Nº', operadores: NUMERICOS, numerico: true },
  { value: 'elemento', label: 'Elemento', operadores: TEXTO, lista: true },
  { value: 'classe', label: 'Classe', operadores: TEXTO, lista: true },
  { value: 'raridade', label: 'Raridade', operadores: TEXTO, lista: true },
  { value: 'ilha', label: 'Ilha', operadores: TEXTO, lista: true },
  { value: 'ano', label: 'Ano', operadores: NUMERICOS, numerico: true },
  { value: 'versao', label: 'Versão', operadores: NUMERICOS, numerico: true },
];

export const campoInfo = (valor) => CAMPOS.find((c) => c.value === valor) ?? CAMPOS[0];
export const operadoresDoCampo = (valor) => campoInfo(valor).operadores;

// Condição inicial de cada campo: "Contém" nos textos (achar por parte do nome) e "Igual" nos números
export const operadorPadrao = (valor) => {
  const ops = operadoresDoCampo(valor);
  return (ops.find((o) => o.value === 'contem') ?? ops[0]).value;
};

// Textos comparáveis de cada campo de lista. Elementos e classe valem pelo valor do JSON
// (inglês) e pela tradução exibida (ex.: "Water" e "Água").
function textosDoCampo(m, campo) {
  const [valores, kind] = {
    elemento: [m.elements ?? [], 'element'],
    classe: [[].concat(m.type ?? []), 'class'],
    raridade: [m.rarity ? [m.rarity] : [], 'rarity'],
    ilha: [m.islands ?? [], 'island'],
  }[campo];
  return valores.map((v) => [norm(v), norm(label(kind, v))]);
}

const compararNumeros = (op, a, b) => ({
  igual: a === b, diferente: a !== b, maior: a > b, menor: a < b, maior_igual: a >= b, menor_igual: a <= b,
}[op] ?? true);

function cmpVersao(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0, y = b[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function aplicarFiltro(monstros, campo, operador, termo) {
  const t = String(termo ?? '').trim();
  if (!t) return monstros;
  const nt = norm(t);

  return monstros.filter((m) => {
    if (campo === 'id' || campo === 'ano') {
      const alvo = Number(t);
      const valor = campo === 'id' ? m.id : m.year;
      if (Number.isNaN(alvo) || valor == null) return false;
      return compararNumeros(operador, valor, alvo);
    }

    if (campo === 'versao') {
      const alvo = parseVersion(t), valor = parseVersion(m.version);
      if (!alvo || !valor) return false;
      return compararNumeros(operador, cmpVersao(valor, alvo), 0);
    }

    if (campo === 'nome') {
      const nome = norm(m.name);
      return { igual: nome === nt, diferente: nome !== nt, contem: nome.includes(nt) }[operador] ?? true;
    }

    const textos = textosDoCampo(m, campo); // [[valor, traduzido], ...]
    const casa = (fn) => textos.some(([a, b]) => fn(a) || fn(b));
    if (operador === 'igual') return casa((x) => x === nt);
    if (operador === 'diferente') return !casa((x) => x === nt);
    if (operador === 'contem') return casa((x) => x.includes(nt));
    return true;
  });
}

// Botões "Filtrar por elemento" (como mostrarPorTipo). Sem elemento = todos.
export function filtrarPorElemento(monstros, elemento) {
  if (!elemento) return monstros;
  const e = elemento.toLowerCase();
  return monstros.filter((m) => (m.elements ?? []).some((x) => x.toLowerCase() === e));
}

export const comparador = (a, b) => a.id - b.id;

// Botões "Filtrar por raridade". Sem raridade = todas.
export function filtrarPorRaridade(monstros, raridade) {
  return raridade ? monstros.filter((m) => m.rarity === raridade) : monstros;
}

// Lista final: botões de elemento e de raridade + pesquisa, ordenada pelo número
export function listaFiltrada(todos, { campo = 'nome', operador = 'contem', texto = '', elemento = '', raridade = '' } = {}) {
  const base = filtrarPorRaridade(filtrarPorElemento(todos, elemento), raridade);
  return aplicarFiltro(base, campo, operador, texto).slice().sort(comparador);
}

// Elementos que existem no JSON (para os botões)
export function listaDeElementos(monstros) {
  const vistos = [];
  for (const m of [...monstros].sort(comparador)) {
    for (const e of m.elements ?? []) if (!vistos.some((v) => v.toLowerCase() === e.toLowerCase())) vistos.push(e);
  }
  return vistos;
}

// ---------- "Em números" (no lugar das estatísticas base) ----------
export function numeros(m, todos) {
  const ilhasNoJogo = new Set(todos.flatMap((x) => x.islands ?? [])).size || 1;
  const maxElementos = Math.max(5, ...todos.map((x) => (x.elements ?? []).length));
  return [
    { nome: 'Elementos', valor: (m.elements ?? []).length, max: maxElementos },
    { nome: 'Ilhas', valor: (m.islands ?? []).length, max: ilhasNoJogo },
  ];
}

// Acha o monstro citado numa combinação (por nome ou por ID)
export function acharMonstro(ref, todos) {
  if (typeof ref === 'number') return todos.find((m) => m.id === ref);
  const n = norm(ref);
  return todos.find((m) => norm(m.name) === n);
}
