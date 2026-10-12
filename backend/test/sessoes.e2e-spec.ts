import { createHash } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AplicacaoTeste,
  PASSWORD_TESTE,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

// Devolve o cookie da sessão no formato "finantrack_sessao=VALOR", pronto a enviar de volta
const cookieDe = (resposta: { headers: Record<string, unknown> }) => {
  const cookies = resposta.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((c) => c.startsWith('finantrack_sessao='))?.split(';')[0];
};

describe('Sessões e refresh tokens (e2e)', () => {
  let app: AplicacaoTeste;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const iniciar = async () => {
    const resposta = await http()
      .post('/autenticacao/entrar')
      .send({ email: 'ana@example.com', password: PASSWORD_TESTE })
      .expect(200);
    return { cookie: cookieDe(resposta) as string, token: resposta.body.token as string };
  };

  const renovar = (cookie?: string) => {
    const pedido = http().post('/autenticacao/renovar');
    return cookie ? pedido.set('Cookie', cookie) : pedido;
  };

  beforeAll(async () => {
    app = await criarApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    process.env.DEMO_ATIVA = 'true';
    await limparBaseDeDados(app);
    await registarUtilizador(app, 'Ana', 'ana@example.com');
  });
  afterAll(async () => {
    await app.close();
  });

  it('o registo define um cookie httpOnly e não expõe o refresh token no corpo', async () => {
    const resposta = await http()
      .post('/autenticacao/registar')
      .send({ nome: 'Rui', email: 'rui@example.com', password: PASSWORD_TESTE })
      .expect(201);

    const cookies = resposta.headers['set-cookie'] as unknown as string[];
    const linha = cookies.find((c) => c.startsWith('finantrack_sessao=')) as string;
    expect(linha).toContain('HttpOnly');
    expect(linha).toContain('SameSite=Strict');
    expect(linha).toContain('Path=/api/autenticacao');

    const valor = linha.split(';')[0].split('=')[1];
    expect(JSON.stringify(resposta.body)).not.toContain(valor);
    expect(resposta.body).not.toHaveProperty('refreshToken');
  });

  it('o token de acesso dura 15 minutos', async () => {
    const { token } = await iniciar();
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload.exp - payload.iat).toBe(900);
  });

  it('a base de dados guarda só o hash do token, nunca o token', async () => {
    const { cookie } = await iniciar();
    const valor = cookie.split('=')[1];
    const sessoes = await prisma.sessao.findMany();

    expect(sessoes.some((s) => s.hashToken === valor)).toBe(false);
    const hash = createHash('sha256').update(valor).digest('hex');
    expect(sessoes.some((s) => s.hashToken === hash)).toBe(true);
  });

  it('um refresh token não serve como token de acesso', async () => {
    const { cookie } = await iniciar();
    await http()
      .get('/autenticacao/eu')
      .set(autorizacao(cookie.split('=')[1]))
      .expect(401);
  });

  it('renova a sessão: devolve um token de acesso que funciona e um cookie novo', async () => {
    const { cookie } = await iniciar();

    const resposta = await renovar(cookie).expect(200);
    expect(resposta.body.utilizador.email).toBe('ana@example.com');

    const novoCookie = cookieDe(resposta);
    expect(novoCookie).toBeDefined();
    expect(novoCookie).not.toBe(cookie); // rotação

    await http().get('/autenticacao/eu').set(autorizacao(resposta.body.token)).expect(200);
  });

  it('recusa renovar sem cookie, com lixo ou com um cookie desconhecido (401)', async () => {
    await renovar().expect(401);
    await renovar('finantrack_sessao=lixo').expect(401);
    await renovar('finantrack_sessao=%E0%A4%A').expect(401);
  });

  it('aceita dois pedidos simultâneos com o mesmo cookie (por exemplo, dois separadores)', async () => {
    const { cookie } = await iniciar();
    const [a, b] = await Promise.all([renovar(cookie), renovar(cookie)]);
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it('deteta a reutilização de um token já trocado e termina toda a sessão', async () => {
    const { cookie: antigo } = await iniciar();
    const trocado = await renovar(antigo).expect(200);
    const novo = cookieDe(trocado) as string;

    // Passada a tolerância, voltar a usar o token antigo é suspeito
    await prisma.sessao.updateMany({
      where: { rodadaEm: { not: null } },
      data: { rodadaEm: new Date(Date.now() - 60_000) },
    });
    await renovar(antigo).expect(401);

    // E o token novo, da mesma cadeia, deixa de funcionar também
    await renovar(novo).expect(401);
  });

  it('recusa uma sessão expirada', async () => {
    const { cookie } = await iniciar();
    await prisma.sessao.updateMany({ data: { expiraEm: new Date(Date.now() - 1000) } });
    await renovar(cookie).expect(401);
  });

  it('sair revoga a sessão e apaga o cookie', async () => {
    const { cookie } = await iniciar();

    const resposta = await http().post('/autenticacao/sair').set('Cookie', cookie).expect(204);
    const cookies = resposta.headers['set-cookie'] as unknown as string[];
    expect(cookies.find((c) => c.startsWith('finantrack_sessao=;'))).toBeDefined();

    await renovar(cookie).expect(401);
  });

  it('sair sem sessão não dá erro', async () => {
    await http().post('/autenticacao/sair').expect(204);
  });

  it('alterar a password termina todas as sessões, menos a atual', async () => {
    const primeira = await iniciar();
    const segunda = await iniciar();

    const resposta = await http()
      .post('/autenticacao/alterar-password')
      .set(autorizacao(primeira.token))
      .send({ passwordAtual: PASSWORD_TESTE, novaPassword: 'passwordNova123' })
      .expect(200);
    const terceira = cookieDe(resposta) as string;

    expect(resposta.body).not.toHaveProperty('refreshToken');
    await renovar(primeira.cookie).expect(401);
    await renovar(segunda.cookie).expect(401);
    await renovar(terceira).expect(200);
  });

  it('apagar a conta termina as sessões', async () => {
    const { cookie, token } = await iniciar();

    await http()
      .post('/autenticacao/apagar-conta')
      .set(autorizacao(token))
      .send({ password: PASSWORD_TESTE })
      .expect(204);

    await renovar(cookie).expect(401);
    expect(await prisma.sessao.count()).toBe(0);
  });

  it('a demonstração também abre uma sessão renovável', async () => {
    const resposta = await http().post('/demo/sessao').expect(201);
    const cookie = cookieDe(resposta) as string;
    expect(cookie).toBeDefined();
    expect(resposta.body).not.toHaveProperty('refreshToken');

    const renovada = await renovar(cookie).expect(200);
    expect(renovada.body.utilizador.ehDemo).toBe(true);
  });
});