/**
 * Pesquisa do Viajante: servidor (Google Apps Script ligado a uma Planilha).
 * doGet serve a página; salvarResposta grava uma linha na aba "Respostas".
 * Rode "configurar" antes de divulgar: monta Respostas, Painel e Contatos.
 */
var ABA_RESPOSTAS = 'Respostas';
var ABA_PAINEL = 'Painel';
var ABA_CONTATOS = 'Contatos';
var PROP_PLANILHA = 'PLANILHA_ID';

var COR = { tinta: '#16191d', amarelo: '#ffcc00', amareloClaro: '#fff5cc', cinza: '#f3f5f7', linha: '#d3d9df', texto2: '#56606b' };
// Tom do cabeçalho de cada trecho da pesquisa, para achar as colunas de olho
var TOM_TRECHO = { _: '#e9ecef', EMB: '#fde9a8', DST: '#cfe6f2', PLN: '#d7ecd4', MIL: '#fbe0c6', EST: '#e5dcf3', CNS: '#f6d3d3', DES: '#d3e4e6', CALC: '#fff5cc' };

// Planilha em português usa ";" entre argumentos e "\" entre colunas de {matriz}.
var SEP_LOCAL = false;
function fx_(f) {
  if (!SEP_LOCAL) return f;
  var out = '', aspas = false, chave = 0;
  for (var i = 0; i < f.length; i++) {
    var ch = f[i];
    if (ch === '"') aspas = !aspas;
    if (!aspas) {
      if (ch === '{') chave++;
      else if (ch === '}') chave--;
      else if (ch === ',') ch = chave > 0 ? '\\' : ';';
    }
    out += ch;
  }
  return out;
}

function doGet() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.dados = JSON.stringify({ config: CONFIG, trechos: TRECHOS, contato: CONTATO, url: CONFIG.url_publica || ScriptApp.getService().getUrl() });
  return t.evaluate()
    .setTitle(CONFIG.titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Recebe a resposta enviada pela página publicada fora do Google (GitHub Pages). */
function doPost(e) {
  var saida;
  try {
    var resp = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    saida = salvarResposta(resp);
  } catch (err) {
    saida = { ok: false, erro: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(saida)).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Pesquisa do Viajante')
    .addItem('Refazer painel e formatação', 'configurar')
    .addToUi();
}

function nomesPerfis_() {
  return Object.keys(CONFIG.perfis).map(function (k) { return CONFIG.perfis[k][0]; });
}

/** Colunas da planilha, na ordem: {id, cab, nota, trecho, p (regra de validação), num} */
function colunas_() {
  var cols = [{ id: '_quando', cab: 'Data e hora', trecho: '_' }];
  TRECHOS.forEach(function (t) {
    t.perguntas.forEach(function (p) {
      if (p.tipo === 'grade') {
        p.linhas.forEach(function (l) {
          cols.push({ id: l.id, cab: l.curto || l.rotulo, nota: p.titulo + '\n' + l.rotulo, trecho: t.codigo, p: { tipo: 'unica', opcoes: p.colunas } });
        });
      } else {
        cols.push({ id: p.id, cab: p.curto || p.titulo, nota: p.titulo, trecho: t.codigo, p: p });
      }
    });
  });
  var ci = CONTATO.interesse;
  cols.push({ id: ci.id, cab: ci.curto || ci.titulo, nota: ci.titulo, trecho: 'DES', p: { tipo: 'unica', opcoes: ci.opcoes } });
  CONTATO.campos.forEach(function (c) { cols.push({ id: c.id, cab: c.rotulo, trecho: 'DES' }); });
  cols.push({ id: '_perfil', cab: 'Perfil calculado', nota: 'Perfil de viajante mostrado no cartão de embarque', trecho: 'CALC', p: { tipo: 'unica', opcoes: nomesPerfis_() } });
  cols.push({ id: '_milhas_hoje', cab: 'Milhas/ano hoje', nota: 'Estimativa com o cartão atual', trecho: 'CALC', num: true });
  cols.push({ id: '_milhas_estrategia', cab: 'Milhas/ano c/ estratégia', nota: 'Estimativa com cartão adequado e transferência com bônus', trecho: 'CALC', num: true });
  cols.push({ id: '_ganho_milhas', cab: 'Ganho possível/ano', nota: 'Diferença entre as duas estimativas', trecho: 'CALC', num: true });
  return cols;
}

function planilha_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_PLANILHA);
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function letra_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function colDe_(cols, id) {
  for (var i = 0; i < cols.length; i++) if (cols[i].id === id) return letra_(i + 1);
  throw new Error('Coluna não encontrada: ' + id);
}

/** Monta (ou refaz) as três abas. Não apaga respostas já gravadas. */
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty(PROP_PLANILHA, ss.getId());
  SEP_LOCAL = /^(pt|es|fr|de|it|nl|ru|tr|pl|sv|da|nb|fi|cs|id|ro|hu|el|uk)/i.test(ss.getSpreadsheetLocale() || '');
  var cols = colunas_();
  var r = montaRespostas_(ss, cols);
  montaPainel_(ss, cols);
  montaContatos_(ss, cols);
  // Some a aba vazia que vem com toda planilha nova
  ['Página1', 'Sheet1', 'Planilha1'].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
  ss.setActiveSheet(ss.getSheetByName(ABA_PAINEL));
  ss.moveActiveSheet(1);
  return 'ok';
}

