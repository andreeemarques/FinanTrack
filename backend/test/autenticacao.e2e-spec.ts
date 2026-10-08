import request from 'supertest';
import {
  AplicacaoTeste,
  PASSWORD_TESTE,
  autorizacao,
  criarApp,
  limparBaseDeDados,
  registarUtilizador,
} from './ajudantes';

describe('Autenticação (e2e)', () => {
  let app: AplicacaoTeste;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await criarApp();
  });
  beforeEach(async () => {
    await limparBaseDeDados(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('regista um utilizador e cria as categorias padrão', async () => {
    const { token } = await registarUtilizador(app, 'Ana', 'ana@example.com');

    const categorias = await http().get('/categorias').set(autorizacao(token)).expect(200);
    expect(categorias.body).toHaveLength(7);
  });

  it('recusa um email repetido, mesmo com maiúsculas (409)', async () => {
    await registarUtilizador(app, 'Ana', 'ana@example.com');

    await http()
      .post('/autenticacao/registar')
      .send({ nome: 'Outra', email: 'ANA@example.com', password: PASSWORD_TESTE })
      .expect(409);
  });

  it('recusa dados inválidos (400)', async () => {
    const valido = { nome: 'Ana', email: 'ana@example.com', password: PASSWORD_TESTE };

    await http().post('/autenticacao/registar').send({ ...valido, password: 'curta' }).expect(400);
    await http().post('/autenticacao/registar').send({ ...valido, email: 'nao-e-email' }).expect(400);
    await http().post('/autenticacao/registar').send({ ...valido, admin: true }).expect(400);
  });

  it('entra com as credenciais certas e recusa as erradas (401)', async () => {
    await registarUtilizador(app, 'Ana', 'ana@example.com');

    const certa = await http()
      .post('/autenticacao/entrar')
      .send({ email: 'ana@example.com', password: PASSWORD_TESTE })
      .expect(200);
    expect(certa.body.token).toEqual(expect.any(String));
    expect(certa.body.utilizador).not.toHaveProperty('hashPassword');

    await http().post('/autenticacao/entrar').send({ email: 'ana@example.com', password: 'errada123' }).expect(401);
    await http().post('/autenticacao/entrar').send({ email: 'nao-existe@example.com', password: PASSWORD_TESTE }).expect(401);
  });

  it('protege as rotas: sem token ou com token inválido dá 401', async () => {
    await http().get('/autenticacao/eu').expect(401);
    await http().get('/autenticacao/eu').set(autorizacao('token-invalido')).expect(401);
  });

  it('alterar a password invalida os tokens antigos e devolve um token novo', async () => {
    const { token: antigo } = await registarUtilizador(app, 'Ana', 'ana@example.com');

    await http()
      .post('/autenticacao/alterar-password')
      .set(autorizacao(antigo))
      .send({ passwordAtual: 'errada123', novaPassword: 'passwordNova123' })
      .expect(400);

    const resposta = await http()
      .post('/autenticacao/alterar-password')
      .set(autorizacao(antigo))
      .send({ passwordAtual: PASSWORD_TESTE, novaPassword: 'passwordNova123' })
      .expect(200);
    const novo = resposta.body.token as string;

    await http().get('/autenticacao/eu').set(autorizacao(antigo)).expect(401);
    await http().get('/autenticacao/eu').set(autorizacao(novo)).expect(200);

    await http().post('/autenticacao/entrar').send({ email: 'ana@example.com', password: PASSWORD_TESTE }).expect(401);
    await http().post('/autenticacao/entrar').send({ email: 'ana@example.com', password: 'passwordNova123' }).expect(200);
  });

  it('alterar o email exige a password atual, mas o nome não', async () => {
    const { token } = await registarUtilizador(app, 'Ana', 'ana@example.com');

    await http().patch('/autenticacao/eu').set(autorizacao(token)).send({ nome: 'Ana Maria' }).expect(200);

    await http().patch('/autenticacao/eu').set(autorizacao(token)).send({ email: 'nova@example.com' }).expect(400);

    const resposta = await http()
      .patch('/autenticacao/eu')
      .set(autorizacao(token))
      .send({ email: 'nova@example.com', passwordAtual: PASSWORD_TESTE })
      .expect(200);
    expect(resposta.body).toMatchObject({ nome: 'Ana Maria', email: 'nova@example.com' });
  });

  it('não permite usar o email de outra conta', async () => {
    await registarUtilizador(app, 'Ana', 'ana@example.com');
    const { token } = await registarUtilizador(app, 'Rui', 'rui@example.com');

    await http()
      .patch('/autenticacao/eu')
      .set(autorizacao(token))
      .send({ email: 'ana@example.com', passwordAtual: PASSWORD_TESTE })
      .expect(409);
  });

  it('apagar a conta exige a password e invalida o token', async () => {
    const { token } = await registarUtilizador(app, 'Ana', 'ana@example.com');

    await http().post('/autenticacao/apagar-conta').set(autorizacao(token)).send({ password: 'errada123' }).expect(400);
    await http().get('/autenticacao/eu').set(autorizacao(token)).expect(200);

    await http().post('/autenticacao/apagar-conta').set(autorizacao(token)).send({ password: PASSWORD_TESTE }).expect(204);

    await http().get('/autenticacao/eu').set(autorizacao(token)).expect(401);
    await http().get('/categorias').set(autorizacao(token)).expect(401);
    await http().post('/autenticacao/entrar').send({ email: 'ana@example.com', password: PASSWORD_TESTE }).expect(401);
  });
});

describe('Rate limiting (e2e)', () => {
  let app: AplicacaoTeste;

  beforeAll(async () => {
    app = await criarApp();
    process.env.DESATIVAR_THROTTLE = 'false'; // liga o limite só para este teste
  });
  afterAll(async () => {
    process.env.DESATIVAR_THROTTLE = 'true';
    await app.close();
  });

  it('bloqueia o login depois de 10 tentativas por minuto (429)', async () => {
    const tentar = () =>
      request(app.getHttpServer())
        .post('/autenticacao/entrar')
        .send({ email: 'alguem@example.com', password: 'qualquer123' });

    for (let i = 0; i < 10; i++) {
      await tentar().expect(401);
    }
    await tentar().expect(429);
  });
});