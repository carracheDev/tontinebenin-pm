-- CreateTable
CREATE TABLE "PieceJointeProjet" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "tailleKo" INTEGER,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointeProjet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PieceJointeProjet" ADD CONSTRAINT "PieceJointeProjet_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
