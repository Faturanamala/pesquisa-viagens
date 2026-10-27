// Confere o site-config.json antes de gerar a página: endereço errado aqui faz as
// respostas irem para lugar nenhum (ou para a planilha de outra pessoa).
const DO_ERICK = ['AKfycbzJzpxN0f2E9wC1-dX1vBHMCpMPelNxx1NBHRkcM2bSl_xEHbxq-eYF20OzDSQCDLba', 'efdias-lab'];

function problemasConfig(cfg) {
  const p = [];
  const ep = String((cfg && cfg.endpoint) || ''), url = String((cfg && cfg.url_publica) || '');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ep))
    p.push('endpoint precisa ser o "URL do app da Web" do Apps Script, terminando em /exec (veio: ' + (ep || 'vazio') + ')');
  if (!/^https:\/\/[a-z0-9-]+\.github\.io\/[\w.-]+\/$/i.test(url))
    p.push('url_publica precisa ser https://USUARIO.github.io/pesquisa-viagens/ com a barra no fim (veio: ' + (url || 'vazio') + ')');
  if (DO_ERICK.some(m => ep.includes(m) || url.includes(m)))
    p.push('o endereço é o do Erick: as respostas iriam para a planilha dele');
  return p;
}

module.exports = { problemasConfig };
