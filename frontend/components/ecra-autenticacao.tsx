'use client'

import { Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAutenticacao } from '@/lib/autenticacao'
import { useDemora } from '@/lib/usar-demora'

const classeCampo =
  'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'

export default function EcraAutenticacao({ modo }: { modo: 'entrar' | 'registar' }) {
  const router = useRouter()
  const { utilizador, entrar, registar } = useAutenticacao()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aEnviar, setAEnviar] = useState(false)
  const demorou = useDemora(aEnviar)

  // Com sessão iniciada (incluindo logo após entrar ou registar), vai para o painel
  useEffect(() => {
    if (utilizador) router.replace('/painel')
  }, [utilizador, router])

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setAEnviar(true)
    try {
      if (modo === 'entrar') {
        await entrar(email, password)
      } else {
        await registar(nome, email, password)
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Ocorreu um erro.')
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Wallet className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-950">
            Finan<span className="text-emerald-600">Track</span>
          </span>
        </Link>

        <h1 className="mt-8 text-center text-xl font-bold text-slate-950">
          {modo === 'entrar' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {modo === 'entrar'
            ? 'Entra para ver as tuas finanças.'
            : 'Começa a gerir as tuas finanças.'}
        </p>

        <form onSubmit={submeter} className="mt-6 flex flex-col gap-4">
          {modo === 'registar' && (
            <label className="text-sm font-medium text-slate-700">
              Nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className={classeCampo}
              />
            </label>
          )}
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={classeCampo}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={modo === 'registar' ? 8 : undefined}
              maxLength={72}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              className={classeCampo}
            />
            {modo === 'registar' && (
              <span className="mt-1 block text-xs font-normal text-slate-400">
                Mínimo de 8 caracteres.
              </span>
            )}
          </label>

          {erro && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{erro}</p>
          )}

          {demorou && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
              O servidor está a acordar, o que pode demorar cerca de 1 minuto. Obrigado pela paciência!
            </p>
          )}

          <button
            type="submit"
            disabled={aEnviar}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {aEnviar ? 'A enviar...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {modo === 'entrar' ? 'Ainda não tens conta?' : 'Já tens conta?'}{' '}
          <Link
            href={modo === 'entrar' ? '/registar' : '/entrar'}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {modo === 'entrar' ? 'Criar conta' : 'Entrar'}
          </Link>
        </p>
      </div>
    </div>
  )
}