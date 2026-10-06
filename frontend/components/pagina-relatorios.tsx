'use client'

import { ArrowUpRight, FileText, Home, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centimosParaTexto, formatarEuros, formatarMesCurto, formatarPercentagem } from '@/lib/formatos'
import { useRelatorios } from '@/lib/resumo'
import type { Periodo, RelatoriosResumo } from '@/lib/tipos'
import { Card, Estatistica, Header } from './ui-comum'

// Descarrega os dados do relatório em CSV (separador ";" e UTF-8 com BOM, para abrir bem no Excel)
function exportarCsv(relatorio: RelatoriosResumo) {
  const totalReceitas = relatorio.mensal.reduce((soma, m) => soma + m.receitasCentimos, 0)
  const totalDespesas = relatorio.mensal.reduce((soma, m) => soma + m.despesasCentimos, 0)

  const linhas = [
    ['Mês', 'Receitas (€)', 'Despesas (€)', 'Saldo (€)'],
    ...relatorio.mensal.map((m) => [
      m.mes,
      centimosParaTexto(m.receitasCentimos),
      centimosParaTexto(m.despesasCentimos),
      centimosParaTexto(m.receitasCentimos - m.despesasCentimos),
    ]),
    [
      'Total',
      centimosParaTexto(totalReceitas),
      centimosParaTexto(totalDespesas),
      centimosParaTexto(totalReceitas - totalDespesas),
    ],
  ]

  const csv = '\uFEFF' + linhas.map((linha) => linha.join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const ligacao = document.createElement('a')
  ligacao.href = url
  ligacao.download = `relatorio-${relatorio.periodo.de}-${relatorio.periodo.ate}.csv`
  ligacao.click()
  URL.revokeObjectURL(url)
}

export default function PaginaRelatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('6meses')
  const { data, isLoading, isError, error, isPlaceholderData } = useRelatorios(periodo)

  const dadosGrafico = (data?.mensal ?? []).map((m) => ({
    mes: formatarMesCurto(m.mes),
    receitas: m.receitasCentimos,
    despesas: m.despesasCentimos,
  }))

  return (
    <>
      <Header
        title="Relatórios"
        subtitle="Analisa a evolução das tuas finanças."
        onMenu={() => {}}
        action={
          <div className="flex gap-2">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none"
            >
              <option value="6meses">Últimos 6 meses</option>
              <option value="ano">Este ano</option>
            </select>
            <button
              onClick={() => data && exportarCsv(data)}
              disabled={!data}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:flex"
            >
              <FileText className="size-4" />
              Exportar
            </button>
          </div>
        }
      />

      {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
      {isError && <p className="text-sm text-rose-600">{error.message}</p>}

      {data && (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Estatistica
              rotulo="Média mensal de despesas"
              valor={formatarEuros(data.mediaMensalDespesasCentimos)}
              icone={ArrowUpRight}
              tom="bg-rose-100 text-rose-700"
              nota={`Em ${data.periodo.meses} meses`}
            />
            <Estatistica
              rotulo="Maior categoria"
              valor={data.maiorCategoria?.nome ?? '—'}
              icone={Home}
              tom="bg-sky-100 text-sky-700"
              nota={data.maiorCategoria ? `${formatarPercentagem(data.maiorCategoria.percentagem)} das despesas` : 'Sem despesas no período'}
            />
            <Estatistica
              rotulo="Taxa de poupança"
              valor={data.taxaPoupancaPercentagem !== null ? formatarPercentagem(data.taxaPoupancaPercentagem) : '—'}
              icone={TrendingUp}
              tom="bg-emerald-100 text-emerald-700"
              nota={data.taxaPoupancaPercentagem !== null ? 'Das receitas que ficaram por gastar' : 'Sem receitas no período'}
            />
          </div>

          <Card className="mt-6 p-6">
            <div className="mb-6">
              <h2 className="font-semibold text-slate-950">Receitas vs. despesas</h2>
              <p className="mt-1 text-sm text-slate-500">Comparação mensal</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} barGap={8}>
                  <CartesianGrid vertical={false} stroke="#eef2f6" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${Math.round(Number(v) / 100)} €`} />
                  <Tooltip formatter={(v) => formatarEuros(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}