-- AlterTable
ALTER TABLE "utilizadores" ADD COLUMN     "eh_demo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "utilizadores_eh_demo_criado_em_idx" ON "utilizadores"("eh_demo", "criado_em");
