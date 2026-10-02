const formatadorEuros = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

// 5420 → "54,20 €"
export const formatarEuros = (centimos: number) => formatadorEuros.format(centimos / 100)

// 5420 → "54,20" (para preencher o formulário)
export const centimosParaTexto = (centimos: number) => (centimos / 100).toFixed(2).replace('.', ',')

// "54,20" ou "54.20" → 5420 (devolve null se for inválido)
export function eurosParaCentimos(texto: string): number | null {
  const limpo = texto.replace(/\s/g, '').replace('€', '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null
  return Math.round(parseFloat(limpo) * 100)
}

// "2026-10-01" → "01/10/2026"
export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}