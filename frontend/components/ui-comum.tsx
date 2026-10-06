'use client'

import { ChevronLeft, ChevronRight, Menu, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatarMes, formatarPercentagem, somarMeses } from '@/lib/formatos'

export function Header({
  title,
  subtitle,
  onMenu,
  action,
}: {
  title: string
  subtitle?: string
  onMenu: () => void
  action?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <button onClick={onMenu} className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>
}

// Cartão com um valor e, em baixo, ou a variação face ao mês anterior ou uma nota
export function Estatistica({
  rotulo,
  valor,
  icone: Icone,
  tom,
  variacao,
  invertido = false,
  nota,
}: {
  rotulo: string
  valor: string
  icone: LucideIcon
  tom: string
  variacao?: number | null
  invertido?: boolean // true quando descer é bom (por exemplo, nas despesas)
  nota?: string
}) {
  let rodape: React.ReactNode
  if (nota !== undefined) {
    rodape = <span className="text-slate-400">{nota}</span>
  } else if (variacao === null || variacao === undefined) {
    rodape = <span className="text-slate-400">Sem dados do mês anterior</span>
  } else {
    const bom = invertido ? variacao <= 0 : variacao >= 0
    const Seta = variacao >= 0 ? TrendingUp : TrendingDown
    rodape = (
      <span className={`flex items-center gap-1.5 font-medium ${bom ? 'text-emerald-600' : 'text-rose-600'}`}>
        <Seta className="size-3.5" />
        {variacao > 0 ? '+' : ''}
        {formatarPercentagem(variacao)}
        <span className="font-normal text-slate-400">vs. mês anterior</span>
      </span>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{rotulo}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{valor}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-xl ${tom}`}>
          <Icone className="size-5" />
        </div>
      </div>
      <div className="mt-4 text-xs">{rodape}</div>
    </Card>
  )
}

export function SeletorMes({ mes, onChange }: { mes: string; onChange: (mes: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(somarMeses(mes, -1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-36 text-center text-sm font-semibold text-slate-800">{formatarMes(mes)}</span>
      <button onClick={() => onChange(somarMeses(mes, 1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" aria-label="Mês seguinte">
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}