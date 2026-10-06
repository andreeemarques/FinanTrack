import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { pedido } from './api'
import type { DashboardResumo, Periodo, RelatoriosResumo } from './tipos'

export function useDashboard(mes: string) {
  return useQuery({
    queryKey: ['resumo', 'dashboard', mes],
    queryFn: () => pedido<DashboardResumo>(`/resumo/dashboard?mes=${mes}`),
    placeholderData: keepPreviousData,
  })
}

export function useRelatorios(periodo: Periodo) {
  return useQuery({
    queryKey: ['resumo', 'relatorios', periodo],
    queryFn: () => pedido<RelatoriosResumo>(`/resumo/relatorios?periodo=${periodo}`),
    placeholderData: keepPreviousData,
  })
}