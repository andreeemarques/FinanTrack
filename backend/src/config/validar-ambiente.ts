// Corre no arranque: se a configuração for insegura ou estiver incompleta, a API não arranca
export function validarAmbiente(config: Record<string, unknown>) {
  const erros: string[] = [];
  const texto = (chave: string) =>
    typeof config[chave] === 'string' ? config[chave].trim() : '';

  if (!texto('DATABASE_URL')) {
    erros.push('DATABASE_URL é obrigatória.');
  }

  if (texto('JWT_SECRET').length < 32) {
    erros.push(
      'JWT_SECRET é obrigatório e tem de ter pelo menos 32 caracteres ' +
        "(gera um com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\").",
    );
  }

  if (texto('PORT') && !/^\d+$/.test(texto('PORT'))) {
    erros.push('PORT tem de ser um número.');
  }

  if (erros.length > 0) {
    throw new Error(`Configuração inválida:\n- ${erros.join('\n- ')}`);
  }
  return config;
}