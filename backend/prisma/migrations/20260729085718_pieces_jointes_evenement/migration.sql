-- CreateTable
CREATE TABLE "PieceJointeEvenement" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "tailleKo" INTEGER,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointeEvenement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PieceJointeEvenement" ADD CONSTRAINT "PieceJointeEvenement_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
