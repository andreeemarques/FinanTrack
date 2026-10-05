'use client'

import { ArrowUpRight, ChevronLeft, ChevronRight, Edit3, PiggyBank, Plus, Trash2, Wallet, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useCategorias } from '@/lib/categorias'
import {
  centimosParaTexto,
  eurosParaCentimos,
  formatarEuros,
  formatarMes,
  mesAtual,
  somarMeses,
} from '@/lib/formatos'
import {
  useApagarOrcamento,
  useAtualizarOrcamento,
  useCriarOrcamento,
  useOrcamentos,
} from '@/lib/orcamentos'
import type { Categoria, ItemOrcamento } from '@/lib/tipos'
import { Card, Header } from './ui-comum'

const classeCampo =
  'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400'

export default function PaginaOrcamento() {
  const [mes, setMes] = useState(mesAtual)
  const [modal, setModal] = useState<{ orcamento?: ItemOrcamento } | null>(null)

  const { data, isLoading, isError, error, isPlaceholderData } = useOrcamentos(mes)
  const { data: categorias } = useCategorias()
  const apagar = useApagarOrcamento()

  const totais = data?.totais
  const percentagemUsada =
    totais && totais.limiteCentimos > 0
      ? Math.round((totais.gastoCentimos / totais.limiteCentimos) * 100)
      : 0

  // Só se pode criar orçamento para categorias que ainda não têm um neste mês
  const categoriasLivres = (categorias ?? []).filter(
    (c) => !data?.orcamentos.some((o) => o.categoria.id === c.id),
  )

  function remover(orcamento: ItemOrcamento) {
    if (window.confirm(`Apagar o orçamento de "${orcamento.categoria.nome}"?`)) {
      apagar.mutate(orcamento.id)
    }
  }

  return (
    <>
      <Header
        title="Orçamento"
        subtitle="Mantém os teus gastos sob controlo."
        onMenu={() => {}}
        action={
          <button
            onClick={() => setModal({})}
            disabled={!data}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Plus className="size-4" />
            Criar orçamento
          </button>
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <button onClick={() => setMes(somarMeses(mes, -1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-40 text-center text-sm font-semibold text-slate-800">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMeses(mes, 1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" aria-label="Mês seguinte">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
      {isError && <p className="text-sm text-rose-600">{error.message}</p>}
      {apagar.isError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{apagar.error.message}</p>
      )}

      {data && totais && (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Indicador rotulo="Orçamento total" valor={formatarEuros(totais.limiteCentimos)} nota="Neste mês" icone={Wallet} tom="bg-slate-100 text-slate-700" />
            <Indicador rotulo="Total gasto" valor={formatarEuros(totais.gastoCentimos)} nota={`${percentagemUsada}% utilizado`} icone={ArrowUpRight} tom="bg-amber-100 text-amber-700" />
            <Indicador rotulo="Disponível" valor={formatarEuros(totais.disponivelCentimos)} nota={totais.limiteCentimos > 0 ? `${100 - percentagemUsada}% restante` : 'Sem orçamentos'} icone={PiggyBank} tom="bg-emerald-100 text-emerald-700" />
          </div>

          {data.orcamentos.length === 0 ? (
            <Card className="mt-6 px-6 py-10 text-center">
              <p className="text-sm text-slate-500">Ainda não tens orçamentos neste mês.</p>
              <button onClick={() => setModal({})} className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Criar o primeiro orçamento
              </button>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data.orcamentos.map((o) => {
                const pct = Math.round((o.gastoCentimos / o.limiteCentimos) * 100)
                const ultrapassou = o.restanteCentimos < 0
                const cor = ultrapassou ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                return (
                  <Card key={o.id} className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                        {o.categoria.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{o.categoria.nome}</p>
                        <p className="text-sm text-slate-400">
                          {formatarEuros(o.gastoCentimos)} de {formatarEuros(o.limiteCentimos)}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${ultrapassou ? 'text-rose-600' : 'text-slate-700'}`}>{pct}%</span>
                      <div className="flex">
                        <button onClick={() => setModal({ orcamento: o })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar">
                          <Edit3 className="size-4" />
                        </button>
                        <button onClick={() => remover(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Apagar">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-400">
                      <span>Utilizado</span>
                      <span className={ultrapassou ? 'font-medium text-rose-600' : ''}>
                        {ultrapassou
                          ? `Ultrapassado em ${formatarEuros(-o.restanteCentimos)}`
                          : `Restam ${formatarEuros(o.restanteCentimos)}`}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {modal && (
        <ModalOrcamento
          mes={mes}
          orcamento={modal.orcamento}
          categoriasLivres={categoriasLivres}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function Indicador({
  rotulo,
  valor,
  nota,
  icone: Icone,
  tom,
}: {
  rotulo: string
  valor: string
  nota: string
  icone: LucideIcon
  tom: string
}) {
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
      <p className="mt-4 text-xs text-slate-400">{nota}</p>
    </Card>
  )
}

function ModalOrcamento({
  mes,
  orcamento,
  categoriasLivres,
  onClose,
}: {
  mes: string
  orcamento?: ItemOrcamento
  categoriasLivres: Categoria[]
  onClose: () => void
}) {
  const criar = useCriarOrcamento()
  const atualizar = useAtualizarOrcamento()
  const [categoriaId, setCategoriaId] = useState('')
  const [limite, setLimite] = useState(orcamento ? centimosParaTexto(orcamento.limiteCentimos) : '')
  const [erro, setErro] = useState<string | null>(null)

  const aGuardar = criar.isPending || atualizar.isPending
  const semCategorias = !orcamento && categoriasLivres.length === 0

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    const limiteCentimos = eurosParaCentimos(limite)
    if (!limiteCentimos) {
      setErro('Valor inválido. Usa o formato 500,00.')
      return
    }
    setErro(null)
    const opcoes = { onSuccess: onClose, onError: (e: Error) => setErro(e.message) }
    if (orcamento) {
      atualizar.mutate({ id: orcamento.id, limiteCentimos }, opcoes)
    } else {
      criar.mutate({ categoriaId, limiteCentimos, mes }, opcoes)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{orcamento ? 'Editar orçamento' : 'Criar orçamento'}</h2>
            <p className="mt-1 text-sm text-slate-500">{formatarMes(mes)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {orcamento ? (
            <p className="text-sm font-medium text-slate-700">
              Categoria
              <span className="mt-2 block rounded-xl bg-slate-50 px-3 py-2.5 font-normal text-slate-600">{orcamento.categoria.nome}</span>
            </p>
          ) : (
            <label className="text-sm font-medium text-slate-700">
              Categoria
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required disabled={semCategorias} className={classeCampo}>
                <option value="">{semCategorias ? 'Todas as categorias já têm orçamento' : 'Escolher...'}</option>
                {categoriasLivres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm font-medium text-slate-700">
            Limite mensal (€)
            <input value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="0,00" inputMode="decimal" required className={classeCampo} />
          </label>
        </div>

        {erro && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={aGuardar || semCategorias} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {aGuardar ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}