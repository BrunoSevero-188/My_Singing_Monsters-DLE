# MSMdle

Desafios diários de **My Singing Monsters**, feitos por brasileiros e em português do Brasil.
Projeto de fã, sem vínculo com a Big Blue Bubble. Os nomes e a arte dos monstros pertencem a ela.

## Como rodar

Requer Node 18+ (só para os comandos de apoio; o site em si é HTML, CSS e JS puros).

```bash
npm run dev      # servidor local (módulos ES não abrem com duplo clique)
npm run migrar   # converte o seu data/monsters.json para o formato novo (faz backup antes)
npm run check    # confere módulos, data/monsters.json, ícones e gifs
npm test         # testes das regras (cores, setas, sorteio por ID, leitura do JSON)
```

## O arquivo de monstros: `data/monsters.json`

É a única fonte de dados do jogo. Uma lista, um objeto por monstro:

```json
{
  "id": 3,
  "nome": "Noggin",
  "ilhas": ["Plant Island", "Air Island", "Water Island"],
  "classe": "Natural",
  "elementos": ["Earth"],
  "versao": "1.0.0",
  "data": 2012,
  "icone": "assets/monsters/noggin.png",
  "gif": "assets/monsters/noggin.gif"
}
```

(Os valores de `versao` e `data` acima são só um exemplo de formato.)

| Campo | O que é |
|---|---|
| `id` | Número inteiro, único, maior que 0. Usado no sorteio do monstro do dia |
| `nome` | Nome do monstro |
| `ilhas` | Lista das ilhas onde o monstro vive |
| `classe` | Classe do monstro (ex.: `Natural`) |
| `elementos` | Lista dos elementos (ex.: `["Air", "Plant"]`) |
| `versao` | Versão do jogo em que o monstro foi lançado (ex.: `"1.2.0"`). `null` se não souber |
| `data` | Ano em que foi lançado (ex.: `2012`). `null` se não souber |
| `icone` | Link ou caminho do **ícone**: aparece na célula "Monstro" da tabela e nos outros modos |
| `gif` | Link ou caminho do **gif**: aparece quando o jogador **acerta** o monstro do dia. Sem gif, mostra o ícone |

`icone` e `gif` aceitam caminhos do projeto (`assets/monsters/noggin.gif`) ou links (`https://...`).
Prefira hospedar no próprio site: links de terceiros podem sair do ar, e no modo "Monstro invertido"
o navegador pode bloquear a leitura da imagem de outro site (CORS). Nesse caso o jogo usa o link
direto, e o nome do arquivo pode aparecer no código da página.
Sem `icone`, o jogo procura `assets/monsters/<nome-em-minúsculas>.png` (`Toe Jammer` → `toe-jammer.png`).

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

## Regras do modo "Monstro do dia"

| Coluna | Como aparece |
|---|---|
| Monstro | Ícone com borda **verde** (certo) ou **vermelha** (errado). O gif aparece ao acertar |
| Ilhas | Verde = certo · laranja = quase (algumas em comum) · vermelho = errado |
| Classe | Verde = certo · laranja = quase · vermelho = errado |
| Elementos | Verde = certo · laranja = quase · vermelho = errado |
| Versão | Verde = mesma versão · vermelho = errado, com seta grande ao fundo |
| Data (ano) | Verde = mesmo ano · vermelho = errado, com seta grande ao fundo |

Setas de Versão e Data: **↑** = o monstro do dia veio **depois** do palpite · **↓** = veio **antes**.
As versões são comparadas número a número (`1.10` vem depois de `1.9`). Sem versão ou ano no palpite ou na
resposta, a célula fica cinza, sem seta.

## Estrutura

```
index.html
css/style.css
data/monsters.json        # os monstros (edite aqui)
data/monsters.exemplo.json# ponto de partida (31 Naturais, versao/data/gif vazios)
assets/monsters/          # ícones e gifs
js/
  app.js                  # carrega tudo, navega entre os modos e mostra erros na tela
  config.js               # fuso, dia nº 1, chaves de armazenamento
  i18n.js                 # tradução de exibição
  core/                   # sorteio por ID, comparação, storage, autocomplete, base dos modos
  data/monsters.js        # lê o JSON (português) e converte para o formato interno
  modes/                  # um arquivo por desafio + registro em index.js
  ui/                     # faixa dos brasileiros, tela inicial, infobox, dicas, estatísticas
scripts/check.mjs         # validação antes de publicar
scripts/migrar-json.mjs   # converte o JSON antigo para o formato novo
tests/                    # node:test
```

## Como adicionar um modo novo

1. Crie `js/modes/meu-modo.js` exportando `{ id, label, description, render(root) }`.
2. Coloque-o no array `MODES` de `js/modes/index.js`.
3. Para múltipla escolha, use `createChoiceMode` (veja `js/modes/index.js`).

## Publicação

Todos os caminhos são relativos, então funciona em `usuario.github.io/repositorio/` e na Vercel.
Lembre de commitar `data/` e `assets/monsters/`.

## Atualizando de uma versão anterior

1. Extraia o zip por cima do projeto. **O seu `data/monsters.json` não é sobrescrito** (o zip só traz o exemplo).
2. Rode `npm run migrar`: `lancamento` vira `data` (só o ano), `imagem` vira `icone`, entram `versao` e `gif`
   vazios, e o que mais você tiver no JSON é mantido. A cópia de segurança fica em `data/monsters.backup.json`.
3. Preencha `versao`, `data` e `gif` e rode `npm run check`.
4. Apague o que não é mais usado: `scripts/sync-wiki.mjs`, `scripts/ping-wiki.mjs`, `scripts/make-schedule.mjs`,
   `scripts/check-imports.mjs`, a pasta `scripts/lib/`, `data/schedule.json`, `data/meta.json` e `js/ui/data-panel.js`.
   **Não rode `npm run sync`**: ele sobrescreveria o seu `data/monsters.json`.
5. Se você vem do formato com IDs em texto, o progresso salvo no navegador é reiniciado (a chave passou de `v1` para `v2`).

## Créditos

Dados e imagens: [My Singing Monsters Wiki](https://mysingingmonsters.fandom.com) (Fandom). Texto sob CC-BY-SA.
