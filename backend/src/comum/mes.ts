// Os meses viajam como "AAAA-MM" e guardam-se na base de dados como o dia 1 desse mês

export const mesAtual = () => new Date().toISOString().slice(0, 7);

export const inicioDoMes = (mes: string) => new Date(`${mes}-01T00:00:00.000Z`);

export function inicioDoMesSeguinte(mes: string) {
  const [ano, numeroMes] = mes.split('-').map(Number);
  // numeroMes vai de 1 a 12, mas o Date.UTC conta os meses a partir de 0,
  // por isso este valor já corresponde ao mês seguinte (dezembro passa para janeiro)
  return new Date(Date.UTC(ano, numeroMes, 1));
}

export const formatarMes = (data: Date) => data.toISOString().slice(0, 7);