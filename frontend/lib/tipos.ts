export interface Utilizador {
  id: string
  nome: string
  email: string
  moeda: string
}

export interface RespostaAutenticacao {
  utilizador: Utilizador
  token: string
}