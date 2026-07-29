-- AlterEnum
ALTER TYPE "TypeMessage" ADD VALUE 'FICHIER';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fichierMime" TEXT,
ADD COLUMN     "fichierNom" TEXT,
ADD COLUMN     "fichierStocke" TEXT,
ADD COLUMN     "fichierTailleKo" INTEGER;
