import { execSync } from 'node:child_process';
import { config } from 'dotenv';

// Corre uma vez antes de todos os testes e2e: aplica as migrações à base de dados de teste
export default function setupGlobal() {
  config({ path: '.env.test', override: true, quiet: true });

  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error('Recusado: os testes e2e só podem correr numa base de dados com "_test" no nome.');
  }

  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}