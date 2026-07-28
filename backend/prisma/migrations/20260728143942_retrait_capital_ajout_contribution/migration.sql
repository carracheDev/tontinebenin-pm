/*
  Warnings:

  - You are about to drop the `Capital` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HistoriqueCapital` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Capital" DROP CONSTRAINT "Capital_membreId_fkey";

-- DropForeignKey
ALTER TABLE "HistoriqueCapital" DROP CONSTRAINT "HistoriqueCapital_capitalId_fkey";

-- DropTable
DROP TABLE "Capital";

-- DropTable
DROP TABLE "HistoriqueCapital";
