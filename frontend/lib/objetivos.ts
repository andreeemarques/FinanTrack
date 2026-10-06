import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pedido } from './api'
import type { Contribuicao, ObjetivoPoupanca, ResumoObjetivos } from './tipos'

export interface DadosObjetivo {
  nome: string
  metaCentimos: number
  dataLimite: string | null
}

export function useObjetivos() {
  return useQuery({
    queryKey: ['objetivos', 'lista'],
    queryFn: () => pedido<ResumoObjetivos>('/objetivos'),
  })
}

export function useContribuicoes(objetivoId: string) {
  return useQuery({
    queryKey: ['objetivos', 'contribuicoes', objetivoId],
    queryFn: () => pedido<Contribuicao[]>(`/objetivos/${objetivoId}/contribuicoes`),
  })
}

// Todas as chaves começam por 'objetivos', por isso uma só invalidação atualiza a lista e os históricos
function useInvalidarObjetivos() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['objetivos'] })
    queryClient.invalidateQueries({ queryKey: ['resumo'] }) // o "poupado" do Dashboard vem das contribuições
  }
}

// Cria (sem id) ou edita (com id)
export function useGuardarObjetivo() {
  const invalidar = useInvalidarObjetivos()
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosObjetivo }) =>
      id
        ? pedido<ObjetivoPoupanca>(`/objetivos/${id}`, { metodo: 'PATCH', corpo: dados })
        : pedido<ObjetivoPoupanca>('/objetivos', { metodo: 'POST', corpo: dados }),
    onSuccess: invalidar,
  })
}

export function useApagarObjetivo() {
  const invalidar = useInvalidarObjetivos()
  return useMutation({
    mutationFn: (id: string) => pedido<void>(`/objetivos/${id}`, { metodo: 'DELETE' }),
    onSuccess: invalidar,
  })
}

export function useAdicionarContribuicao() {
  const invalidar = useInvalidarObjetivos()
  return useMutation({
    mutationFn: ({ objetivoId, valorCentimos, data }: { objetivoId: string; valorCentimos: number; data: string }) =>
      pedido<Contribuicao>(`/objetivos/${objetivoId}/contribuicoes`, {
        metodo: 'POST',
        corpo: { valorCentimos, data },
      }),
    onSuccess: invalidar,
  })
}

export function useRemoverContribuicao() {
  const invalidar = useInvalidarObjetivos()
  return useMutation({
    mutationFn: ({ objetivoId, id }: { objetivoId: string; id: string }) =>
      pedido<void>(`/objetivos/${objetivoId}/contribuicoes/${id}`, { metodo: 'DELETE' }),
    onSuccess: invalidar,
  })
}