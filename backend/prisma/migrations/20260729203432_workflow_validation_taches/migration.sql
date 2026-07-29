-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatutTache" ADD VALUE 'DEV_TERMINE';
ALTER TYPE "StatutTache" ADD VALUE 'ATTENTE_TEST';
ALTER TYPE "StatutTache" ADD VALUE 'EN_TEST';
ALTER TYPE "StatutTache" ADD VALUE 'TEST_VALIDE';
ALTER TYPE "StatutTache" ADD VALUE 'VALIDE_MANAGER';

-- AlterTable
ALTER TABLE "HistoriqueTache" ADD COLUMN     "commentaire" TEXT;

-- AddForeignKey
ALTER TABLE "HistoriqueTache" ADD CONSTRAINT "HistoriqueTache_parId_fkey" FOREIGN KEY ("parId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;
