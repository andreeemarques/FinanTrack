-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('CARTAO', 'TRANSFERENCIA', 'NUMERARIO', 'MBWAY', 'DEBITO_DIRETO', 'OUTRO');

-- CreateTable
CREATE TABLE "utilizadores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'EUR',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "utilizador_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT,
    "cor" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos" (
    "id" UUID NOT NULL,
    "utilizador_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "valor_centimos" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "metodo_pagamento" "MetodoPagamento" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" UUID NOT NULL,
    "utilizador_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "limite_centimos" INTEGER NOT NULL,
    "mes" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivos_poupanca" (
    "id" UUID NOT NULL,
    "utilizador_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "meta_centimos" INTEGER NOT NULL,
    "data_limite" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivos_poupanca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribuicoes" (
    "id" UUID NOT NULL,
    "objetivo_id" UUID NOT NULL,
    "valor_centimos" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_utilizador_id_nome_key" ON "categorias"("utilizador_id", "nome");

-- CreateIndex
CREATE INDEX "movimentos_utilizador_id_data_idx" ON "movimentos"("utilizador_id", "data");

-- CreateIndex
CREATE INDEX "movimentos_utilizador_id_categoria_id_idx" ON "movimentos"("utilizador_id", "categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_utilizador_id_categoria_id_mes_key" ON "orcamentos"("utilizador_id", "categoria_id", "mes");

-- CreateIndex
CREATE INDEX "contribuicoes_objetivo_id_idx" ON "contribuicoes"("objetivo_id");

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos_poupanca" ADD CONSTRAINT "objetivos_poupanca_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribuicoes" ADD CONSTRAINT "contribuicoes_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos_poupanca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
