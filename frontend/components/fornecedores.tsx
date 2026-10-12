'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { AutenticacaoProvider } from '@/lib/autenticacao'

export default function Fornecedores({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false },
        },
      }),
  )

  // A API gratuita adormece: acorda-a assim que o site abre, para estar pronta quando for precisa
  useEffect(() => {
    fetch('/api/saude', { cache: 'no-store' }).catch(() => undefined)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AutenticacaoProvider>{children}</AutenticacaoProvider>
    </QueryClientProvider>
  )
}