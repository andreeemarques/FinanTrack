'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {BarChart3, CreditCard, LayoutDashboard, LogOut, PiggyBank,Settings, Wallet, X} from 'lucide-react'
import { useAutenticacao } from '@/lib/autenticacao'
import { Card, Header } from './ui-comum'
import MovimentosRecentes from './movimentos-recentes'
import PaginaMovimentos from './pagina-movimentos'
import PaginaOrcamento from './pagina-orcamento'
import PaginaPoupancas from './pagina-poupancas'
import PaginaDashboard from './pagina-dashboard'
import PaginaRelatorios from './pagina-relatorios'
import PaginaDefinicoes from './pagina-definicoes'
import { useDemora } from '@/lib/usar-demora'



type Page = 'dashboard' | 'movimentos' | 'orcamento' | 'poupancas' | 'relatorios' | 'definicoes'

function Sidebar({ page, setPage, mobileOpen, setMobileOpen }: { page: Page; setPage: (p: Page) => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const { utilizador, sair } = useAutenticacao()
  const iniciais = (utilizador?.nome ?? '')
    .split(' ')
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const items: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'movimentos', label: 'Movimentos', icon: CreditCard }, { id: 'orcamento', label: 'Orçamento', icon: Wallet }, { id: 'poupancas', label: 'Poupanças', icon: PiggyBank }, { id: 'relatorios', label: 'Relatórios', icon: BarChart3 }, { id: 'definicoes', label: 'Definições', icon: Settings },
  ]
  return <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex items-center justify-between px-3"><div className="flex items-center gap-2.5"><div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Wallet className="size-5" /></div><span className="text-lg font-bold tracking-tight text-slate-950">Finan<span className="text-emerald-600">Track</span></span></div><button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Fechar menu"><X className="size-5" /></button></div>
    <nav className="mt-12 flex flex-1 flex-col gap-1">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setPage(id); setMobileOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${page === id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="size-[18px]" />{label}</button>)}</nav>
        <div className="border-t border-slate-100 pt-5"><div className="flex items-center gap-3 px-2"><div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{iniciais}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{utilizador?.nome}</p><p className="truncate text-xs text-slate-400">{utilizador?.email}</p></div><button onClick={sair} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Terminar sessão"><LogOut className="size-4" /></button></div></div>
  </aside>
}
export default function FinanTrackApp() {
  const { utilizador, carregando } = useAutenticacao()
  const router = useRouter()
  useEffect(() => {
    if (!carregando && !utilizador) router.replace('/entrar')
  }, [carregando, utilizador, router])

  const demorou = useDemora(carregando)
  const [page, setPage] = useState<Page>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const content = useMemo(() => ({ dashboard: <PaginaDashboard onVerMovimentos={() => setPage('movimentos')}/>, movimentos: <PaginaMovimentos/>, orcamento: <PaginaOrcamento/>, poupancas: <PaginaPoupancas/>, relatorios: <PaginaRelatorios/>, definicoes: <PaginaDefinicoes/> }[page]), [page])

  if (carregando || !utilizador) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-sm text-slate-400">
        <p>A carregar...</p>
        {demorou && (
          <p className="max-w-xs text-center text-xs">
            O servidor está a acordar, o que pode demorar cerca de 1 minuto.
          </p>
        )}
      </div>
    )
  }

  return <div className="min-h-screen bg-[#f8fafc] text-slate-900"><Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>{mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"/>}<main className="min-h-screen lg:pl-64"><div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">{content}</div></main></div>
}