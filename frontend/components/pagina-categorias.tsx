'use client'

import { Edit3, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useApagarCategoria, useCategorias, useGuardarCategoria } from '@/lib/categorias'
import { PALETA_CATEGORIAS } from '@/lib/cores'
import type { CategoriaComTotal } from '@/lib/tipos'
import { Card, Header } from './ui-comum'

export default function PaginaCategorias() {
  const [modal, setModal] = useState<{ categoria?: CategoriaComTotal } | null>(null)
  const { data: categorias, isLoading, isError, error } = useCategorias()
  const apagar = useApagarCategoria()

  function remover(categoria: CategoriaComTotal) {
    const aviso = `Apagar a categoria "${categoria.nome}"? Os orçamentos desta categoria também são apagados.`
    if (window.confirm(aviso)) apagar.mutate(categoria.id)
  }

  return (
    <>
      <Header
        title="Categorias"
        subtitle="Organiza os teus movimentos."
        onMenu={() => {}}
        action={
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="size-4" />
            Nova categoria
          </button>
        }
      />

      {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
      {isError && <p className="text-sm text-rose-600">{error.message}</p>}
      {apagar.isError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{apagar.error.message}</p>
      )}

      {categorias && (
        <Card className="max-w-2xl divide-y divide-slate-100 overflow-hidden">
          {categorias.map((c) => {
            const emUso = c.totalMovimentos > 0
            return (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.cor ?? '#cbd5e1' }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{c.nome}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {c.totalMovimentos === 1 ? '1 movimento' : `${c.totalMovimentos} movimentos`}
                  </p>
                </div>
                <div className="flex">
                  <button onClick={() => setModal({ categoria: c })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar">
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() => remover(c)}
                    disabled={emUso}
                    title={emUso ? 'Não podes apagar uma categoria que tem movimentos' : 'Apagar'}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label="Apagar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {modal && <ModalCategoria categoria={modal.categoria} onClose={() => setModal(null)} />}
    </>
  )
}

function ModalCategoria({ categoria, onClose }: { categoria?: CategoriaComTotal; onClose: () => void }) {
  const guardar = useGuardarCategoria()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [cor, setCor] = useState<string | null>(categoria?.cor ?? null)
  const [erro, setErro] = useState<string | null>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    guardar.mutate(
      { id: categoria?.id, dados: { nome, cor } },
      { onSuccess: onClose, onError: (e) => setErro(e.message) },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-950">{categoria ? 'Editar categoria' : 'Nova categoria'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="text-sm font-medium text-slate-700">
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Viagens"
              required
              maxLength={50}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Cor</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {PALETA_CATEGORIAS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setCor(opcao)}
                  aria-label={`Cor ${opcao}`}
                  aria-pressed={cor === opcao}
                  className={`size-8 rounded-full ${cor === opcao ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                  style={{ backgroundColor: opcao }}
                />
              ))}
              <button
                type="button"
                onClick={() => setCor(null)}
                aria-pressed={cor === null}
                className={`rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 ${cor === null ? 'bg-slate-100 ring-2 ring-slate-900 ring-offset-2' : ''}`}
              >
                Sem cor
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Sem cor, os gráficos escolhem uma automaticamente.</p>
          </div>
        </div>

        {erro && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={guardar.isPending} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {guardar.isPending ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}