'use client'

import { Edit3, History, PiggyBank, Plus, Target, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { centimosParaTexto, eurosParaCentimos, formatarData, formatarEuros } from '@/lib/formatos'
import {
  useAdicionarContribuicao,
  useApagarObjetivo,
  useContribuicoes,
  useGuardarObjetivo,
  useObjetivos,
  useRemoverContribuicao,
} from '@/lib/objetivos'
import type { ObjetivoPoupanca } from '@/lib/tipos'
import { Card, Header } from './ui-comum'

const CORES = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
const classeCampo =
  'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400'

type EstadoModal =
  | { tipo: 'objetivo'; objetivo?: ObjetivoPoupanca }
  | { tipo: 'contribuir'; objetivo: ObjetivoPoupanca }
  | { tipo: 'historico'; objetivo: ObjetivoPoupanca }
  | null

export default function PaginaPoupancas() {
  const [modal, setModal] = useState<EstadoModal>(null)
  const { data, isLoading, isError, error } = useObjetivos()
  const apagar = useApagarObjetivo()

  function remover(objetivo: ObjetivoPoupanca) {
    if (window.confirm(`Apagar o objetivo "${objetivo.nome}" e todas as suas contribuições?`)) {
      apagar.mutate(objetivo.id)
    }
  }

  return (
    <>
      <Header
        title="Poupanças"
        subtitle="Define objetivos e acompanha o teu progresso."
        onMenu={() => {}}
        action={
          <button
            onClick={() => setModal({ tipo: 'objetivo' })}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="size-4" />
            Novo objetivo
          </button>
        }
      />

      {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
      {isError && <p className="text-sm text-rose-600">{error.message}</p>}
      {apagar.isError && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{apagar.error.message}</p>
      )}

      {data && (
        <>
          <div className="mb-6 rounded-2xl bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Total poupado</p>
                <p className="mt-2 text-3xl font-bold">{formatarEuros(data.totais.poupadoCentimos)}</p>
                <p className="mt-2 text-sm text-emerald-400">
                  {data.totais.poupadoEsteMesCentimos > 0
                    ? `+${formatarEuros(data.totais.poupadoEsteMesCentimos)} este mês`
                    : 'Ainda sem contribuições este mês'}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <PiggyBank className="size-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {data.objetivos.length === 0 ? (
            <Card className="px-6 py-10 text-center">
              <p className="text-sm text-slate-500">Ainda não tens objetivos de poupança.</p>
              <button onClick={() => setModal({ tipo: 'objetivo' })} className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Criar o primeiro objetivo
              </button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {data.objetivos.map((o, indice) => {
                const hoje = new Date().toLocaleDateString('sv-SE')
                const prazoUltrapassado = !o.concluido && !!o.dataLimite && o.dataLimite < hoje
                const pct = Math.round((o.poupadoCentimos / o.metaCentimos) * 1000) / 10
                const cor = CORES[indice % CORES.length]
                // Ao ritmo atual, só chega depois da data limite (as datas ISO comparam-se como texto)
                const atrasado = !prazoUltrapassado && !o.concluido && !!o.dataLimite && !!o.previsaoConclusao && o.previsaoConclusao > o.dataLimite
                return (
                  <Card key={o.id} className="flex flex-col p-5">
                    <div className="flex items-start justify-between">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${cor} text-white`}>
                        <Target className="size-5" />
                      </div>
                      <div className="flex">
                        <button onClick={() => setModal({ tipo: 'historico', objetivo: o })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Histórico">
                          <History className="size-4" />
                        </button>
                        <button onClick={() => setModal({ tipo: 'objetivo', objetivo: o })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar">
                          <Edit3 className="size-4" />
                        </button>
                        <button onClick={() => remover(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Apagar">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-5 font-semibold text-slate-900">{o.nome}</h3>
                    <p className="mt-1 text-sm text-slate-400">Objetivo de {formatarEuros(o.metaCentimos)}</p>

                    <div className="mt-5 flex items-end justify-between">
                      <span className="text-xl font-bold text-slate-900">{formatarEuros(o.poupadoCentimos)}</span>
                      <span className="text-sm font-semibold text-slate-500">{pct.toLocaleString('pt-PT')}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      {o.concluido ? (
                        <p className="font-medium text-emerald-600">Objetivo concluído</p>
                      ) : (
                        <p>Previsão: {o.previsaoConclusao ? formatarData(o.previsaoConclusao) : 'sem dados suficientes'}</p>
                      )}
                      {o.dataLimite && (
                        <p className={prazoUltrapassado ? 'font-medium text-rose-600' : ''}>
                            {prazoUltrapassado ? 'Prazo ultrapassado em' : 'Data limite:'} {formatarData(o.dataLimite)}
                        </p>
                        )}
                      {atrasado && <p className="font-medium text-amber-600">Ao ritmo atual, só chegas depois da data limite.</p>}
                    </div>

                    <button
                      onClick={() => setModal({ tipo: 'contribuir', objetivo: o })}
                      className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Adicionar valor
                    </button>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {modal?.tipo === 'objetivo' && <ModalObjetivo objetivo={modal.objetivo} onClose={() => setModal(null)} />}
      {modal?.tipo === 'contribuir' && <ModalContribuir objetivo={modal.objetivo} onClose={() => setModal(null)} />}
      {modal?.tipo === 'historico' && <ModalHistorico objetivo={modal.objetivo} onClose={() => setModal(null)} />}
    </>
  )
}

function Janela({
  titulo,
  subtitulo,
  onClose,
  children,
}: {
  titulo: string
  subtitulo?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{titulo}</h2>
            {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Acoes({ onClose, aGuardar }: { onClose: () => void; aGuardar: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
        Cancelar
      </button>
      <button type="submit" disabled={aGuardar} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        {aGuardar ? 'A guardar...' : 'Guardar'}
      </button>
    </div>
  )
}

function Erro({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null
  return <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{mensagem}</p>
}

function ModalObjetivo({ objetivo, onClose }: { objetivo?: ObjetivoPoupanca; onClose: () => void }) {
  const guardar = useGuardarObjetivo()
  const [nome, setNome] = useState(objetivo?.nome ?? '')
  const [meta, setMeta] = useState(objetivo ? centimosParaTexto(objetivo.metaCentimos) : '')
  const [dataLimite, setDataLimite] = useState(objetivo?.dataLimite ?? '')
  const [erro, setErro] = useState<string | null>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    const metaCentimos = eurosParaCentimos(meta)
    if (!metaCentimos) {
      setErro('Valor inválido. Usa o formato 2000,00.')
      return
    }
    setErro(null)
    guardar.mutate(
      { id: objetivo?.id, dados: { nome, metaCentimos, dataLimite: dataLimite || null } },
      { onSuccess: onClose, onError: (e) => setErro(e.message) },
    )
  }

  return (
    <Janela titulo={objetivo ? 'Editar objetivo' : 'Novo objetivo'} subtitulo="Define quanto queres poupar e até quando." onClose={onClose}>
      <form onSubmit={submeter}>
        <div className="mt-6 grid gap-4">
          <label className="text-sm font-medium text-slate-700">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Férias" required maxLength={80} className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Meta (€)
            <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="0,00" inputMode="decimal" required className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Data limite (opcional)
            <input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} min={objetivo ? undefined : new Date().toLocaleDateString('sv-SE')} className={classeCampo} />
          </label>
        </div>
        <Erro mensagem={erro} />
        <Acoes onClose={onClose} aGuardar={guardar.isPending} />
      </form>
    </Janela>
  )
}

function ModalContribuir({ objetivo, onClose }: { objetivo: ObjetivoPoupanca; onClose: () => void }) {
  const adicionar = useAdicionarContribuicao()
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toLocaleDateString('sv-SE'))
  const [erro, setErro] = useState<string | null>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    const valorCentimos = eurosParaCentimos(valor)
    if (!valorCentimos) {
      setErro('Valor inválido. Usa o formato 50,00.')
      return
    }
    setErro(null)
    adicionar.mutate(
      { objetivoId: objetivo.id, valorCentimos, data },
      { onSuccess: onClose, onError: (e) => setErro(e.message) },
    )
  }

  return (
    <Janela titulo="Adicionar valor" subtitulo={objetivo.nome} onClose={onClose}>
      <form onSubmit={submeter}>
        <div className="mt-6 grid gap-4">
          <label className="text-sm font-medium text-slate-700">
            Valor (€)
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" inputMode="decimal" required className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={classeCampo} />
          </label>
        </div>
        <Erro mensagem={erro} />
        <Acoes onClose={onClose} aGuardar={adicionar.isPending} />
      </form>
    </Janela>
  )
}

function ModalHistorico({ objetivo, onClose }: { objetivo: ObjetivoPoupanca; onClose: () => void }) {
  const { data, isLoading, isError, error } = useContribuicoes(objetivo.id)
  const remover = useRemoverContribuicao()

  return (
    <Janela titulo="Histórico" subtitulo={objetivo.nome} onClose={onClose}>
      <div className="mt-6 max-h-80 overflow-y-auto">
        {isLoading && <p className="text-sm text-slate-400">A carregar...</p>}
        {isError && <p className="text-sm text-rose-600">{error.message}</p>}
        {data?.length === 0 && <p className="text-sm text-slate-400">Ainda não há contribuições.</p>}
        <div className="divide-y divide-slate-100">
          {data?.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500">{formatarData(c.data)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600">+{formatarEuros(c.valorCentimos)}</span>
                <button
                  onClick={() => {
                    if (window.confirm('Remover esta contribuição?')) {
                      remover.mutate({ objetivoId: objetivo.id, id: c.id })
                    }
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remover contribuição"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {remover.isError && <Erro mensagem={remover.error.message} />}
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Fechar
        </button>
      </div>
    </Janela>
  )
}