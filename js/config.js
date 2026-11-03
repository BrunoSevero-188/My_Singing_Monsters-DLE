// Chaves do localStorage (v2: o formato dos IDs mudou para números)
export const STORAGE_KEY = 'msmdle:v2';
export const SETTINGS_KEY = 'msmdle:settings';

// Fuso do "virar do dia": meia-noite de Brasília
export const SITE_TZ = 'America/Sao_Paulo';

// Dia nº 1 do site (ajuste para a data em que você publicou)
export const LAUNCH_DATE = '2026-11-02';

// Desfoque do "Ovo invertido". Com start: 0 só as cores são invertidas.
// Para voltar o desfoque progressivo, use por exemplo { start: 8, step: 0.7, min: 2 }
export const BLUR = { start: 0, step: 0.7, min: 0 };

// Base da wiki (usada nos links de "Ontem era" e "Respostas de ontem")
export const WIKI_BASE = 'https://mysingingmonsters.fandom.com';

// "Pesquisar mais": abre esta busca no navegador do usuário com "My Singing Monsters, <nome>"
export const SEARCH_URL = 'https://www.google.com/search?q=';
export const searchLink = (name) => SEARCH_URL + encodeURIComponent(`My Singing Monsters, ${name}`);

// Logo ao lado do nome do site
export const LOGO_URL = 'https://static.wikia.nocookie.net/mysingingmonsters/images/d/d9/MSM_Logo.png/revision/latest/scale-to-width-down/250?cb=20241114050213';
