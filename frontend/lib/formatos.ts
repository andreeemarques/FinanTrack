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

// Mês atual no formato "AAAA-MM" (hora local)
export const mesAtual = () => new Date().toLocaleDateString('sv-SE').slice(0, 7)

// somarMeses("2026-10", -1) → "2026-09"
export function somarMeses(mes: string, delta: number) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  const data = new Date(ano, numeroMes - 1 + delta, 1)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

// "2026-10" → "Outubro de 2026"
export function formatarMes(mes: string) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  const texto = new Date(ano, numeroMes - 1, 1).toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}