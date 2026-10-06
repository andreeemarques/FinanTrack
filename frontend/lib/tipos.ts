export interface Utilizador {
  id: string
  nome: string
  email: string
  moeda: string
}

export interface RespostaAutenticacao {
  utilizador: Utilizador
  token: string
}

export type TipoMovimento = 'RECEITA' | 'DESPESA'

export type MetodoPagamento =
  | 'CARTAO'
  | 'TRANSFERENCIA'
  | 'NUMERARIO'
  | 'MBWAY'
  | 'DEBITO_DIRETO'
  | 'OUTRO'

export const ROTULOS_METODO: Record<MetodoPagamento, string> = {
  CARTAO: 'Cartão',
  TRANSFERENCIA: 'Transferência',
  NUMERARIO: 'Numerário',
  MBWAY: 'MB WAY',
  DEBITO_DIRETO: 'Débito direto',
  OUTRO: 'Outro',
}

export interface Categoria {
  id: string
  nome: string
  icone: string | null
  cor: string | null
}

export interface Movimento {
  id: string
  tipo: TipoMovimento
  valorCentimos: number
  data: string // AAAA-MM-DD
  descricao: string
  metodoPagamento: MetodoPagamento
  categoriaId: string
  categoria: Categoria
}

// O que se envia à API ao criar ou editar
export type DadosMovimento = Omit<Movimento, 'id' | 'categoria'>

export interface RespostaPaginada<T> {
  dados: T[]
  meta: { pagina: number; limite: number; total: number; totalPaginas: number }
}

export interface ItemOrcamento {
  id: string
  categoria: Categoria
  limiteCentimos: number
  gastoCentimos: number
  restanteCentimos: number // negativo se ultrapassou o limite
}

export interface ResumoOrcamentos {
  mes: string // AAAA-MM
  totais: { limiteCentimos: number; gastoCentimos: number; disponivelCentimos: number }
  orcamentos: ItemOrcamento[]
}

export interface ObjetivoPoupanca {
  id: string
  nome: string
  metaCentimos: number
  dataLimite: string | null // AAAA-MM-DD
  poupadoCentimos: number
  concluido: boolean
  previsaoConclusao: string | null // AAAA-MM-DD
}

export interface ResumoObjetivos {
  totais: { poupadoCentimos: number; metaCentimos: number; poupadoEsteMesCentimos: number }
  objetivos: ObjetivoPoupanca[]
}

export interface Contribuicao {
  id: string
  valorCentimos: number
  data: string // AAAA-MM-DD
}

export interface DashboardResumo {
  mes: string
  saldoCentimos: number
  receitasCentimos: number
  despesasCentimos: number
  poupadoCentimos: number
  // variação face ao mês anterior, em %; null quando não há base de comparação
  variacoes: {
    saldo: number | null
    receitas: number | null
    despesas: number | null
    poupado: number | null
  }
  evolucaoSaldo: { mes: string; saldoCentimos: number }[]
  despesasPorCategoria: {
    categoria: { id: string; nome: string; cor: string | null }
    valorCentimos: number
    percentagem: number
  }[]
}

export type Periodo = '6meses' | 'ano'

export interface RelatoriosResumo {
  periodo: { de: string; ate: string; meses: number }
  mensal: { mes: string; receitasCentimos: number; despesasCentimos: number }[]
  mediaMensalDespesasCentimos: number
  maiorCategoria: { nome: string; valorCentimos: number; percentagem: number } | null
  taxaPoupancaPercentagem: number | null
}