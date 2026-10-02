'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatarData, formatarEuros } from '@/lib/formatos'
import { useMovimentos } from '@/lib/movimentos'
import { ROTULOS_METODO } from '@/lib/tipos'

export default function MovimentosRecentes() {
  const { data, isLoading, isError } = useMovimentos({ pagina: 1, limite: 4 })

  if (isLoading) return <p className="px-6 py-6 text-sm text-slate-400">A carregar...</p>
  if (isError) return <p className="px-6 py-6 text-sm text-rose-600">Não foi possível carregar os movimentos.</p>
  if (!data || data.dados.length === 0) {
    return <p className="px-6 py-6 text-sm text-slate-400">Ainda não tens movimentos.</p>
  }

  return (
    <div className="divide-y divide-slate-100">
      {data.dados.map((m) => {
        const receita = m.tipo === 'RECEITA'
        const Icone = receita ? ArrowDownLeft : ArrowUpRight
        return (
          <div key={m.id} className="flex items-center gap-3 px-6 py-4">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${receita ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Icone className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{m.descricao}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {m.categoria.nome} · {ROTULOS_METODO[m.metodoPagamento]}
              </p>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">{formatarData(m.data)}</p>
            <p className={`text-sm font-semibold ${receita ? 'text-emerald-600' : 'text-slate-800'}`}>
              {receita ? '+' : '-'}
              {formatarEuros(m.valorCentimos)}
            </p>
          </div>
        )
      })}
    </div>
  )
}