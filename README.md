# MSMdle

Desafios diários de **My Singing Monsters**, feitos por brasileiros e em português do Brasil.
Projeto de fã, sem vínculo com a Big Blue Bubble. Os nomes e a arte dos monstros pertencem a ela.

## Como rodar

Requer Node 18+ (só para os comandos de apoio; o site em si é HTML, CSS e JS puros).

```bash
npm run dev      # servidor local (módulos ES não abrem com duplo clique)
npm run migrar   # converte o seu data/monsters.json para o formato atual (faz backup antes)
npm run check    # confere módulos, data/monsters.json e arquivos locais
npm test         # testes das regras (cores, setas, dicas, combinação, sorteio por ID, JSON)
```

## O arquivo de monstros: `data/monsters.json`

É a única fonte de dados do jogo. Uma lista, um objeto por monstro:

```json
{
  "id": 3,
  "nome": "Noggin",
  "ilhas": ["Plant Island", "Air Island"],
  "classe": "Natural",
  "elementos": ["Earth"],
  "versao": "1.0.0",
  "ano": 2012,
  "icone": "https://exemplo.com/noggin-icone.png",
  "gif": "https://exemplo.com/noggin.gif",
  "ovo": "https://exemplo.com/noggin-ovo.png",
  "combinacao": [["Mammott", "Tweedle"], ["Potbelly", "Toe Jammer"]]
}
```

(Os valores de `versao`, `ano` e os links acima são só um exemplo de formato.)

| Campo | O que é |
|---|---|
| `id` | Número inteiro, único, maior que 0. Usado no sorteio do monstro do dia |
| `nome` | Nome do monstro |
| `ilhas` | Lista das ilhas onde o monstro vive |
| `classe` | Classe do monstro (ex.: `Natural`) |
| `elementos` | Lista dos elementos (ex.: `["Air", "Plant"]`) |
| `versao` | Versão do jogo em que o monstro foi lançado (ex.: `"1.2.0"`). `null` se não souber |
| `ano` | Ano em que foi lançado (ex.: `2012`). `null` se não souber |
| `icone` | **URL** do ícone: aparece na célula "Monstro" da tabela e nos outros modos |
| `gif` | **URL** do gif: aparece quando o jogador **acerta** o monstro do dia. Sem gif, mostra o ícone |
| `ovo` | **URL** da imagem do ovo: usada no modo **Ovo invertido**. Só monstros com `ovo` entram nesse modo |
| `combinacao` | Como obter o monstro (veja abaixo) |

`icone`, `gif` e `ovo` recebem uma URL cada (`https://...`). Caminhos do projeto (`assets/noggin.png`) também funcionam.
Links de terceiros podem sair do ar, e no Ovo invertido o navegador pode bloquear a leitura da imagem de outro
site (CORS). Nesse caso o jogo usa o link direto, e o nome do arquivo pode aparecer no código da página.

### `combinacao`

| Valor | Resultado na dica |
|---|---|
| `[["Noggin", "Mammott"], ["Tweedle", "Potbelly"]]` | `[(Noggin) + (Mammott)]` e `[(Tweedle) + (Potbelly)]` (mostra até 2). Dá para usar IDs no lugar dos nomes: `[[1, 2]]` |
| `[]` ou `"Comprado"` | `[(Comprado)]`: só dá para obter comprando |
| ausente ou `null` | "A combinação deste monstro ainda não foi cadastrada." |

Use dois monstros **diferentes** em cada combinação. O `npm run check` avisa se citar um monstro que não existe no JSON.

Os valores de `ilhas`, `classe` e `elementos` ficam em inglês, como na wiki. A tradução para **exibição**
é feita em `js/i18n.js` (hoje: elementos e a classe Natural). O que não estiver lá aparece como no JSON.

### Como o monstro do dia é escolhido

O sorteio usa o `id` (arquivo `js/core/daily.js`):

1. lê o JSON e junta todos os IDs;
2. conta quantos monstros existem;
3. sorteia, de forma fixa para a data (fuso de Brasília), um desses IDs.

Todo mundo recebe o mesmo monstro no mesmo dia, e cada modo tem o seu.
Como a conta usa o total de monstros, **adicionar ou remover monstros muda a resposta do dia**.
Prefira atualizar o JSON logo após a virada do dia.

## Modo "Monstro do dia"

