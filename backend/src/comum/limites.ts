// Quantidade máxima de dados por conta, para ninguém encher a base de dados
export const LIMITES = {
  normal: { movimentos: 5000, categorias: 50, orcamentos: 600, objetivos: 20, contribuicoes: 3000 },
  demo: { movimentos: 200, categorias: 15, orcamentos: 20, objetivos: 6, contribuicoes: 60 },
} as const;

export type Recurso = keyof (typeof LIMITES)['normal'];