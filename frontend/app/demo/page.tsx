'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAutenticacao } from '@/lib/autenticacao'
import { useDemora } from '@/lib/usar-demora'

export default function Demonstracao() {
  const router = useRouter()
  const { utilizador, carregando, entrarDemo } = useAutenticacao()
  const [erro, setErro] = useState<string | null>(null)
  const iniciou = useRef(false) // evita criar duas contas de demonstração
  const demorou = useDemora(!erro)

  useEffect(() => {
    if (carregando) return
    if (utilizador) {
      router.replace('/painel')
      return
    }
    if (iniciou.current) return
    iniciou.current = true
    entrarDemo().catch((e) => setErro(e instanceof Error ? e.message : 'Ocorreu um erro.'))
  }, [carregando, utilizador, entrarDemo, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f8fafc] p-4 text-center">
      {erro ? (
        <>
          <p className="max-w-sm rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</p>
          <Link href="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Voltar ao início
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700">A preparar a tua demonstração...</p>
          <p className="max-w-xs text-xs text-slate-400">
            Estamos a criar uma conta temporária com dados de exemplo. É apagada ao fim de 24 horas.
          </p>
          {demorou && (
            <p className="max-w-xs rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
              O servidor está a acordar, o que pode demorar cerca de 1 minuto. Obrigado pela paciência!
            </p>
          )}
        </>
      )}
    </div>
  )
}