# MSMdle

Desafios diários de **My Singing Monsters**, feitos por brasileiros e em português do Brasil.
Projeto de fã, sem vínculo com a Big Blue Bubble. Os nomes e a arte dos monstros pertencem a ela.

## Como rodar

Requer Node 18+ (só para os comandos de apoio; o site em si é HTML, CSS e JS puros).

```bash
npm run dev     # servidor local (módulos ES não abrem com duplo clique)
npm run check   # confere os módulos, o data/monsters.json e as imagens
npm test        # testes das regras (cores, setas de data, sorteio por ID)
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
  "lancamento": "2012-09-04"
}
```

| Campo | O que é |
|---|---|
| `id` | Número inteiro, único, maior que 0. Usado no sorteio do monstro do dia |
| `nome` | Nome do monstro. Também define o nome da imagem (veja abaixo) |
| `ilhas` | Lista das ilhas onde o monstro vive |
| `classe` | Classe do monstro (ex.: `Natural`) |
| `elementos` | Lista dos elementos (ex.: `["Air", "Plant"]`) |
| `lancamento` | Data de lançamento no formato `AAAA-MM-DD` (ou `AAAA-MM`, ou `AAAA`). Use `null` se não souber |
| `imagem` | Opcional. Caminho de uma imagem diferente do padrão |

> **Atenção:** os 31 Naturais que acompanham o projeto têm `"lancamento": null`.
> Preencha as datas para a coluna **Lançamento** funcionar. Enquanto estiver `null`, a célula fica cinza.

Os valores ficam em inglês, como na wiki (`Air`, `Plant Island`...). A tradução para **exibição**
é feita em `js/i18n.js` (hoje: elementos e a classe Natural). O que não estiver lá aparece como no JSON.

### Como o monstro do dia é escolhido

O sorteio usa o `id` (arquivo `js/core/daily.js`):

1. lê o JSON e junta todos os IDs;
2. conta quantos monstros existem;
3. sorteia, de forma fixa para a data (fuso de Brasília), um desses IDs.

Todo mundo recebe o mesmo monstro no mesmo dia, e cada modo tem o seu (o "salt" muda o sorteio).
Como a conta usa o total de monstros, **adicionar ou remover monstros muda a resposta do dia**.
Prefira atualizar o JSON logo após a virada do dia.

## Regras do modo "Monstro do dia"

| Coluna | Cores |
|---|---|
| Monstro (nome) | verde = certo · vermelho = errado |
| Ilhas | verde = certo · laranja = quase (algumas em comum) · vermelho = errado |
| Classe | verde = certo · laranja = quase · vermelho = errado |
| Elementos | verde = certo · laranja = quase · vermelho = errado |
| Lançamento | verde = mesma data · vermelho = errado, com seta **↑** (o monstro do dia foi lançado depois) ou **↓** (foi lançado antes) |

A seta compara a data completa (ano, mês e dia). Sem data no palpite ou na resposta, a célula fica cinza, sem seta.

## Imagens

Coloque os PNGs em `assets/monsters/`. O nome do arquivo é o nome do monstro em minúsculas, sem acentos,
com espaços e símbolos trocados por `-` (`Toe Jammer` → `toe-jammer.png`, `T-Rox` → `t-rox.png`).
O `npm run check` avisa quais estão faltando.

## Estrutura

```
index.html
css/style.css
data/monsters.json        # os monstros (edite aqui)
assets/monsters/          # imagens
js/
  app.js                  # carrega tudo, navega entre os modos e mostra erros na tela
  config.js               # fuso, dia nº 1, chaves de armazenamento
  i18n.js                 # tradução de exibição
  core/                   # sorteio por ID, comparação, storage, autocomplete, base dos modos
  data/monsters.js        # lê o JSON (português) e converte para o formato interno
  modes/                  # um arquivo por desafio + registro em index.js
  ui/                     # faixa dos brasileiros, tela inicial, infobox, dicas, estatísticas
scripts/check.mjs         # validação antes de publicar
tests/                    # node:test
```

## Como adicionar um modo novo

1. Crie `js/modes/meu-modo.js` exportando `{ id, label, description, render(root) }`.
2. Coloque-o no array `MODES` de `js/modes/index.js`.
3. Para múltipla escolha, use `createChoiceMode` (veja `js/modes/index.js`).

## Publicação

Todos os caminhos são relativos, então funciona em `usuario.github.io/repositorio/` e na Vercel.
Lembre de commitar `data/` e `assets/monsters/`.

## Atualizando um repositório antigo

Este projeto **não usa mais** a sincronização com a wiki. Se você vem da versão anterior:

- Apague `scripts/sync-wiki.mjs`, `scripts/ping-wiki.mjs`, `scripts/make-schedule.mjs`, `scripts/check-imports.mjs`
  e a pasta `scripts/lib/`. **Não rode `npm run sync`**: ele sobrescreveria o seu `data/monsters.json`.
- Apague `data/schedule.json`, `data/meta.json` e `js/ui/data-panel.js`.
- O progresso salvo no navegador é reiniciado (a chave passou de `v1` para `v2`, porque os IDs agora são números).
- Mantenha a sua pasta `assets/monsters/`: os nomes dos arquivos continuam os mesmos.

## Créditos

Dados e imagens: [My Singing Monsters Wiki](https://mysingingmonsters.fandom.com) (Fandom). Texto sob CC-BY-SA.
