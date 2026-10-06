// Os meses viajam como "AAAA-MM" e guardam-se na base de dados como o dia 1 desse mês

export const formatarMes = (data: Date) => data.toISOString().slice(0, 7);

export const formatarDia = (data: Date) => data.toISOString().slice(0, 10);

export const mesAtual = () => new Date().toISOString().slice(0, 7);

export const inicioDoMes = (mes: string) => new Date(`${mes}-01T00:00:00.000Z`);

export function inicioDoMesSeguinte(mes: string) {
  const [ano, numeroMes] = mes.split('-').map(Number);
  // numeroMes vai de 1 a 12, mas o Date.UTC conta os meses a partir de 0,
  // por isso este valor já corresponde ao mês seguinte (dezembro passa para janeiro)
  return new Date(Date.UTC(ano, numeroMes, 1));
}

// somarMeses("2026-10", -1) → "2026-09"
export function somarMeses(mes: string, delta: number) {
  const [ano, numeroMes] = mes.split('-').map(Number);
  return formatarMes(new Date(Date.UTC(ano, numeroMes - 1 + delta, 1)));
}

// listarMeses("2026-08", "2026-10") → ["2026-08", "2026-09", "2026-10"]
export function listarMeses(de: string, ate: string) {
  const meses: string[] = [];
  for (let mes = de; mes <= ate; mes = somarMeses(mes, 1)) meses.push(mes);
  return meses;
}