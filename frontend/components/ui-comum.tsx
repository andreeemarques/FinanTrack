'use client'

import { Menu } from 'lucide-react'

export function Header({
  title,
  subtitle,
  onMenu,
  action,
}: {
  title: string
  subtitle?: string
  onMenu: () => void
  action?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <button onClick={onMenu} className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>
}