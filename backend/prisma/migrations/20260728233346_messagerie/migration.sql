-- CreateEnum
CREATE TYPE "TypeConversation" AS ENUM ('CANAL', 'DIRECT');

-- CreateEnum
CREATE TYPE "TypeMessage" AS ENUM ('TEXTE', 'VOCAL');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "TypeConversation" NOT NULL,
    "nom" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreConversation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "luJusquauLe" TIMESTAMP(3),

    CONSTRAINT "MembreConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "type" "TypeMessage" NOT NULL DEFAULT 'TEXTE',
    "contenu" TEXT,
    "audioFichier" TEXT,
    "dureeSec" INTEGER,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "Conversation"("type");

-- CreateIndex
CREATE INDEX "MembreConversation_membreId_idx" ON "MembreConversation"("membreId");

-- CreateIndex
CREATE UNIQUE INDEX "MembreConversation_conversationId_membreId_key" ON "MembreConversation"("conversationId", "membreId");

-- CreateIndex
CREATE INDEX "Message_conversationId_creeLe_idx" ON "Message"("conversationId", "creeLe");

-- AddForeignKey
ALTER TABLE "MembreConversation" ADD CONSTRAINT "MembreConversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreConversation" ADD CONSTRAINT "MembreConversation_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
