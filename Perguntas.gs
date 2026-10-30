/**
 * Perguntas do formulário: fonte única.
 * A página (Index.html) e a planilha (Codigo.gs) leem daqui.
 * Para mudar uma pergunta, mude só este arquivo e reimplante.
 *
 * Tipos: unica (escolhe uma), multipla (várias; "max" limita),
 *        texto_curto, texto, grade (uma escolha por linha).
 */
var CONFIG = {
  titulo: 'Fatura na Mala | Pesquisa de Viagens',
  // Link público da pesquisa (vai no botão de compartilhar).
  // Vazio no Apps Script: o botão usa o link do próprio script. Preencher só para gerar o site do GitHub.
  url_publica: '',
  // Endereço /exec do SEU Apps Script (usado só pela página do GitHub Pages).
  // Deixe vazio ao colar no Apps Script: assim a página grava direto na planilha de quem publicou.
  endpoint: '',
  // Chamada que aparece no fim e no texto de compartilhar
  chamada: 'Fatura na Mala · Consultoria e gestão de milhas para transformar os planos da sua família em viagens.',
  // Valor ilustrativo do milheiro usado na estimativa do fim (R$ por 1.000 milhas)
  milheiro_venda: 15,
  milheiro_bem_usado: 45,
  // Calculadora do cartão (valores de referência, ilustrativos)
  dolar: 5.50,               // câmbio usado para converter o gasto em dólares
  milheiro_referencia: 25,   // R$ por 1.000 milhas usadas em passagem
  bonus_transferencia: 0.8,  // bônus típico de campanha (80%)
  // pontos por dólar pela categoria do cartão
  pontos_categoria: { 'Comum ou nacional': 0.5, 'Gold ou Internacional': 1.0, 'Platinum': 1.5, 'Black ou Infinite': 2.2, 'Não sei': 1.0 },
  // bancos cujo cartão comum não acumula pontos (cashback ou programa pago à parte)
  bancos_sem_pontos: ['Nubank', 'Inter'],
  // pontos por dólar de um cartão bem escolhido, pelo gasto mensal (limite superior da faixa em R$)
  pontos_estrategia: [[5000, 2.0], [10000, 2.5], [1e12, 3.0]],
  // Perfis do cartão de embarque: [nome, texto]. O nome vai para a planilha.
  perfis: {
    estrategista: ['Estrategista de Milhas', 'Você já joga o jogo das milhas. O próximo nível é emitir nas rotas certas, pelo programa certo e na hora certa.'],
    familia: ['Família em Rota', 'Viajar com crianças pede roteiro com folga, hotel bem localizado e um plano B pronto. É aí que um bom planejamento aparece.'],
    conforto: ['Conforto do Embarque ao Check-in', 'Você valoriza a viagem desde o aeroporto. Milhas bem usadas podem colocar a executiva dentro do seu orçamento.'],
    experiencias: ['Experiência em Primeiro Lugar', 'Você viaja para viver o que não se repete. Um roteiro sob medida troca dias corridos por momentos que ficam.'],
    economico: ['Radar de Oportunidades', 'Você busca o melhor preço. Com as milhas e os cartões certos, dá para ir mais longe gastando o mesmo.'],
    delegador: ['Viajante sem Tempo', 'Você quer viajar bem sem gastar noites pesquisando. Delegar o planejamento devolve esse tempo para você.'],
    dormente: ['Milhas Adormecidas', 'Você tem pontos parados que podem virar viagem. Um diagnóstico mostra quanto valem e quando vencem.'],
    curioso: ['Rota em Aberto', 'Seu próximo destino ainda está em aberto, e esse é o melhor momento para planejar com calma.']
  }
};

