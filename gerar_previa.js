// Gera previa.html: a página com as perguntas embutidas, para abrir no navegador sem o Google.
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = __dirname, ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(dir, 'Perguntas.gs'), 'utf8'), ctx);
const dados = JSON.stringify({ config: ctx.CONFIG, trechos: ctx.TRECHOS, contato: ctx.CONTATO, url: 'https://exemplo.link/pesquisa' });
const html = fs.readFileSync(path.join(dir, 'Index.html'), 'utf8').replace('<?!= dados ?>', dados);
fs.writeFileSync(path.join(dir, 'previa.html'), html);
console.log('previa.html gerada');