| Coluna | Como aparece |
|---|---|
| Monstro | Mostra o **ícone**, com borda **verde** (certo) ou **vermelha** (errado). O nome aparece ao passar o mouse (ou tocar) |
| Ilhas / Classe / Elementos | Verde = certo · laranja = quase (algumas em comum) · vermelho = errado |
| Versão / Ano | Verde = igual · vermelho = errado, com seta grande ao fundo: **↑** o monstro do dia veio **depois** · **↓** veio **antes** |

As versões são comparadas número a número (`1.10` vem depois de `1.9`). Sem versão ou ano no palpite ou na
resposta, a célula fica cinza, sem seta.

**Dicas** (em `js/core/clue-defs.js`, mude os números em `after`):

- depois de **5** tentativas: a quantidade de elementos que o monstro tem;
- depois de **10** tentativas: até 2 combinações para obtê-lo, ou `[(Comprado)]`.

**Ao acertar:** aparece o `gif` do monstro e o botão **Pesquisar mais**, que abre no navegador do usuário a busca
`My Singing Monsters, <nome do monstro>` (o buscador está em `SEARCH_URL`, `js/config.js`).

## Modo "Ovo invertido"

Mostra o `ovo` do monstro com as cores invertidas, e o jogador adivinha de qual monstro ele é. Dicas: elementos (5 tentativas)
e classe (8). Para voltar a embaçar o ovo aos poucos, ajuste `BLUR` em `js/config.js` (ex.: `{ start: 8, step: 0.7, min: 2 }`).

## Dica de Jogo (botão "?")

O botão **?** no canto esquerdo do topo abre a explicação de como jogar. Os textos ficam em `js/ui/how-to.js`
(hoje só o modo clássico). Para incluir outro modo, adicione um item à lista `HOW_TO`.

## Logo

O logo ao lado do nome do site vem de `LOGO_URL` (`js/config.js`) e é exibido em `index.html`. É a marca da
Big Blue Bubble, carregada direto da wiki.

## Estrutura

```
index.html
css/style.css
data/monsters.json         # os monstros (edite aqui)
data/monsters.exemplo.json # ponto de partida (31 Naturais, campos novos vazios)
js/
  app.js                   # carrega tudo, navega entre os modos e mostra erros na tela
  config.js                # fuso, dia nº 1, buscador, logo, desfoque
  i18n.js                  # tradução de exibição
  core/                    # sorteio por ID, comparação, dicas, storage, autocomplete, base dos modos
  data/monsters.js         # lê o JSON (português) e converte para o formato interno
  modes/                   # um arquivo por desafio + registro em index.js
  ui/                      # faixa dos brasileiros, tela inicial, infobox, dicas, "?" (Dica de Jogo)
scripts/check.mjs          # validação antes de publicar
scripts/migrar-json.mjs    # converte o JSON antigo para o formato atual
tests/                     # node:test
```

## Como adicionar um modo novo

1. Crie `js/modes/meu-modo.js` exportando `{ id, label, description, render(root) }`.
2. Coloque-o no array `MODES` de `js/modes/index.js`.
3. Para múltipla escolha, use `createChoiceMode` (veja `js/modes/index.js`).
4. Para explicar o modo no "?", acrescente-o em `js/ui/how-to.js`.

## Publicação

Todos os caminhos são relativos, então funciona em `usuario.github.io/repositorio/` e na Vercel.
Lembre de commitar `data/`.

## Atualizando de uma versão anterior

1. Extraia o zip por cima do projeto. **O seu `data/monsters.json` não é sobrescrito** (o zip só traz o exemplo).
2. Rode `npm run migrar`: `data`/`lancamento` viram `ano` (só o ano), `imagem` vira `icone`, entram `gif`, `ovo`
   e `combinacao` vazios, e o que mais você tiver no JSON é mantido. A cópia de segurança fica em `data/monsters.backup.json`.
3. Preencha `versao`, `ano`, `icone`, `gif`, `ovo` e `combinacao` e rode `npm run check`.
4. O modo "Monstro invertido" virou **Ovo invertido** (id novo): as estatísticas do modo antigo não são aproveitadas.
5. Apague o que não é mais usado: `js/modes/inverted.js`, `scripts/sync-wiki.mjs`, `scripts/ping-wiki.mjs`,
   `scripts/make-schedule.mjs`, `scripts/check-imports.mjs`, a pasta `scripts/lib/`, `data/schedule.json`,
   `data/meta.json` e `js/ui/data-panel.js`. **Não rode `npm run sync`**: ele sobrescreveria o seu `data/monsters.json`.

## Créditos

Dados e imagens: [My Singing Monsters Wiki](https://mysingingmonsters.fandom.com) (Fandom). Texto sob CC-BY-SA.
