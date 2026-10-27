# AGENTS.md: Pesquisa Viagens da Faturanamala

Instruções para o agente (Codex) que abre esta pasta no PC dela. Responda sempre em
português do Brasil, em linguagem simples, um passo de cada vez: quem pede não é
programadora.

## O que é

A **Pesquisa Viagens**: um questionário anônimo de 3 minutos sobre como as pessoas
viajam e usam milhas. No fim, quem responde vê o seu perfil de viajante e quanto as
milhas dele podem valer. É a mesma pesquisa que o Erick publicou, com as mesmas
perguntas, mas aqui:

- as respostas caem numa **Planilha Google dela** (abas Painel, Respostas e Contatos);
- a página fica no **GitHub dela**: `https://faturanamala.github.io/pesquisa-viagens/`.

## A tarefa: colocar a pesquisa dela no ar

Confirme cada etapa antes de seguir para a próxima.

### Etapa 1. Conferir as ferramentas

- `node --version` (precisa de 18 ou mais novo). Se faltar, peça licença para rodar
  `winget install OpenJS.NodeJS.LTS` e peça que ela reabra o Codex.
- `git --version`. Se faltar: `winget install Git.Git`.
- Rode `node regressao/rodar.js`. Tem de dar "Tudo verde".

### Etapa 2. A planilha e o Apps Script (ela faz no navegador, você guia)

Esta etapa acontece na conta Google dela; você não tem acesso a ela. Conduza a
Faturanamala pelo `COMO-PUBLICAR.md`, passos 1 a 4, um de cada vez, esperando ela dizer
"feito":

1. Criar a planilha em sheets.new e abrir **Extensões → Apps Script**.
2. Colar `Codigo.gs`, `Perguntas.gs` e `Index.html` **destes arquivos daqui**, sem
   mudar nada. O `Perguntas.gs` tem `url_publica` e `endpoint` vazios de propósito;
   **nunca preencha esses dois campos no `Perguntas.gs`**.
3. Rodar a função **configurar** e autorizar.
4. **Implantar → Nova implantação → App da Web**, executar como "Eu", acesso "Qualquer
   pessoa", e copiar o **URL do app da Web** (termina em `/exec`).

Para ela copiar um arquivo: abra o arquivo e mostre o conteúdo inteiro, ou diga para ela
abrir no Bloco de Notas, `Ctrl+A` e `Ctrl+C`.

### Etapa 3. Gravar o endereço dela

Peça o link `/exec` e crie o `site-config.json` na raiz:

```json
{
  "endpoint": "https://script.google.com/macros/s/O-CODIGO-DELA/exec",
  "url_publica": "https://faturanamala.github.io/pesquisa-viagens/"
}
```

Se ela colar o link da planilha (`docs.google.com/...`) ou um link terminado em `/dev`,
explique que precisa ser o "URL do app da Web" da etapa 2.4.

### Etapa 4. Gerar a página

`node gerar_site.js` cria `docs/index.html` e `docs/capa.jpg`. Se ele recusar o
`site-config.json`, leia o motivo e corrija com ela. Depois rode
`node regressao/rodar.js` de novo (tudo verde).

### Etapa 5. Publicar no GitHub dela

1. Confira se o repositório veio de `github.com/Faturanamala/pesquisa-viagens`:
   `git remote -v`. Se ela baixou de outro lugar, pare e pergunte.
2. Mostre o que vai subir (`git status`) e, com o "sim" dela:
   `git add site-config.json docs` → commit → `git push`. Na primeira vez, o Windows
   abre uma janela para ela entrar na conta Faturanamala do GitHub.
3. Ela liga o site: no repositório, **Settings → Pages → Source: Deploy from a branch →
   Branch: main, pasta /docs → Save**.
4. Em 1 ou 2 minutos, abra `https://faturanamala.github.io/pesquisa-viagens/` e confira
   se a página carrega. Peça que ela responda uma vez e veja a linha chegar na aba
   **Respostas** da planilha; depois ela apaga essa linha de teste.

Pronto: esse é o link para ela mandar nos grupos.

## Regras

- Nunca use o endereço do Erick (`efdias-lab`, ou um `/exec` que não seja o dela): as
  respostas iriam para a planilha dele. O `validar_config.js` barra isso.
- Mudar pergunta ou texto: só no `Perguntas.gs`. Depois ela cola o arquivo de novo no
  Apps Script (**Implantar → Gerenciar implantações → lápis → Nova versão**), roda
  **configurar** se as perguntas mudaram, e você roda `node gerar_site.js` e publica de novo.
- Antes de todo commit: `node regressao/rodar.js` (tudo verde). Achou um erro novo?
  Primeiro um teste em `regressao/rodar.js` que fica vermelho com ele, depois o conserto,
  e anote em `regressao/REGRESSOES.md`.
- Não peça nem guarde senha. Login no Google e no GitHub, quem faz é ela.

## Arquivos

| arquivo | papel |
|---|---|
| `Perguntas.gs` | perguntas, textos e valores da estimativa (fonte única) |
| `Codigo.gs` | Apps Script: grava a resposta na planilha e monta o Painel |
| `Index.html` | a página da pesquisa (usada pelo Apps Script e pelo gerador) |
| `gerar_site.js` | gera `docs/index.html` para o GitHub Pages a partir do `site-config.json` |
| `validar_config.js` | confere o `site-config.json` antes de gerar |
| `capa.jpg` / `gerar_capa.py` | imagem do cartão do WhatsApp e o script que a desenhou |
| `previa.html` / `gerar_previa.js` | prévia local, sem gravar respostas |
| `COMO-PUBLICAR.md` | passo a passo da planilha e do Apps Script |
| `regressao/` | testes automáticos do kit |
