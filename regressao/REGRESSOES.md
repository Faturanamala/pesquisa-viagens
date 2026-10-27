# Regressões do kit da Pesquisa Viagens

Rodar: `node regressao/rodar.js` (sai com 1 se algum ficar vermelho).

| id | erro | onde apareceu | teste | data | estado |
|---|---|---|---|---|---|
| R01 | Cópia da pesquisa para outra pessoa leva o `endpoint` e o `url_publica` do Erick no `Perguntas.gs`; as respostas dela iriam para a planilha dele, até pela página do Apps Script dela | kit da esposa, ao copiar a pasta original | R01a/b (detector com caso plantado e limpo), R01c (Perguntas.gs do kit) | 26/10/2026 | verde |
| R02 | `gerar_site.js` gerava página com endereços vazios, que não grava em lugar nenhum | kit, depois de esvaziar os endereços | R02a (vazio recusado), R02b (preenchido aceito) | 26/10/2026 | verde |
| R03 | Para publicar no GitHub dela era preciso preencher o endereço no `Perguntas.gs`, o mesmo arquivo que se cola no Apps Script; e a página saía em `site/`, pasta que o GitHub Pages não serve | kit, ao passar a publicação para o Codex no PC dela | R03a-d (lê `site-config.json`, grava `docs/` com capa, não mexe no `Perguntas.gs`) | 27/10/2026 | verde |
| R04 | Endereço errado no `site-config.json` (o do Erick, link `/dev`, link da planilha, URL sem barra) | previsto no fluxo do Codex dela | R04a (limpo) + 5 casos plantados | 27/10/2026 | verde |
| R05 | Endereço do Erick escondido em qualquer arquivo do kit (não só no `Perguntas.gs`) | ampliação do R01 | R05a/b (detector), R05c (varre o kit) | 27/10/2026 | verde |
| R07 | `.gitignore` escondendo `docs/` (a pasta que o GitHub Pages publica): a página nunca subiria | quase entrou ao montar o repositório do kit (pego na revisão do comando) | R07a (plantado), R07b (limpo), R07c (.gitignore real) | 27/10/2026 | verde |
| R06 | AGENTS.md mandando o Codex usar arquivo que não existe; o detector também não enxergava nome de arquivo dentro de comando (`node x.js`), pego pelo caso plantado | AGENTS.md; detector da própria suíte | R06a (plantado), R06b (AGENTS.md real) | 27/10/2026 | verde |
