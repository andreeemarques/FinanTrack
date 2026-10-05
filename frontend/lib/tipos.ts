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