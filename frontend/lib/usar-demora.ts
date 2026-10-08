import { useEffect, useState } from 'react'

// Devolve true quando "ativo" dura mais de X milissegundos (por exemplo, um pedido lento)
export function useDemora(ativo: boolean, milissegundos = 5000) {
  const [demorou, setDemorou] = useState(false)

  useEffect(() => {
    if (!ativo) {
      setDemorou(false)
      return
    }
    const temporizador = setTimeout(() => setDemorou(true), milissegundos)
    return () => clearTimeout(temporizador)
  }, [ativo, milissegundos])

  return demorou
}