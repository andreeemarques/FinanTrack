import { formatarDia } from '../comum/mes';

const MS_POR_MES = 30.44 * 24 * 60 * 60 * 1000;
const MAX_MESES_PREVISAO = 1200; // 100 anos: acima disto não faz sentido prever

// Estima quando a meta será atingida, ao ritmo de poupança até agora
export function preverConclusao(
  metaCentimos: number,
  poupadoCentimos: number,
  primeiraContribuicao: Date | null,
  hoje: Date,
): string | null {
  if (poupadoCentimos >= metaCentimos || poupadoCentimos <= 0 || !primeiraContribuicao) {
    return null;
  }
  const mesesDecorridos = Math.max(
    1,
    (hoje.getTime() - primeiraContribuicao.getTime()) / MS_POR_MES,
  );
  const ritmoMensal = poupadoCentimos / mesesDecorridos;
  const mesesEmFalta = (metaCentimos - poupadoCentimos) / ritmoMensal;
  if (mesesEmFalta > MAX_MESES_PREVISAO) return null;
  return formatarDia(new Date(hoje.getTime() + mesesEmFalta * MS_POR_MES));
}