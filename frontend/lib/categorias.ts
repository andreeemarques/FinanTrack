import { useQuery } from '@tanstack/react-query'
import { pedido } from './api'
import type { Categoria } from './tipos'

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => pedido<Categoria[]>('/categorias'),
    staleTime: 5 * 60_000,
  })
}