function montaRespostas_(ss, cols) {
  var r = ss.getSheetByName(ABA_RESPOSTAS) || ss.insertSheet(ABA_RESPOSTAS);
  var n = cols.length;
  if (r.getMaxColumns() < n) r.insertColumnsAfter(r.getMaxColumns(), n - r.getMaxColumns());
  if (r.getMaxRows() < 3000) r.insertRowsAfter(r.getMaxRows(), 3000 - r.getMaxRows());

  var cab = r.getRange(1, 1, 1, n);
  cab.setValues([cols.map(function (c) { return c.cab; })])
    .setFontWeight('bold').setFontColor(COR.tinta).setFontSize(10)
    .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center')
    .setBorder(null, null, true, null, null, null, COR.tinta, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  cab.setBackgrounds([cols.map(function (c) { return TOM_TRECHO[c.trecho] || TOM_TRECHO._; })]);
  cab.setNotes([cols.map(function (c) { return c.nota || ''; })]);
  r.setRowHeight(1, 54);
  r.setFrozenRows(1);
  r.setFrozenColumns(1);

  cols.forEach(function (c, i) {
    var largura = c.id === 'viagem_sonho' ? 280 : (c.p && c.p.tipo === 'multipla') ? 230 : c.num ? 120 : 160;
    r.setColumnWidth(i + 1, largura);
  });
  var corpo = r.getRange(2, 1, r.getMaxRows() - 1, n);
  corpo.setVerticalAlignment('top').setWrap(true).setFontSize(10);
  r.getRange(2, 1, r.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  cols.forEach(function (c, i) { if (c.num) r.getRange(2, i + 1, r.getMaxRows() - 1, 1).setNumberFormat('#,##0').setHorizontalAlignment('right'); });
  // Texto livre fica como texto: WhatsApp não perde o zero, "10/10" não vira data
  ['cidade', 'viagem_sonho', 'contato_nome', 'contato_whatsapp', 'contato_email'].forEach(function (id) {
    var L = colDe_(cols, id);
    r.getRange(L + '2:' + L).setNumberFormat('@');
  });

  // Faixas alternadas (refeitas do zero para não acumular)
  r.getBandings().forEach(function (b) { b.remove(); });
  r.getRange(1, 1, r.getMaxRows(), n).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(null).setFirstRowColor('#ffffff').setSecondRowColor(COR.cinza);
  cab.setBackgrounds([cols.map(function (c) { return TOM_TRECHO[c.trecho] || TOM_TRECHO._; })]);

  // Quem pediu conversa ganha a linha em amarelo
  var colInt = colDe_(cols, CONTATO.interesse.id);
  var regra = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + colInt + '2="' + CONTATO.interesse.opcoes[0] + '"')
    .setBackground(COR.amareloClaro).setRanges([r.getRange(2, 1, r.getMaxRows() - 1, n)]).build();
  r.setConditionalFormatRules([regra]);

  if (r.getFilter()) r.getFilter().remove();
  r.getRange(1, 1, r.getMaxRows(), n).createFilter();
  r.setTabColor(COR.tinta);
  return r;
}

function montaPainel_(ss, cols) {
  var s = ss.getSheetByName(ABA_PAINEL) || ss.insertSheet(ABA_PAINEL);
  s.getCharts().forEach(function (c) { s.removeChart(c); });
  s.clear(); s.clearFormats();
  s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns()).breakApart();
  if (s.getMaxColumns() < 14) s.insertColumnsAfter(s.getMaxColumns(), 14 - s.getMaxColumns());
  s.setHiddenGridlines(true);
  s.setTabColor(COR.amarelo);
  s.setColumnWidth(1, 16);   // margem
  s.setColumnWidth(2, 330);  // opção
  s.setColumnWidth(3, 90);   // respostas
  s.setColumnWidth(4, 70);   // %
  s.setColumnWidth(5, 190);  // barra
  s.setColumnWidth(6, 30);   // espaço
  for (var c = 7; c <= 12; c++) s.setColumnWidth(c, 110);

  var R = "'" + ABA_RESPOSTAS + "'!";
  var faixa = function (id) { var L = colDe_(cols, id); return R + L + '2:' + L; };
  var TOTAL = '$N$1';

  // Título
  s.getRange('B2:L2').merge().setValue('Pesquisa do Viajante · Painel')
    .setFontSize(22).setFontWeight('bold').setFontColor(COR.amarelo).setBackground(COR.tinta)
    .setVerticalAlignment('middle');
  s.setRowHeight(2, 52);
  s.getRange('B3:L3').merge()
    .setValue('Atualiza sozinho a cada resposta. Detalhes linha a linha na aba Respostas; quem pediu conversa está em Contatos.')
    .setFontColor(COR.texto2).setFontStyle('italic');

  // Indicadores
  var kpis = [
    ['Respostas', '=COUNTA(' + faixa('_quando') + ')', '0'],
    ['Querem conversar', '=COUNTIF(' + faixa(CONTATO.interesse.id) + ',"' + CONTATO.interesse.opcoes[0] + '")', '0'],
    ['Pediram aviso', '=COUNTIF(' + faixa(CONTATO.interesse.id) + ',"' + CONTATO.interesse.opcoes[1] + '")', '0'],
    ['Querem muito o diagnóstico', '=IFERROR(COUNTIF(' + faixa('int_diagnostico') + ',"Quero muito")/' + TOTAL + ',0)', '0%'],
    ['Querem muito o planejamento', '=IFERROR(COUNTIF(' + faixa('int_planejamento') + ',"Quero muito")/' + TOTAL + ',0)', '0%'],
    ['Milhas/ano deixadas na mesa (média)', '=IFERROR(AVERAGE(' + faixa('_ganho_milhas') + '),0)', '#,##0']
  ];
  // Dois andares de três indicadores: rótulo numa linha, número grande na de baixo
  var pos = [['B4', 'B5'], ['C4:E4', 'C5:E5'], ['G4:L4', 'G5:L5'], ['B7', 'B8'], ['C7:E7', 'C8:E8'], ['G7:L7', 'G8:L8']];
  kpis.forEach(function (k, i) {
    s.getRange(pos[i][0]).merge().setValue(k[0]).setFontColor(COR.texto2).setFontSize(10).setFontWeight('bold')
      .setBackground(COR.amareloClaro).setVerticalAlignment('bottom');
    s.getRange(pos[i][1]).merge().setFormula(fx_(k[1])).setNumberFormat(k[2]).setFontSize(26).setFontWeight('bold')
      .setFontColor(COR.tinta).setBackground(COR.amareloClaro).setHorizontalAlignment('left');
  });
  // Total escondido em N1, base de todos os percentuais
  s.getRange('N1').setFormula(fx_(kpis[0][1])).setFontColor('#ffffff');
  s.setRowHeight(5, 44); s.setRowHeight(8, 44);

  // Tabelas por pergunta
  var linha = 10, graficos = [];
  var comGrafico = { destinos: 1, maior_trabalho: 1, programas: 1, cartao_categoria: 1, preco_planejamento: 1, confianca: 1 };
  var trechoAtual = null;
  var nomeTrecho = {}; TRECHOS.forEach(function (t) { nomeTrecho[t.codigo] = t.codigo + ' · ' + t.nome; });
  nomeTrecho.DES = CONTATO.codigo + ' · ' + CONTATO.nome; nomeTrecho.CALC = 'Resultado · Perfil calculado';
  cols.forEach(function (c) {
    if (!c.p || !c.p.opcoes) return;
    if (c.trecho !== trechoAtual) {
      trechoAtual = c.trecho;
      s.getRange(linha, 2, 1, 4).merge().setValue(nomeTrecho[c.trecho] || c.trecho)
        .setFontSize(13).setFontWeight('bold').setFontColor(COR.tinta).setBackground(TOM_TRECHO[c.trecho] || TOM_TRECHO._);
      s.setRowHeight(linha, 30);
      linha += 2;
    }
    var L = colDe_(cols, c.id), fx = R + L + '2:' + L;
    s.getRange(linha, 2, 1, 4).setValues([[c.nota || c.cab, 'Respostas', '%', '']])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground(COR.tinta).setWrap(true).setVerticalAlignment('middle');
    if (c.p.tipo === 'multipla') s.getRange(linha, 5).setValue('(várias por pessoa)').setFontWeight('normal').setFontColor('#c9ced4');
    var ini = linha + 1;
    var linhas = c.p.opcoes.map(function (o, k) {
      var alvo = '"' + o.replace(/"/g, '""') + '"';
      var n = ini + k;
      var cont = c.p.tipo === 'multipla' ? '=COUNTIF(' + fx + ',"*"&' + alvo + '&"*")' : '=COUNTIF(' + fx + ',' + alvo + ')';
      return [o, cont, '=IFERROR(C' + n + '/' + TOTAL + ',0)',
        '=SPARKLINE(D' + n + ',{"charttype","bar";"max",1;"color1","' + COR.amarelo + '";"empty","zero"})'];
    });
    var bloco = s.getRange(ini, 2, linhas.length, 4);
    bloco.setValues(linhas.map(function (x) { return [x[0], '', '', '']; }));
    s.getRange(ini, 3, linhas.length, 3).setFormulas(linhas.map(function (x) { return [fx_(x[1]), fx_(x[2]), fx_(x[3])]; }));
    s.getRange(ini, 4, linhas.length, 1).setNumberFormat('0%');
    s.getRange(ini, 3, linhas.length, 2).setHorizontalAlignment('right');
    bloco.setBorder(null, null, true, null, null, true, COR.linha, SpreadsheetApp.BorderStyle.SOLID);
    if (comGrafico[c.id]) graficos.push({ titulo: c.cab, linha: linha, n: linhas.length, ini: ini });
    linha = ini + linhas.length + 2;
  });

  graficos.forEach(function (g) {
    var ch = s.newChart().asBarChart()
      .addRange(s.getRange(g.ini, 2, g.n, 2))
      .setTitle(g.titulo)
      .setColors([COR.amarelo])
      .setLegendPosition(Charts.Position.NONE)
      .setOption('backgroundColor', '#ffffff')
      .setOption('titleTextStyle', { color: COR.tinta, fontSize: 13, bold: true })
      .setOption('hAxis', { minValue: 0, format: '0', gridlines: { color: '#eeeeee' } })
      .setPosition(g.linha, 7, 0, 0)
      .setOption('width', 620).setOption('height', Math.max(200, 34 * g.n + 70))
      .build();
    s.insertChart(ch);
  });
  s.setFrozenRows(2);
}

function montaContatos_(ss, cols) {
  var s = ss.getSheetByName(ABA_CONTATOS) || ss.insertSheet(ABA_CONTATOS);
  s.clear();
  s.setTabColor('#1e7a4c');
  var ids = ['_quando', 'contato_nome', 'contato_whatsapp', 'contato_email', CONTATO.interesse.id, '_perfil',
             'int_diagnostico', 'int_planejamento', 'int_acompanhamento', 'destinos', 'gasto_cartao', '_ganho_milhas'];
  var cab = ['Quando', 'Nome', 'WhatsApp', 'E-mail', 'Pediu', 'Perfil', 'Diagnóstico', 'Planejamento', 'Acompanhamento', 'Destinos', 'Gasto no cartão', 'Milhas/ano na mesa'];
  var R = "'" + ABA_RESPOSTAS + "'!";
  var ultima = letra_(cols.length);
  var idx = ids.map(function (id) { for (var i = 0; i < cols.length; i++) if (cols[i].id === id) return i + 1; throw new Error(id); });
  s.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setFontColor('#ffffff').setBackground(COR.tinta).setVerticalAlignment('middle');
  s.setRowHeight(1, 32);
  var cons = colDe_(cols, 'contato_consentimento');
  s.getRange(2, 1).setFormula(fx_('=IFERROR(SORT(CHOOSECOLS(FILTER(' + R + 'A2:' + ultima + ',' + R + cons + '2:' + cons + '="Sim"),' + idx.join(',') + '),1,FALSE),"Ninguém deixou contato ainda.")'));
  s.getRange('A2:A').setNumberFormat('dd/mm/yyyy hh:mm');
  s.getRange('L2:L').setNumberFormat('#,##0');
  s.setFrozenRows(1);
  [130, 130, 140, 200, 190, 190, 110, 110, 120, 240, 130, 130].forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
  s.getRange(2, 1, s.getMaxRows() - 1, cab.length).setWrap(true).setVerticalAlignment('top');
}

function limpa_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 500);
  // Impede que um texto vire fórmula na planilha
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  // Telefone e números digitados ficam como texto (não perdem o zero nem viram data)
  else if (/^[\d\s().\/]+$/.test(s)) s = "'" + s;
  return s;
}

