import { CreditCard, PiggyBank, Wallet } from 'lucide-react'
import Link from 'next/link'

const funcionalidades = [
  {
    icone: CreditCard,
    titulo: 'Movimentos',
    texto: 'Regista receitas e despesas em segundos, com categorias, pesquisa e filtros.',
  },
  {
    icone: Wallet,
    titulo: 'Orçamentos',
    texto: 'Define limites mensais por categoria e vê quanto ainda podes gastar.',
  },
  {
    icone: PiggyBank,
    titulo: 'Objetivos de poupança',
    texto: 'Cria metas, acompanha o progresso e vê a previsão para as atingires.',
  },
]

export default function Introducao() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Wallet className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-950">
            Finan<span className="text-emerald-600">Track</span>
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/entrar" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Entrar
          </Link>
          <Link href="/registar" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Criar conta
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 text-center sm:py-28">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Controla o teu dinheiro, <span className="text-emerald-600">sem complicações</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Acompanha receitas e despesas, define orçamentos e alcança os teus objetivos de poupança num só lugar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/registar" className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Começar agora
            </Link>
            <Link href="/entrar" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-20 md:grid-cols-3">
          {funcionalidades.map(({ icone: Icone, titulo, texto }) => (
            <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icone className="size-5" />
              </div>
              <h2 className="mt-5 font-semibold text-slate-950">{titulo}</h2>
              <p className="mt-2 text-sm text-slate-500">{texto}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        FinanTrack · Projeto de portefólio
      </footer>
    </div>
  )
}