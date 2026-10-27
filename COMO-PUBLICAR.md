# Pesquisa do Viajante: como colocar no ar

A página roda no Google Apps Script, que é grátis, e as respostas caem numa Planilha Google sua.
Quem responde não precisa de conta nem de login. Leva uns 10 minutos, uma vez só.

Para ver a página antes de publicar, dê dois cliques em `previa.html`. Ela funciona igual,
mas as respostas não vão para lugar nenhum.

## 1. Criar a planilha

1. Entre na conta Google que vai receber as respostas e abra **sheets.new**.
2. Dê um nome à planilha, por exemplo *Pesquisa do Viajante – Respostas*.
3. No menu, clique em **Extensões → Apps Script**. Abre o editor numa aba nova.

## 2. Colar os três arquivos

Para copiar cada arquivo: clique com o botão direito nele, **Abrir com → Bloco de Notas**, depois `Ctrl+A` e `Ctrl+C`.

| No editor do Apps Script | Cole o conteúdo de |
|---|---|
| O arquivo `Código.gs` que já existe (apague o que tiver nele) | `Codigo.gs` |
| **+ → Script**, com o nome `Perguntas` | `Perguntas.gs` |
| **+ → HTML**, com o nome `Index` (exatamente assim, com I maiúsculo) | `Index.html` |

Salve com `Ctrl+S`.

## 3. Preparar a planilha (uma vez)

1. No alto do editor, no seletor de funções, escolha **configurar** e clique em **Executar**.
2. O Google pede autorização: **Revisar permissões → sua conta → Avançado → Acessar (não seguro) → Permitir**.
   O aviso aparece porque o script é seu e o Google não o revisou. Ele só mexe nesta planilha.
3. Volte à planilha: agora ela tem as abas **Painel**, **Respostas** e **Contatos**.

## 4. Publicar

1. No editor: **Implantar → Nova implantação**.
2. Na engrenagem, escolha **App da Web**.
3. **Executar como:** Eu. **Quem pode acessar:** Qualquer pessoa.
4. Clique em **Implantar** e copie o **URL do app da Web** (termina em `/exec`).
5. Abra esse link numa janela anônima, responda uma vez e confira se a linha apareceu na aba **Respostas**.
   Depois apague essa linha de teste (botão direito no número da linha → Excluir linha).

Esse é o link para mandar nos grupos.

## Onde ver os resultados

- **Respostas**: uma linha por pessoa, com data e hora. Nome e contato só aparecem quando a pessoa escolheu deixar.
- **Painel**: indicadores no topo, e para cada pergunta quantas pessoas marcaram cada opção, a porcentagem e uma barrinha. Seis perguntas têm gráfico. Atualiza sozinho.
- **Contatos**: só quem autorizou contato, com nome, WhatsApp, e-mail, perfil e interesse nos serviços.

## Mudar alguma coisa depois

Perguntas, opções e textos ficam todos em `Perguntas.gs`. Depois de mudar:

**Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar.** O link continua o mesmo.

Se mudar perguntas, rode **configurar** de novo (ou use o menu **Pesquisa do Viajante** que aparece na planilha)
para refazer o cabeçalho e o painel. Faça isso antes de começar a divulgar, porque as colunas mudam de lugar.

## Bom saber

- No topo da página, o Google mostra uma faixa cinza dizendo que o aplicativo foi criado por um usuário do Apps Script. É padrão e não dá para tirar.
- O Google não informa quem respondeu. A pesquisa é anônima de verdade.
- A estimativa de milhas no final usa R$ 15 (vender) e R$ 45 (usar bem) por mil milhas. Os dois valores ficam em `CONFIG`, no começo de `Perguntas.gs`.
- A página tem uma armadilha invisível para robôs: resposta automática é descartada sem ir para a planilha.
