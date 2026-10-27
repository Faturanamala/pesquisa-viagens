// Regressões do kit da pesquisa. Rodar: node regressao/rodar.js
// Sai com código 1 se algum teste ficar vermelho.
const fs = require('fs'), vm = require('vm'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const KIT = path.join(__dirname, '..');

// Endereços que são do Erick: a cópia de outra pessoa não pode apontar para eles.
const DO_ERICK = ['AKfycbzJzpxN0f2E9wC1-dX1vBHMCpMPelNxx1NBHRkcM2bSl_xEHbxq-eYF20OzDSQCDLba', 'efdias-lab'];

function lerConfig(fonte) {
  const ctx = {};
  vm.runInNewContext(fonte, ctx);
  return ctx.CONFIG;
}

function apontaParaErick(cfg) {
  const s = String(cfg.endpoint || '') + ' ' + String(cfg.url_publica || '');
  return DO_ERICK.some(m => s.includes(m));
}

let falhas = 0;
function teste(nome, ok, detalhe) {
  console.log((ok ? 'VERDE    ' : 'VERMELHO ') + nome + (ok ? '' : '  -> ' + detalhe));
  if (!ok) falhas++;
}

// R01: o Perguntas.gs do kit não manda respostas nem compartilha o link do Erick.
{
  const plantado = { endpoint: 'https://script.google.com/macros/s/' + DO_ERICK[0] + '/exec', url_publica: '' };
  const limpo = { endpoint: 'https://script.google.com/macros/s/OUTRO/exec', url_publica: 'https://maria.github.io/pesquisa-viagens/' };
  teste('R01a detector pega endereço do Erick (plantado)', apontaParaErick(plantado), 'detector não viu o plantado');
  teste('R01b detector deixa passar endereço de outra pessoa', !apontaParaErick(limpo), 'detector barrou o limpo');
  const cfg = lerConfig(fs.readFileSync(path.join(KIT, 'Perguntas.gs'), 'utf8'));
  teste('R01c Perguntas.gs do kit sem endereço do Erick', !apontaParaErick(cfg),
    'endpoint=' + cfg.endpoint + ' url_publica=' + cfg.url_publica);
}

// R02: gerar_site.js se recusa a gerar com endereço vazio (página que não grava em lugar nenhum).
function gerarCom(cfgTrecho) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-pesquisa-'));
  const perguntas = fs.readFileSync(path.join(KIT, 'Perguntas.gs'), 'utf8')
    .replace(/url_publica:\s*'[^']*'/, "url_publica: '" + cfgTrecho.url_publica + "'")
    .replace(/endpoint:\s*'[^']*'/, "endpoint: '" + cfgTrecho.endpoint + "'");
  fs.writeFileSync(path.join(tmp, 'Perguntas.gs'), perguntas);
  for (const f of ['Index.html', 'gerar_site.js', 'validar_config.js', 'capa.jpg'])
    if (fs.existsSync(path.join(KIT, f))) fs.copyFileSync(path.join(KIT, f), path.join(tmp, f));
  const r = spawnSync(process.execPath, [path.join(tmp, 'gerar_site.js')], { encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r.status;
}
teste('R02a gerador recusa endereços vazios (plantado)', gerarCom({ endpoint: '', url_publica: '' }) !== 0,
  'gerou site sem endpoint');
teste('R02b gerador aceita endereços preenchidos', gerarCom({
  endpoint: 'https://script.google.com/macros/s/OUTRO/exec', url_publica: 'https://maria.github.io/pesquisa-viagens/' }) === 0,
  'recusou config válida');

// R03: o endereço dela fica em site-config.json; o gerador publica em docs/ (GitHub Pages)
// com a capa, e o Perguntas.gs (o que se cola no Apps Script) continua com endereços vazios.
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-pesquisa-'));
  for (const f of ['Perguntas.gs', 'Index.html', 'gerar_site.js', 'validar_config.js', 'capa.jpg']) {
    if (fs.existsSync(path.join(KIT, f))) fs.copyFileSync(path.join(KIT, f), path.join(tmp, f));
  }
  const cfg = { endpoint: 'https://script.google.com/macros/s/AKfyTESTE123/exec',
                url_publica: 'https://faturanamala.github.io/pesquisa-viagens/' };
  fs.writeFileSync(path.join(tmp, 'site-config.json'), JSON.stringify(cfg));
  const antes = fs.readFileSync(path.join(tmp, 'Perguntas.gs'), 'utf8');
  const r = spawnSync(process.execPath, [path.join(tmp, 'gerar_site.js')], { encoding: 'utf8' });
  const idx = path.join(tmp, 'docs', 'index.html');
  const html = fs.existsSync(idx) ? fs.readFileSync(idx, 'utf8') : '';
  teste('R03a gerador lê site-config.json e grava docs/index.html', r.status === 0 && html.includes(cfg.endpoint),
    'status=' + r.status + ' ' + (r.stderr || '').trim().split('\n').pop());
  teste('R03b cartão do WhatsApp aponta para o link dela', html.includes('content="' + cfg.url_publica + '"') &&
    html.includes(cfg.url_publica + 'capa.jpg'), 'og:url/og:image sem o link dela');
  teste('R03c capa.jpg vai junto para docs/', fs.existsSync(path.join(tmp, 'docs', 'capa.jpg')), 'docs/capa.jpg ausente');
  teste('R03d Perguntas.gs não é alterado pelo gerador',
    fs.readFileSync(path.join(tmp, 'Perguntas.gs'), 'utf8') === antes, 'gerador mexeu no Perguntas.gs');
  fs.rmSync(tmp, { recursive: true, force: true });
}

// R04: validador do site-config.json barra endereço errado antes de publicar.
{
  let problemasConfig = null;
  try { ({ problemasConfig } = require(path.join(KIT, 'validar_config.js'))); } catch (e) { /* ausente */ }
  if (!problemasConfig) {
    teste('R04 validar_config.js existe', false, 'arquivo ausente');
  } else {
    const bom = { endpoint: 'https://script.google.com/macros/s/AKfyX_y-1/exec',
                  url_publica: 'https://faturanamala.github.io/pesquisa-viagens/' };
    teste('R04a config dela passa', problemasConfig(bom).length === 0, problemasConfig(bom).join('; '));
    const plantados = {
      'endpoint do Erick': { ...bom, endpoint: 'https://script.google.com/macros/s/' + DO_ERICK[0] + '/exec' },
      'link do Erick': { ...bom, url_publica: 'https://efdias-lab.github.io/pesquisa-viagens/' },
      'link /dev em vez de /exec': { ...bom, endpoint: 'https://script.google.com/macros/s/AKfyX/dev' },
      'link da planilha em vez do app': { ...bom, endpoint: 'https://docs.google.com/spreadsheets/d/abc/edit' },
      'url sem barra no fim': { ...bom, url_publica: 'https://faturanamala.github.io/pesquisa-viagens' },
    };
    for (const [nome, c] of Object.entries(plantados))
      teste('R04 barra ' + nome + ' (plantado)', problemasConfig(c).length > 0, 'validador aceitou');
  }
}

// R05: nenhum arquivo do kit carrega o endereço do Erick (só a menção ao repo público dele no guia).
{
  const achaErick = t => t.includes(DO_ERICK[0]) || t.includes('efdias-lab.github.io');
  teste('R05a detector pega o endpoint do Erick (plantado)', achaErick('x ' + DO_ERICK[0]), 'não pegou');
  teste('R05b detector deixa passar o repo público citado no guia',
    !achaErick('https://github.com/efdias-lab/pesquisa-viagens'), 'barrou o limpo');
  const sujos = [];
  const varre = d => { for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (n === '.git' || n === 'node_modules') continue;
    if (fs.statSync(p).isDirectory()) varre(p);
    // validar_config.js guarda o endereço do Erick de propósito, como lista de bloqueio.
    else if (/\.(js|gs|html|md|json|txt)$/.test(n) && !p.includes(path.sep + 'regressao' + path.sep) &&
             n !== 'validar_config.js' &&
             achaErick(fs.readFileSync(p, 'utf8'))) sujos.push(path.relative(KIT, p));
  } };
  varre(KIT);
  teste('R05c kit sem endereço do Erick em nenhum arquivo', sujos.length === 0, sujos.join(', '));
}

