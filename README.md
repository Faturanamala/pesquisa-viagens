# Pesquisa Viagens da Faturanamala

A mesma pesquisa do Erick, com as mesmas perguntas, mas com as respostas caindo numa
planilha **sua** e com o link no seu nome:

**https://faturanamala.github.io/pesquisa-viagens/**

Quem faz o trabalho é o Codex, no seu PC. Você só faz a parte que precisa do seu login
(Google e GitHub).

## 1. Baixar (uma vez)

No PowerShell:

```powershell
cd $HOME\Documents
git clone https://github.com/Faturanamala/pesquisa-viagens.git
cd pesquisa-viagens
```

Sem git instalado: `winget install Git.Git`, feche e abra o PowerShell. No primeiro
clone, abre uma janela para você entrar na sua conta do GitHub.

## 2. Pedir ao Codex

Abra a pasta `pesquisa-viagens` no Codex e escreva:

> Coloque a minha Pesquisa Viagens no ar seguindo o AGENTS.md.

Ele vai te guiar para:

1. criar a sua planilha e colar três arquivos no Apps Script do Google (uns 10 minutos);
2. pegar o link que termina em `/exec`;
3. gerar a página e enviar para o seu GitHub;
4. ligar o site em **Settings → Pages**.

## Onde ver as respostas

Na sua planilha: aba **Painel** (resumo com porcentagens e gráficos), **Respostas** (uma
linha por pessoa) e **Contatos** (só quem quis deixar contato).

A pesquisa original do Erick está em https://github.com/efdias-lab/pesquisa-viagens.
