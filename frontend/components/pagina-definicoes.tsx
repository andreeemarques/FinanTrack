'use client'

import { useState } from 'react'
import { useAutenticacao } from '@/lib/autenticacao'
import { useAlterarPassword, useApagarConta, useAtualizarPerfil } from '@/lib/conta'
import { Card, Header } from './ui-comum'

const classeCampo =
  'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'

type MensagemEstado = { tipo: 'ok' | 'erro'; texto: string } | null

function Mensagem({ mensagem }: { mensagem: MensagemEstado }) {
  if (!mensagem) return null
  const cor = mensagem.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
  return <p className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${cor}`}>{mensagem.texto}</p>
}

export default function PaginaDefinicoes() {
  return (
    <>
      <Header title="Definições" subtitle="Gere a tua conta no FinanTrack." onMenu={() => {}} />
      <div className="flex max-w-2xl flex-col gap-5">
        <FormularioPerfil />
        <FormularioPassword />
        <ApagarConta />
      </div>
    </>
  )
}

function FormularioPerfil() {
  const { utilizador } = useAutenticacao()
  const atualizar = useAtualizarPerfil()
  const [nome, setNome] = useState(utilizador?.nome ?? '')
  const [email, setEmail] = useState(utilizador?.email ?? '')
  const [passwordAtual, setPasswordAtual] = useState('')
  const [mensagem, setMensagem] = useState<MensagemEstado>(null)

  // A password só é pedida quando o email muda
  const mudaEmail = email.trim().toLowerCase() !== utilizador?.email

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    atualizar.mutate(
      { nome, email, passwordAtual: mudaEmail ? passwordAtual : undefined },
      {
        onSuccess: () => {
          setPasswordAtual('')
          setMensagem({ tipo: 'ok', texto: 'Alterações guardadas.' })
        },
        onError: (e) => setMensagem({ tipo: 'erro', texto: e.message }),
      },
    )
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">Informação pessoal</h2>
      <p className="mt-1 text-sm text-slate-500">Atualiza os teus dados de perfil.</p>
      <form onSubmit={submeter}>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={80} className={classeCampo} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={classeCampo} />
          </label>
          {mudaEmail && (
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Password atual
              <input
                type="password"
                value={passwordAtual}
                onChange={(e) => setPasswordAtual(e.target.value)}
                required
                autoComplete="current-password"
                className={classeCampo}
              />
              <span className="mt-1 block text-xs font-normal text-slate-400">Necessária para mudar o email.</span>
            </label>
          )}
        </div>
        <Mensagem mensagem={mensagem} />
        <button type="submit" disabled={atualizar.isPending} className="mt-6 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          {atualizar.isPending ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </form>
    </Card>
  )
}

function FormularioPassword() {
  const alterar = useAlterarPassword()
  const [passwordAtual, setPasswordAtual] = useState('')
  const [novaPassword, setNovaPassword] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mensagem, setMensagem] = useState<MensagemEstado>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    if (novaPassword !== confirmacao) {
      setMensagem({ tipo: 'erro', texto: 'A confirmação não coincide com a nova password.' })
      return
    }
    setMensagem(null)
    alterar.mutate(
      { passwordAtual, novaPassword },
      {
        onSuccess: () => {
          setPasswordAtual('')
          setNovaPassword('')
          setConfirmacao('')
          setMensagem({ tipo: 'ok', texto: 'Password alterada com sucesso.' })
        },
        onError: (e) => setMensagem({ tipo: 'erro', texto: e.message }),
      },
    )
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">Segurança</h2>
      <p className="mt-1 text-sm text-slate-500">Altera a password da tua conta.</p>
      <form onSubmit={submeter}>
        <div className="mt-6 grid gap-4">
          <label className="text-sm font-medium text-slate-700">
            Password atual
            <input type="password" value={passwordAtual} onChange={(e) => setPasswordAtual(e.target.value)} required autoComplete="current-password" className={classeCampo} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Nova password
              <input type="password" value={novaPassword} onChange={(e) => setNovaPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" className={classeCampo} />
              <span className="mt-1 block text-xs font-normal text-slate-400">Mínimo de 8 caracteres.</span>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Confirmar nova password
              <input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required autoComplete="new-password" className={classeCampo} />
            </label>
          </div>
        </div>
        <Mensagem mensagem={mensagem} />
        <button type="submit" disabled={alterar.isPending} className="mt-6 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          {alterar.isPending ? 'A guardar...' : 'Alterar password'}
        </button>
      </form>
    </Card>
  )
}

function ApagarConta() {
  const apagar = useApagarConta()
  const [aConfirmar, setAConfirmar] = useState(false)
  const [password, setPassword] = useState('')
  const [mensagem, setMensagem] = useState<MensagemEstado>(null)

  function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    apagar.mutate(password, { onError: (e) => setMensagem({ tipo: 'erro', texto: e.message }) })
  }

  return (
    <Card className="border-rose-200 p-6">
      <h2 className="font-semibold text-rose-700">Apagar conta</h2>
      <p className="mt-1 text-sm text-slate-500">
        Apaga a tua conta e todos os dados associados: movimentos, categorias, orçamentos e objetivos. Esta ação é irreversível.
      </p>
      {!aConfirmar ? (
        <button onClick={() => setAConfirmar(true)} className="mt-6 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
          Apagar a minha conta
        </button>
      ) : (
        <form onSubmit={submeter}>
          <label className="mt-6 block text-sm font-medium text-slate-700">
            Confirma com a tua password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={classeCampo} />
          </label>
          <Mensagem mensagem={mensagem} />
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setAConfirmar(false)
                setPassword('')
                setMensagem(null)
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button type="submit" disabled={apagar.isPending} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
              {apagar.isPending ? 'A apagar...' : 'Apagar definitivamente'}
            </button>
          </div>
        </form>
      )}
    </Card>
  )
}