'use client'

import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAutenticacao } from '@/lib/autenticacao'
import { formatarEuros, formatarMesCurto, formatarPercentagem, mesAtual } from '@/lib/formatos'
import { useDashboard } from '@/lib/resumo'
import MovimentosRecentes from './movimentos-recentes'
import { Card, Estatistica, Header, SeletorMes } from './ui-comum'

const PALETA = ['#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#94a3b8', '#f43f5e', '#14b8a6']

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  return hora < 20 ? 'Boa tarde' : 'Boa noite'
}

export default function PaginaDashboard({ onVerMovimentos }: { onVerMovimentos: () => void }) {
  const { utilizador } = useAutenticacao()
  const [mes, setMes] = useState(mesAtual)
  const { data, isLoading, isError, error, isPlaceholderData } = useDashboard(mes)

  const primeiroNome = utilizador?.nome.split(' ')[0] ?? ''

  // Variação do saldo entre o primeiro e o último mês do gráfico
  const evolucao = data?.evolucaoSaldo ?? []
  const primeiro = evolucao[0]?.saldoCentimos ?? 0
  const ultimo = evolucao[evolucao.length - 1]?.saldoCentimos ?? 0
  const variacaoEvolucao = primeiro !== 0 ? Math.round(((ultimo - primeiro) / Math.abs(primeiro)) * 1000) / 10 : null

  const dadosEvolucao = evolucao.map((e) => ({ mes: formatarMesCurto(e.mes), saldo: e.saldoCentimos }))
  const dadosDespesas = (data?.despesasPorCategoria ?? []).map((d, i) => ({
    nome: d.categoria.nome,
    valor: d.valorCentimos,
    percentagem: d.percentagem,
    cor: d.categoria.cor ?? PALETA[i % PALETA.length],
  }))

  return (
    <>
      <Header
        title={`${saudacao()}, ${primeiroNome} 👋`}
        subtitle="Aqui está o resumo das tuas finanças."
        onMenu={() => {}}
        action={<SeletorMes mes={mes} onChange={setMes} />}
      />

      {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
      {isError && <p className="text-sm text-rose-600">{error.message}</p>}

      {data && (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Estatistica rotulo="Saldo" valor={formatarEuros(data.saldoCentimos)} icone={Wallet} tom="bg-emerald-100 text-emerald-700" variacao={data.variacoes.saldo} />
            <Estatistica rotulo="Receitas" valor={formatarEuros(data.receitasCentimos)} icone={ArrowDownLeft} tom="bg-sky-100 text-sky-700" variacao={data.variacoes.receitas} />
            <Estatistica rotulo="Despesas" valor={formatarEuros(data.despesasCentimos)} icone={ArrowUpRight} tom="bg-rose-100 text-rose-700" variacao={data.variacoes.despesas} invertido />
            <Estatistica rotulo="Poupanças" valor={formatarEuros(data.poupadoCentimos)} icone={PiggyBank} tom="bg-violet-100 text-violet-700" variacao={data.variacoes.poupado} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">Evolução do saldo</h2>
                  <p className="mt-1 text-sm text-slate-500">Últimos 6 meses</p>
                </div>
                {variacaoEvolucao !== null && (
                  <span className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${variacaoEvolucao >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {variacaoEvolucao > 0 ? '+' : ''}
                    {formatarPercentagem(variacaoEvolucao)}
                  </span>
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosEvolucao}>
                    <defs>
                      <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef2f6" />
                    <XAxis
                        dataKey="mes"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        padding={{ left: 24, right: 24 }}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                    />
                    <YAxis hide domain={['dataMin - 20000', 'dataMax + 20000']} />
                    <Tooltip formatter={(v) => formatarEuros(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#10b981" strokeWidth={2.5} fill="url(#balance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <h2 className="font-semibold text-slate-950">Despesas por categoria</h2>
                <p className="mt-1 text-sm text-slate-500">{formatarMesCurto(mes)} de {mes.slice(0, 4)}</p>
              </div>
              {dadosDespesas.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-400">Sem despesas neste mês.</p>
              ) : (
                <>
                  <div className="relative mx-auto mt-2 h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosDespesas} dataKey="valor" nameKey="nome" innerRadius={58} outerRadius={82} paddingAngle={3}>
                          {dadosDespesas.map((d) => (
                            <Cell key={d.nome} fill={d.cor} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatarEuros(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-950">{formatarEuros(data.despesasCentimos)}</span>
                      <span className="text-xs text-slate-400">total gasto</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    {dadosDespesas.map((d) => (
                      <div key={d.nome} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
                        <span className="truncate">{d.nome}</span>
                        <span className="ml-auto font-medium text-slate-700">{formatarPercentagem(d.percentagem)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-semibold text-slate-950">Últimos movimentos</h2>
            <p className="mt-1 text-sm text-slate-500">As tuas transações mais recentes</p>
          </div>
          <button onClick={onVerMovimentos} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Ver todos
          </button>
        </div>
        <MovimentosRecentes />
      </Card>
    </>
  )
}