// R06: AGENTS.md (o que o Codex lê) só cita arquivos que existem no kit.
{
  const citados = t => [...new Set((t.match(/`[^`\n]+`/g) || [])
    .flatMap(s => s.match(/[\w./-]+\.(?:js|gs|html|json|md|jpg|py)\b/g) || [])
    .filter(f => !f.includes('://') && !/github\.io/.test(f)))];
  const faltando = (t, existe) => citados(t).filter(f => !existe(f));
  teste('R06a detector pega arquivo citado inexistente (plantado)',
    faltando('rode `node publicar.js`', () => false).length === 1, 'não pegou');
  const ag = path.join(KIT, 'AGENTS.md');
  if (!fs.existsSync(ag)) teste('R06b AGENTS.md existe', false, 'ausente');
  else {
    const gerados = new Set(['site-config.json', 'docs/index.html', 'docs/capa.jpg']);
    const f = faltando(fs.readFileSync(ag, 'utf8'), x => gerados.has(x) || fs.existsSync(path.join(KIT, x)));
    teste('R06b AGENTS.md só cita arquivos que existem', f.length === 0, f.join(', '));
  }
}

// R07: o .gitignore não pode esconder o que o GitHub Pages publica (docs/) nem o site-config.json.
{
  const PRECISA_SUBIR = ['docs/index.html', 'docs/capa.jpg', 'site-config.json'];
  const escondidos = gitignore => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-gi-'));
    spawnSync('git', ['init', '-q', tmp]);
    fs.writeFileSync(path.join(tmp, '.gitignore'), gitignore);
    const r = spawnSync('git', ['check-ignore', '--no-index', ...PRECISA_SUBIR], { cwd: tmp, encoding: 'utf8' });
    fs.rmSync(tmp, { recursive: true, force: true });
    return r.stdout.split(/\r?\n/).filter(Boolean);
  };
  teste('R07a detector pega docs/ ignorado (plantado)', escondidos('docs/\nsite/\n').length === 2, 'não pegou');
  teste('R07b detector deixa passar .gitignore limpo', escondidos('site/\nnode_modules/\n').length === 0, 'barrou o limpo');
  const gi = path.join(KIT, '.gitignore');
  const e = fs.existsSync(gi) ? escondidos(fs.readFileSync(gi, 'utf8')) : [];
  teste('R07c .gitignore do kit deixa subir docs/ e site-config.json', e.length === 0, e.join(', '));
}

console.log(falhas ? '\n' + falhas + ' vermelho(s)' : '\nTudo verde');
process.exit(falhas ? 1 : 0);
