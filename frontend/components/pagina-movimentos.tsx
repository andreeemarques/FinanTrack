'use client'

import { Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCategorias } from '@/lib/categorias'
import { centimosParaTexto, eurosParaCentimos, formatarData, formatarEuros } from '@/lib/formatos'
import { useApagarMovimento, useGuardarMovimento, useMovimentos } from '@/lib/movimentos'
import { ROTULOS_METODO } from '@/lib/tipos'
import type { MetodoPagamento, Movimento, TipoMovimento } from '@/lib/tipos'
import { Card, Header } from './ui-comum'

const LIMITE = 10
const COLUNAS = 'md:grid-cols-[1fr_1.5fr_1fr_0.8fr_1fr_0.8fr_72px]'
const classeSelect = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none'
const classeCampo = 'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400'

export default function PaginaMovimentos() {
  const [texto, setTexto] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [tipo, setTipo] = useState<'' | TipoMovimento>('')
  const [categoriaId, setCategoriaId] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState<{ movimento?: Movimento } | null>(null)

  const { data: categorias } = useCategorias()
  const apagar = useApagarMovimento()
  const { data, isLoading, isError, error } = useMovimentos({
    pagina,
    limite: LIMITE,
    tipo: tipo || undefined,
    categoriaId: categoriaId || undefined,
    pesquisa: pesquisa || undefined,
  })

  // Só pesquisa 300 ms depois de parares de escrever
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setPesquisa(texto.trim())
      setPagina(1)
    }, 300)
    return () => clearTimeout(temporizador)
  }, [texto])

  // Se apagares o último movimento de uma página, recua para a anterior
  useEffect(() => {
    if (data && pagina > 1 && pagina > data.meta.totalPaginas) {
      setPagina(Math.max(1, data.meta.totalPaginas))
    }
  }, [data, pagina])

  const movimentos = data?.dados ?? []
  const meta = data?.meta
  const inicio = meta && meta.total > 0 ? (meta.pagina - 1) * meta.limite + 1 : 0
  const fim = meta ? Math.min(meta.pagina * meta.limite, meta.total) : 0

  function remover(movimento: Movimento) {
    if (window.confirm(`Apagar "${movimento.descricao}"?`)) apagar.mutate(movimento.id)
  }

  return (
    <>
      <Header
        title="Movimentos"
        subtitle="Consulta e gere todas as tuas transações."
        onMenu={() => {}}
        action={
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="size-4" />
            Adicionar movimento
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pesquisar movimentos"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value as '' | TipoMovimento)
            setPagina(1)
          }}
          className={classeSelect}
        >
          <option value="">Todos os tipos</option>
          <option value="RECEITA">Receitas</option>
          <option value="DESPESA">Despesas</option>
        </select>
        <select
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value)
            setPagina(1)
          }}
          className={classeSelect}
        >
          <option value="">Todas as categorias</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {apagar.isError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{apagar.error.message}</p>
      )}

      <Card className="overflow-hidden">
        <div className={`hidden grid-cols-[1fr_1.5fr_1fr_0.8fr_1fr_0.8fr_72px] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid`}>
          <span>Data</span>
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Método</span>
          <span>Valor</span>
          <span />
        </div>

        {isLoading && <p className="px-6 py-8 text-sm text-slate-400">A carregar...</p>}
        {isError && <p className="px-6 py-8 text-sm text-rose-600">{error.message}</p>}
        {data && movimentos.length === 0 && (
          <p className="px-6 py-8 text-sm text-slate-400">Não há movimentos para mostrar.</p>
        )}

        <div className="divide-y divide-slate-100">
          {movimentos.map((m) => {
            const receita = m.tipo === 'RECEITA'
            return (
              <div key={m.id} className={`grid gap-2 px-6 py-4 md:items-center md:gap-4 ${COLUNAS}`}>
                <span className="text-xs text-slate-400">{formatarData(m.data)}</span>
                <span className="font-medium text-slate-800">{m.descricao}</span>
                <span className="text-sm text-slate-500">{m.categoria.nome}</span>
                <span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${receita ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {receita ? 'Receita' : 'Despesa'}
                  </span>
                </span>
                <span className="text-sm text-slate-500">{ROTULOS_METODO[m.metodoPagamento]}</span>
                <span className={`font-semibold ${receita ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {receita ? '+' : '-'}
                  {formatarEuros(m.valorCentimos)}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ movimento: m })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar">
                    <Edit3 className="size-4" />
                  </button>
                  <button onClick={() => remover(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Apagar">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
          <span>
            A mostrar {inicio}–{fim} de {meta?.total ?? 0} movimentos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => p - 1)}
              disabled={pagina <= 1}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              Página {meta?.pagina ?? 1} de {Math.max(meta?.totalPaginas ?? 1, 1)}
            </span>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={!meta || pagina >= meta.totalPaginas}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Seguinte
            </button>
          </div>
        </div>
      </Card>

      {modal && <ModalMovimento movimento={modal.movimento} onClose={() => setModal(null)} />}
    </>
  )
}

function ModalMovimento({ movimento, onClose }: { movimento?: Movimento; onClose: () => void }) {
  const { data: categorias } = useCategorias()
  const guardar = useGuardarMovimento()

  const [tipo, setTipo] = useState<TipoMovimento>(movimento?.tipo ?? 'DESPESA')
  const [valor, setValor] = useState(movimento ? centimosParaTexto(movimento.valorCentimos) : '')
  const [descricao, setDescricao] = useState(movimento?.descricao ?? '')
  const [categoriaId, setCategoriaId] = useState(movimento?.categoriaId ?? '')
  const [metodo, setMetodo] = useState<MetodoPagamento>(movimento?.metodoPagamento ?? 'CARTAO')
  const [dataMovimento, setDataMovimento] = useState(movimento?.data ?? new Date().toLocaleDateString('sv-SE'))
  const [erro, setErro] = useState<string | null>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    const valorCentimos = eurosParaCentimos(valor)
    if (!valorCentimos) {
      setErro('Valor inválido. Usa o formato 54,20.')
      return
    }
    setErro(null)
    guardar.mutate(
      {
        id: movimento?.id,
        dados: { tipo, valorCentimos, data: dataMovimento, descricao, metodoPagamento: metodo, categoriaId },
      },
      { onSuccess: onClose, onError: (e) => setErro(e.message) },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={submeter} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{movimento ? 'Editar movimento' : 'Adicionar movimento'}</h2>
            <p className="mt-1 text-sm text-slate-500">Regista uma receita ou despesa.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimento)} className={classeCampo}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Valor (€)
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" inputMode="decimal" required className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Descrição
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Supermercado" required maxLength={200} className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Categoria
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required className={classeCampo}>
              <option value="">Escolher...</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Método de pagamento
            <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagamento)} className={classeCampo}>
              {Object.entries(ROTULOS_METODO).map(([valorMetodo, rotulo]) => (
                <option key={valorMetodo} value={valorMetodo}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Data
            <input type="date" value={dataMovimento} onChange={(e) => setDataMovimento(e.target.value)} required className={classeCampo} />
          </label>
        </div>

        {erro && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={guardar.isPending} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {guardar.isPending ? 'A guardar...' : 'Guardar movimento'}
          </button>
        </div>
      </form>
    </div>
  )
}