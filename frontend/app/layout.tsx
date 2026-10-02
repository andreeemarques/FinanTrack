import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import Fornecedores from '@/components/fornecedores'

export const metadata: Metadata = {
  title: 'FinanTrack — Gestão financeira pessoal',
  description: 'Acompanha as tuas receitas, despesas, orçamento e objetivos de poupança.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-PT">
      <body className="antialiased">
        <Fornecedores>{children}</Fornecedores>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
