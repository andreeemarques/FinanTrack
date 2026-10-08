import { config } from 'dotenv';

// Corre em cada ficheiro de teste: garante as variáveis de ambiente de teste
config({ path: '.env.test', override: true, quiet: true });