var TRECHOS = [
  {
    codigo: 'EMB', nome: 'Embarque',
    titulo: 'Primeiro, conte como você viaja',
    curiosidade: 'Quem viaja duas vezes por ano ou mais quase sempre já tem milhas paradas em algum programa, mesmo sem perceber.',
    perguntas: [
      { id: 'viagens_ano', curto: 'Viagens por ano', tipo: 'unica', obrigatoria: true, titulo: 'Quantas viagens de lazer você faz por ano?',
        opcoes: ['Nenhuma no último ano', '1 viagem', '2 a 3 viagens', '4 ou mais'] },
      { id: 'tipo_viagem', curto: 'Brasil ou exterior', tipo: 'unica', obrigatoria: true, titulo: 'Suas viagens costumam ser…',
        opcoes: ['Mais pelo Brasil', 'Metade Brasil, metade exterior', 'Mais internacionais'] },
      { id: 'companhia', curto: 'Com quem viaja', tipo: 'multipla', obrigatoria: true, titulo: 'Com quem você costuma viajar?', ajuda: 'Marque quantas quiser',
        opcoes: ['Sozinho(a)', 'Casal', 'Família com crianças', 'Família sem crianças', 'Amigos', 'A trabalho'] },
      { id: 'idade', curto: 'Faixa de idade', tipo: 'unica', titulo: 'Sua faixa de idade',
        opcoes: ['Até 29', '30 a 39', '40 a 49', '50 a 59', '60 ou mais'] },
      { id: 'cidade', curto: 'Cidade de partida', tipo: 'texto_curto', titulo: 'De que cidade você costuma partir?', placeholder: 'Ex.: Belo Horizonte, MG' }
    ]
  },
  {
    codigo: 'DST', nome: 'Destinos',
    titulo: 'Para onde o seu coração aponta',
    curiosidade: 'O mesmo trecho pode custar quantidades bem diferentes de milhas dependendo do programa usado para emitir. Saber onde procurar muda a conta.',
    perguntas: [
      { id: 'destinos', curto: 'Destinos (12 meses)', tipo: 'multipla', obrigatoria: true, titulo: 'Para onde você quer ir nos próximos 12 meses?', ajuda: 'Marque quantos quiser',
        opcoes: ['Nordeste e praias do Brasil', 'Serra e interior do Brasil', 'América do Sul', 'Estados Unidos e Canadá',
                 'Caribe e México', 'Europa', 'Ásia', 'África e Oriente Médio', 'Oceania', 'Ainda não sei'] },
      { id: 'viagem_sonho', curto: 'Viagem dos sonhos', tipo: 'texto', titulo: 'Qual é a viagem dos seus sonhos?', ajuda: 'Opcional, mas adoramos ler.',
        placeholder: 'Ex.: ver a aurora boreal na Noruega com a família' }
    ]
  },
  {
    codigo: 'PLN', nome: 'Planejamento',
    titulo: 'Como você planeja hoje',
    curiosidade: 'A localização do hotel costuma pesar mais na experiência do que uma estrela a mais na fachada: ela decide quanto tempo você passa em deslocamento.',
    perguntas: [
      { id: 'como_planeja', curto: 'Como planeja', tipo: 'multipla', obrigatoria: true, titulo: 'Como você organiza suas viagens?', ajuda: 'Marque quantas quiser',
        opcoes: ['Pesquiso e compro tudo sozinho(a)', 'Uso sites e apps de reserva', 'Uso agência de viagens',
                 'Peço ajuda a alguém que entende de milhas', 'Outra pessoa da família resolve'] },
      { id: 'maior_trabalho', curto: 'O que dá trabalho', tipo: 'multipla', obrigatoria: true, max: 3, titulo: 'O que mais dá trabalho na hora de planejar?', ajuda: 'Escolha até 3',
        opcoes: ['Achar passagem com bom preço', 'Entender e usar milhas', 'Escolher hotel e bairro', 'Montar o roteiro dia a dia',
                 'Documentos, vistos e seguro', 'Transporte no destino', 'Resolver imprevistos na viagem', 'Falta de tempo para pesquisar'] },
      { id: 'problemas', curto: 'Problemas que já teve', tipo: 'multipla', titulo: 'Já aconteceu com você?', ajuda: 'Marque o que já viveu',
        opcoes: ['Paguei caro e depois achei mais barato', 'Perdi milhas por vencimento', 'Fiquei em hotel mal localizado',
                 'Voo cancelado e não sabia o que fazer', 'Perdi uma conexão', 'Roteiro corrido demais',
                 'Problema com documento ou visto', 'Nada disso, ainda bem'] }
    ]
  },
  {
    codigo: 'MIL', nome: 'Milhas',
    titulo: 'Suas milhas e seus cartões',
    curiosidade: 'Pontos de cartão transferidos para companhias aéreas durante campanhas com bônus podem render bem mais milhas do que numa transferência comum.',
    calculadora: true,
    perguntas: [
      { id: 'programas', curto: 'Programas de milhas', tipo: 'multipla', obrigatoria: true, titulo: 'Em quais programas você tem pontos ou milhas?', ajuda: 'Marque quantos quiser',
        opcoes: ['Smiles', 'LATAM Pass', 'Azul Fidelidade', 'Livelo', 'Esfera', 'Pontos do banco ou cartão',
                 'Programa de hotel', 'Não tenho', 'Não sei'] },
      { id: 'saldo', curto: 'Saldo de milhas', tipo: 'unica', titulo: 'Somando tudo, quanto você tem, mais ou menos?',
        opcoes: ['Até 10 mil', '10 mil a 50 mil', '50 mil a 100 mil', '100 mil a 300 mil', 'Mais de 300 mil', 'Não faço ideia'] },
      { id: 'usa_milhas', curto: 'Relação com as milhas', tipo: 'unica', obrigatoria: true, titulo: 'Como você se relaciona com suas milhas?',
        opcoes: ['Uso bem e sei o que estou fazendo', 'Uso às vezes, sem muita estratégia', 'Acumulo, mas não sei como usar',
                 'Já perdi milhas por vencimento', 'Não acumulo milhas'] },
      { id: 'gasto_cartao', curto: 'Gasto no cartão/mês', tipo: 'unica', titulo: 'Quanto você gasta no cartão de crédito por mês?', ajuda: 'Só a faixa, para estimar quanto você poderia acumular',
        opcoes: ['Até R$ 2 mil', 'R$ 2 a 5 mil', 'R$ 5 a 10 mil', 'R$ 10 a 20 mil', 'Mais de R$ 20 mil', 'Prefiro não dizer'] },
      { id: 'cartao_banco', curto: 'Banco do cartão', tipo: 'unica', titulo: 'De que banco é o cartão que você mais usa?',
        opcoes: ['Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 'Caixa', 'C6 Bank', 'Inter', 'XP ou BTG', 'Outro'] },
      { id: 'cartao_categoria', curto: 'Categoria do cartão', tipo: 'unica', titulo: 'E qual é a categoria dele?', ajuda: 'Vem escrita no cartão ou no app do banco',
        opcoes: ['Comum ou nacional', 'Gold ou Internacional', 'Platinum', 'Black ou Infinite', 'Não sei'] },
      { id: 'cartao_pontua', curto: 'Cartão pontua?', tipo: 'unica', titulo: 'Seu cartão principal acumula pontos?',
        opcoes: ['Sim, e transfiro para companhias aéreas', 'Sim, mas não sei aproveitar', 'Não', 'Não sei'] }
    ]
  },
  {
    codigo: 'EST', nome: 'Estilo',
    titulo: 'O seu jeito de viajar',
    curiosidade: 'Um voo direto às vezes custa pouco mais que o com conexão e devolve um dia inteiro de viagem. Vale comparar os dois antes de decidir.',
    perguntas: [
      { id: 'cabine', curto: 'Cabine preferida', tipo: 'unica', titulo: 'Em voos longos, você prefere…',
        opcoes: ['Econômica, o mais barato possível', 'Econômica, com assento melhor', 'Executiva quando der com milhas', 'Executiva sempre'] },
      { id: 'conexao', curto: 'Conexões', tipo: 'unica', titulo: 'E as conexões?',
        opcoes: ['Só voo direto', 'Aceito uma conexão se economizar', 'Tanto faz, se o preço compensar'] },
      { id: 'hotel', curto: 'Prioridade no hotel', tipo: 'unica', titulo: 'O que pesa mais na escolha do hotel?',
        opcoes: ['Localização', 'Conforto e serviço', 'Preço', 'Experiência única'] },
      { id: 'ritmo', curto: 'Ritmo', tipo: 'unica', titulo: 'Seu ritmo de viagem',
        opcoes: ['Tranquilo, com tempo livre', 'Equilibrado', 'Intenso, quero ver tudo'] },
      { id: 'orcamento', curto: 'Orçamento por pessoa', tipo: 'unica', titulo: 'Numa viagem internacional, quanto costuma gastar por pessoa, com tudo incluído?',
        opcoes: ['Até R$ 8 mil', 'R$ 8 a 15 mil', 'R$ 15 a 25 mil', 'R$ 25 a 40 mil', 'Mais de R$ 40 mil', 'Ainda não viajei para fora'] }
    ]
  },
  {
    codigo: 'CNS', nome: 'Consultoria',
    titulo: 'E se alguém cuidasse disso por você?',
    curiosidade: 'Uma boa consultoria começa pelo que você já tem: seus cartões, seus pontos e seus planos. Sem gastar a mais só para acumular.',
    perguntas: [
      { id: 'interesse', tipo: 'grade', obrigatoria: true, titulo: 'Quanto estes serviços te interessam?',
        colunas: ['Quero muito', 'Talvez', 'Não preciso'],
        linhas: [
          { id: 'int_diagnostico', curto: 'Interesse: diagnóstico', rotulo: 'Diagnóstico de milhas e cartões', descricao: 'Análise dos seus programas, vencimentos e cartões, com um plano de ação.' },
          { id: 'int_planejamento', curto: 'Interesse: planejamento', rotulo: 'Planejamento de viagem sob medida', descricao: 'Passagens, hotéis, roteiro e logística escolhidos para você.' },
          { id: 'int_acompanhamento', curto: 'Interesse: acompanhamento', rotulo: 'Acompanhamento contínuo', descricao: 'Planejamento do ano, alertas de oportunidade e suporte durante as viagens.' }
        ] },
      { id: 'preco_diagnostico', curto: 'Pagaria: diagnóstico', tipo: 'unica', titulo: 'Quanto pagaria por um diagnóstico de milhas e cartões?',
        opcoes: ['Até R$ 150', 'R$ 150 a 300', 'R$ 300 a 500', 'Mais de R$ 500', 'Não pagaria'] },
      { id: 'preco_planejamento', curto: 'Pagaria: planejamento', tipo: 'unica', titulo: 'E pelo planejamento completo de uma viagem internacional?',
        opcoes: ['Até R$ 300', 'R$ 300 a 700', 'R$ 700 a 1.500', 'Mais de R$ 1.500', 'Não pagaria'] },
      { id: 'preco_mensal', curto: 'Pagaria: gestão anual', tipo: 'unica', titulo: 'Quanto você estaria disposto(a) a pagar por um ano de gestão das suas milhas?', ajuda: "Imagine ter alguém ao seu lado para transformar os pontos do cartão em possibilidades de viagem. Acompanhamos seus pontos e vencimentos, orientamos como acumular e ajudamos você a encontrar boas formas de usar suas milhas para chegar ao próximo destino.\n\nAs opções abaixo mostram o valor anual do serviço e o equivalente por mês.",
        opcoes: ['Menos de R$ 6 mil/ano — abaixo de R$ 500/mês', 'De R$ 6 mil a menos de R$ 9 mil/ano — R$ 500 a menos de R$ 750/mês', 'De R$ 9 mil a R$ 12 mil/ano — R$ 750 a R$ 1.000/mês', 'Mais de R$ 12 mil/ano — acima de R$ 1.000/mês', 'Não contrataria'] },
      { id: 'confianca', curto: 'O que gera confiança', tipo: 'multipla', max: 3, titulo: 'O que faria você confiar numa consultoria de viagens?', ajuda: 'Escolha até 3',
        opcoes: ['Indicação de alguém conhecido', 'Depoimentos de clientes', 'Transparência sobre preços e comissões',
                 'Atendimento pelo WhatsApp', 'Suporte durante a viagem', 'Conteúdo útil no Instagram', 'Garantia de satisfação'] }
    ]
  }
];

// Último trecho: contato opcional. Colunas fixas na planilha.
var CONTATO = {
  codigo: 'DES', nome: 'Desembarque',
  interesse: { id: 'contato_interesse', curto: 'Quer contato?', titulo: 'Quer conversar com a gente?',
    opcoes: ['Sim, quero uma conversa', 'Só me avise quando lançar', 'Não, obrigado(a)'] },
  campos: [
    { id: 'contato_nome', rotulo: 'Primeiro nome' },
    { id: 'contato_whatsapp', rotulo: 'WhatsApp' },
    { id: 'contato_email', rotulo: 'E-mail' },
    { id: 'contato_consentimento', rotulo: 'Autorizou contato' }
  ]
};
