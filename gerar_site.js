// Gera docs/index.html: a pesquisa como página própria (GitHub Pages, pasta /docs),
// com nome e imagem no cartão do WhatsApp. As respostas vão por POST ao Apps Script.
// Os endereços vêm do site-config.json; o Perguntas.gs fica com eles vazios, porque é
// ele que se cola no Apps Script.
const fs = require('fs'), vm = require('vm'), path = require('path');
const { problemasConfig } = require('./validar_config.js');
const dir = __dirname, ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(dir, 'Perguntas.gs'), 'utf8'), ctx);
const C = ctx.CONFIG;
const arqCfg = path.join(dir, 'site-config.json');
if (fs.existsSync(arqCfg)) {
  const s = JSON.parse(fs.readFileSync(arqCfg, 'utf8'));
  C.url_publica = s.url_publica;
  C.endpoint = s.endpoint;
}
if (!C.url_publica || !C.endpoint)
  throw new Error('preencha url_publica e endpoint no site-config.json antes de gerar o site');
const problemas = problemasConfig(C);
if (problemas.length) throw new Error('site-config.json com problema:\n- ' + problemas.join('\n- '));
const dados = JSON.stringify({ config: C, trechos: ctx.TRECHOS, contato: ctx.CONTATO, url: C.url_publica, endpoint: C.endpoint });

const desc = 'Para onde você vai de verdade? Pesquisa rápida e anônima: descubra seu perfil de viajante e quanto suas milhas podem render. Leva 3 minutos.';
const favicon = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#ffcc00"/>' +
  '<path fill="#16191d" transform="translate(3 3) scale(.75)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>');
const meta = [
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<meta name="description" content="' + desc + '">',
  '<meta name="theme-color" content="#16191d">',
  '<meta property="og:type" content="website">',
  '<meta property="og:locale" content="pt_BR">',
  '<meta property="og:site_name" content="Pesquisa Viagens">',
  '<meta property="og:title" content="Pesquisa Viagens">',
  '<meta property="og:description" content="' + desc + '">',
  '<meta property="og:url" content="' + C.url_publica + '">',
  '<meta property="og:image" content="' + C.url_publica + 'capa.jpg">',
  '<meta property="og:image:type" content="image/jpeg">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta property="og:image:alt" content="Pesquisa Viagens: painel de partidas com a linha Seu destino, a definir">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<link rel="icon" href="' + favicon + '">'
].join('\n');

let html = fs.readFileSync(path.join(dir, 'Index.html'), 'utf8').replace(/\r\n/g, '\n')
  .replace('<?!= dados ?>', dados)
  .replace('<base target="_top">\n', '')
  .replace('<title>Pesquisa do Viajante</title>', '<title>' + C.titulo + '</title>\n' + meta);
if (html.includes('<?')) throw new Error('sobrou marcação do Apps Script');
const saida = path.join(dir, 'docs');
fs.mkdirSync(saida, { recursive: true });
fs.writeFileSync(path.join(saida, 'index.html'), html);
fs.copyFileSync(path.join(dir, 'capa.jpg'), path.join(saida, 'capa.jpg'));
console.log('docs/index.html gerada,', html.length, 'caracteres, com capa.jpg');
