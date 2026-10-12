-- CreateTable
CREATE TABLE "sessoes" (
    "id" UUID NOT NULL,
    "utilizador_id" UUID NOT NULL,
    "familia_id" UUID NOT NULL,
    "hash_token" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "rodada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_hash_token_key" ON "sessoes"("hash_token");

-- CreateIndex
CREATE INDEX "sessoes_utilizador_id_idx" ON "sessoes"("utilizador_id");

-- CreateIndex
CREATE INDEX "sessoes_familia_id_idx" ON "sessoes"("familia_id");

-- CreateIndex
CREATE INDEX "sessoes_expira_em_idx" ON "sessoes"("expira_em");

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
