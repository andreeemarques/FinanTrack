'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, Bell, CalendarDays, Car, ChevronDown,
  CircleDollarSign, CreditCard, Edit3, FileText, Home, LayoutDashboard, LogOut, Menu,
  MoreHorizontal, PiggyBank, Plus, Search, Settings, ShoppingBag, SlidersHorizontal,
  Target, Trash2, TrendingUp, Utensils, Wallet, X, Zap,
} from 'lucide-react'
import { useAutenticacao } from '@/lib/autenticacao'
import { Card, Header } from './ui-comum'
import MovimentosRecentes from './movimentos-recentes'
import PaginaMovimentos from './pagina-movimentos'
import PaginaOrcamento from './pagina-orcamento'
import PaginaPoupancas from './pagina-poupancas'
import PaginaDashboard from './pagina-dashboard'
import PaginaRelatorios from './pagina-relatorios'



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
function Definicoes() { const [dark, setDark] = useState(false); return <><Header title="Definições" subtitle="Personaliza a tua experiência no FinanTrack." onMenu={() => {}} /><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><div className="flex gap-1 overflow-x-auto lg:flex-col"><button className="whitespace-nowrap rounded-xl bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-700">Perfil</button><button className="whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50">Preferências</button><button className="whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50">Notificações</button><button className="whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50">Aparência</button></div><div className="flex flex-col gap-5"><Card className="p-6"><h2 className="font-semibold text-slate-900">Informação pessoal</h2><p className="mt-1 text-sm text-slate-500">Atualiza os teus dados de perfil.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Nome<input defaultValue="André Marques" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400"/></label><label className="text-sm font-medium text-slate-700">Email<input defaultValue="andre@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400"/></label><label className="text-sm font-medium text-slate-700">Telefone<input defaultValue="+351 912 345 678" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-400"/></label></div><button className="mt-6 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Guardar alterações</button></Card><Card className="p-6"><h2 className="font-semibold text-slate-900">Preferências</h2><div className="mt-5 flex flex-col divide-y divide-slate-100"><div className="flex items-center justify-between py-4"><div><p className="text-sm font-medium text-slate-800">Moeda</p><p className="mt-1 text-xs text-slate-400">Moeda usada nos teus movimentos</p></div><select className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Euro (€)</option></select></div><div className="flex items-center justify-between py-4"><div><p className="text-sm font-medium text-slate-800">Modo escuro</p><p className="mt-1 text-xs text-slate-400">Altera a aparência da aplicação</p></div><button onClick={() => setDark(!dark)} className={`h-6 w-11 rounded-full p-1 transition-colors ${dark ? 'bg-emerald-500' : 'bg-slate-200'}`}><span className={`block size-4 rounded-full bg-white transition-transform ${dark ? 'translate-x-5' : ''}`}/></button></div></div></Card></div></div></> }
export default function FinanTrackApp() {
  const { utilizador, carregando } = useAutenticacao()
  const router = useRouter()
  useEffect(() => {
    if (!carregando && !utilizador) router.replace('/entrar')
  }, [carregando, utilizador, router])

  const [page, setPage] = useState<Page>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const content = useMemo(() => ({ dashboard: <PaginaDashboard onVerMovimentos={() => setPage('movimentos')}/>, movimentos: <PaginaMovimentos/>, orcamento: <PaginaOrcamento/>, poupancas: <PaginaPoupancas/>, relatorios: <PaginaRelatorios/>, definicoes: <Definicoes/> }[page]), [page])

  if (carregando || !utilizador) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">A carregar...</div>
  }

  return <div className="min-h-screen bg-[#f8fafc] text-slate-900"><Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>{mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"/>}<main className="min-h-screen lg:pl-64"><div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">{content}</div></main></div>
}