import { formatarDia, somarMeses } from '../comum/mes';

type Tipo = 'RECEITA' | 'DESPESA';
type Metodo = 'CARTAO' | 'TRANSFERENCIA' | 'NUMERARIO' | 'MBWAY' | 'DEBITO_DIRETO' | 'OUTRO';

export interface MovimentoDemo {
  categoria: string;
  tipo: Tipo;
  valorCentimos: number;
  data: string; // AAAA-MM-DD
  descricao: string;
  metodoPagamento: Metodo;
}

export interface ObjetivoDemo {
  nome: string;
  metaCentimos: number;
  dataLimite: string | null;
  contribuicoes: { valorCentimos: number; data: string }[];
}

interface ModeloMensal {
  dia: number;
  categoria: string;
  tipo: Tipo;
  valorCentimos: number;
  descricao: string;
  metodoPagamento: Metodo;
  fixo?: boolean; // valores fixos não variam de mês para mês
}

const MODELO_MENSAL: ModeloMensal[] = [
  { dia: 1, categoria: 'Salário', tipo: 'RECEITA', valorCentimos: 185000, descricao: 'Salário', metodoPagamento: 'TRANSFERENCIA', fixo: true },
  { dia: 3, categoria: 'Habitação', tipo: 'DESPESA', valorCentimos: 65000, descricao: 'Renda', metodoPagamento: 'DEBITO_DIRETO', fixo: true },
  { dia: 5, categoria: 'Habitação', tipo: 'DESPESA', valorCentimos: 4500, descricao: 'Eletricidade e água', metodoPagamento: 'DEBITO_DIRETO' },
  { dia: 6, categoria: 'Alimentação', tipo: 'DESPESA', valorCentimos: 6800, descricao: 'Supermercado', metodoPagamento: 'CARTAO' },
  { dia: 9, categoria: 'Transportes', tipo: 'DESPESA', valorCentimos: 4000, descricao: 'Passe mensal', metodoPagamento: 'CARTAO', fixo: true },
  { dia: 12, categoria: 'Entretenimento', tipo: 'DESPESA', valorCentimos: 1599, descricao: 'Subscrição de streaming', metodoPagamento: 'DEBITO_DIRETO', fixo: true },
  { dia: 14, categoria: 'Alimentação', tipo: 'DESPESA', valorCentimos: 5400, descricao: 'Supermercado', metodoPagamento: 'CARTAO' },
  { dia: 16, categoria: 'Alimentação', tipo: 'DESPESA', valorCentimos: 3200, descricao: 'Restaurante', metodoPagamento: 'CARTAO' },
  { dia: 19, categoria: 'Saúde', tipo: 'DESPESA', valorCentimos: 2500, descricao: 'Farmácia', metodoPagamento: 'MBWAY' },
  { dia: 21, categoria: 'Alimentação', tipo: 'DESPESA', valorCentimos: 7100, descricao: 'Supermercado', metodoPagamento: 'CARTAO' },
  { dia: 23, categoria: 'Entretenimento', tipo: 'DESPESA', valorCentimos: 2800, descricao: 'Cinema e jantar', metodoPagamento: 'CARTAO' },
  { dia: 25, categoria: 'Transportes', tipo: 'DESPESA', valorCentimos: 5500, descricao: 'Combustível', metodoPagamento: 'CARTAO' },
  { dia: 27, categoria: 'Outros', tipo: 'DESPESA', valorCentimos: 3500, descricao: 'Presente de aniversário', metodoPagamento: 'MBWAY' },
];

const ORCAMENTOS_DEMO = [
  { categoria: 'Alimentação', limiteCentimos: 30000 },
  { categoria: 'Transportes', limiteCentimos: 12000 },
  { categoria: 'Entretenimento', limiteCentimos: 8000 },
  { categoria: 'Saúde', limiteCentimos: 5000 },
];

const dataDoMes = (mes: string, dia: number) => `${mes}-${String(dia).padStart(2, '0')}`;

// Gera dados de exemplo relativos a "hoje": 6 meses de movimentos, orçamentos do mês e 3 objetivos
export function gerarDadosDemo(hoje: Date) {
  const hojeTexto = formatarDia(hoje);
  const mesCorrente = hojeTexto.slice(0, 7);

  const movimentos: MovimentoDemo[] = [];
  for (let deslocamento = -5; deslocamento <= 0; deslocamento++) {
    const mes = somarMeses(mesCorrente, deslocamento);

    MODELO_MENSAL.forEach(({ dia, fixo, ...modelo }, indice) => {
      const data = dataDoMes(mes, dia);
      if (data > hojeTexto) return; // nunca no futuro
      // Variação determinística de -10% a +10% nos valores que não são fixos
      const variacao = fixo ? 0 : (((indice * 7 + deslocamento * 13 + 100) % 21) - 10) / 100;
      movimentos.push({
        ...modelo,
        valorCentimos: Math.round(modelo.valorCentimos * (1 + variacao)),
        data,
      });
    });

    // De três em três meses, um trabalho extra
    if ((deslocamento + 5) % 3 === 0 && dataDoMes(mes, 15) <= hojeTexto) {
      movimentos.push({
        categoria: 'Outros',
        tipo: 'RECEITA',
        valorCentimos: 25000,
        data: dataDoMes(mes, 15),
        descricao: 'Trabalho extra',
        metodoPagamento: 'TRANSFERENCIA',
      });
    }
  }

  // Contribuições só em meses passados, para nunca ficarem no futuro
  const contribuicao = (deslocamento: number, dia: number, valorCentimos: number) => ({
    valorCentimos,
    data: dataDoMes(somarMeses(mesCorrente, deslocamento), dia),
  });

  const objetivos: ObjetivoDemo[] = [
    {
      nome: 'Férias de verão',
      metaCentimos: 150000,
      dataLimite: dataDoMes(somarMeses(mesCorrente, 4), 15),
      contribuicoes: [contribuicao(-4, 10, 15000), contribuicao(-3, 10, 20000), contribuicao(-2, 10, 15000), contribuicao(-1, 10, 15000)],
    },
    {
      nome: 'Fundo de emergência',
      metaCentimos: 300000,
      dataLimite: null,
      contribuicoes: [-5, -4, -3, -2, -1].map((deslocamento) => contribuicao(deslocamento, 2, 10000)),
    },
    {
      nome: 'Novo portátil',
      metaCentimos: 120000,
      dataLimite: dataDoMes(somarMeses(mesCorrente, 6), 15),
      contribuicoes: [contribuicao(-2, 20, 20000), contribuicao(-1, 20, 25000)],
    },
  ];

  return { movimentos, orcamentos: ORCAMENTOS_DEMO, objetivos };
}