/** Chamado pela página. Grava só campos conhecidos e opções válidas. */
function salvarResposta(resp) {
  if (!resp || typeof resp !== 'object') throw new Error('Resposta vazia.');
  if (resp._site) return { ok: true }; // campo-isca preenchido por robô: ignora em silêncio
  var cols = colunas_();
  var linha = cols.map(function (c) {
    var id = c.id, p = c.p;
    if (id === '_quando') return new Date();
    var v = resp[id];
    if (v == null || v === '') return '';
    if (c.num) { var n = Math.round(Number(v)); return isFinite(n) && n >= 0 && n < 1e7 ? n : ''; }
    if (p && p.opcoes) {
      var lista = Array.isArray(v) ? v : [v];
      lista = lista.filter(function (x) { return p.opcoes.indexOf(x) >= 0; });
      if (p.tipo !== 'multipla') lista = lista.slice(0, 1);
      if (p.max) lista = lista.slice(0, p.max);
      return lista.join('; ');
    }
    if (id === 'contato_consentimento') return v === true || v === 'sim' ? 'Sim' : '';
    return limpa_(v, id === 'viagem_sonho' ? 1000 : 200);
  });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var r = planilha_().getSheetByName(ABA_RESPOSTAS);
    if (!r) throw new Error('A planilha ainda não foi configurada.');
    // appendRow usa a última linha com conteúdo (ignora linhas só formatadas) e cria linha nova quando falta
    r.appendRow(linha);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}
