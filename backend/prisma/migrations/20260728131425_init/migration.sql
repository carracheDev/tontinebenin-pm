-- CreateEnum
CREATE TYPE "TypeMembre" AS ENUM ('FONDATEUR', 'COFONDATEUR', 'COLLABORATEUR', 'PRESTATAIRE', 'STAGIAIRE');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('ACTIF', 'INACTIF', 'PARTI', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBRE', 'OBSERVATEUR');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('PLANIFIE', 'EN_COURS', 'EN_PAUSE', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'EN_VALIDATION', 'TERMINE', 'BLOQUE');

-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('DEMANDEE', 'ACCEPTEE', 'MODIFICATION_DEMANDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "NiveauRisque" AS ENUM ('FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "CategorieDocument" AS ENUM ('CONTRAT', 'CAHIER_DES_CHARGES', 'TECHNIQUE', 'RAPPORT', 'PRESENTATION', 'PROCEDURE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeEvenement" AS ENUM ('REUNION', 'DEADLINE', 'LANCEMENT', 'RELEASE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('TACHE_ASSIGNEE', 'TACHE_MODIFIEE', 'ECHEANCE_PROCHE', 'VALIDATION_DEMANDEE', 'COMMENTAIRE', 'DOCUMENT_AJOUTE', 'CHANGEMENT_PROJET', 'MENTION');

-- CreateEnum
CREATE TYPE "TypeRapportIA" AS ENUM ('ETAT_PROJET', 'ANALYSE_RETARDS', 'PREVISION_RISQUES', 'PERFORMANCE_EQUIPE', 'SYNTHESE');

-- CreateTable
CREATE TABLE "Membre" (
    "id" TEXT NOT NULL,
    "nomComplet" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "telephone" TEXT,
    "photoUrl" TEXT,
    "poste" TEXT,
    "typeMembre" "TypeMembre" NOT NULL DEFAULT 'COLLABORATEUR',
    "role" "Role" NOT NULL DEFAULT 'MEMBRE',
    "statut" "StatutMembre" NOT NULL DEFAULT 'ACTIF',
    "dateIntegration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disponibilite" TEXT,
    "niveauImplication" INTEGER NOT NULL DEFAULT 0,
    "competences" TEXT[],
    "responsabilites" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capital" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "pourcentageAlloue" DOUBLE PRECISION NOT NULL,
    "pourcentageAcquis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vestingActif" BOOLEAN NOT NULL DEFAULT true,
    "dureeVestingMois" INTEGER NOT NULL DEFAULT 48,
    "cliffMois" INTEGER NOT NULL DEFAULT 12,
    "dateDebutVesting" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueCapital" (
    "id" TEXT NOT NULL,
    "capitalId" TEXT NOT NULL,
    "pourcentageAcquis" DOUBLE PRECISION NOT NULL,
    "motif" TEXT,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueCapital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutProjet" NOT NULL DEFAULT 'PLANIFIE',
    "priorite" "Priorite" NOT NULL DEFAULT 'MOYENNE',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "dateDebut" TIMESTAMP(3),
    "dateFinPrevue" TIMESTAMP(3),
    "dateFinReelle" TIMESTAMP(3),
    "version" TEXT,
    "parentId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreProjet" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "roleProjet" TEXT,

    CONSTRAINT "MembreProjet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutProjet" NOT NULL DEFAULT 'PLANIFIE',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objectif" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "atteintLe" TIMESTAMP(3),
    "echeance" TIMESTAMP(3),

    CONSTRAINT "Objectif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jalon" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT,

    CONSTRAINT "Jalon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "phaseId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "priorite" "Priorite" NOT NULL DEFAULT 'MOYENNE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "assigneId" TEXT,
    "createurId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "echeance" TIMESTAMP(3),
    "termineLe" TIMESTAMP(3),
    "tempsEstimeH" DOUBLE PRECISION,
    "tempsPasseH" DOUBLE PRECISION,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "mentions" TEXT[],
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "tailleKo" INTEGER,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueTache" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "champ" TEXT NOT NULL,
    "ancienne" TEXT,
    "nouvelle" TEXT,
    "parId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueTache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocage" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "solution" TEXT,
    "resolu" BOOLEAN NOT NULL DEFAULT false,
    "resoluLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validation" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "validateurId" TEXT,
    "statut" "StatutValidation" NOT NULL DEFAULT 'DEMANDEE',
    "commentaire" TEXT,
    "version" TEXT,
    "demandeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteeLe" TIMESTAMP(3),

    CONSTRAINT "Validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risque" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "niveau" "NiveauRisque" NOT NULL DEFAULT 'MODERE',
    "probabilite" INTEGER NOT NULL DEFAULT 50,
    "mitigation" TEXT,
    "responsableId" TEXT,
    "resolu" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projetId" TEXT,
    "titre" TEXT NOT NULL,
    "categorie" "CategorieDocument" NOT NULL DEFAULT 'AUTRE',
    "ajouteParId" TEXT NOT NULL,
    "accesRoles" "Role"[],
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionDocument" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "projetId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeEvenement" NOT NULL DEFAULT 'REUNION',
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "rappelAvantMin" INTEGER,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationEvenement" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,

    CONSTRAINT "ParticipationEvenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tachesTerminees" INTEGER NOT NULL DEFAULT 0,
    "tempsPasseH" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAction" (
    "id" TEXT NOT NULL,
    "membreId" TEXT,
    "action" TEXT NOT NULL,
    "ressource" TEXT,
    "details" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RapportIA" (
    "id" TEXT NOT NULL,
    "projetId" TEXT,
    "type" "TypeRapportIA" NOT NULL,
    "contenu" TEXT NOT NULL,
    "genereeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RapportIA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membre_email_key" ON "Membre"("email");

-- CreateIndex
CREATE INDEX "Membre_typeMembre_idx" ON "Membre"("typeMembre");

-- CreateIndex
CREATE INDEX "Membre_statut_idx" ON "Membre"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Capital_membreId_key" ON "Capital"("membreId");

-- CreateIndex
CREATE INDEX "HistoriqueCapital_capitalId_calculeLe_idx" ON "HistoriqueCapital"("capitalId", "calculeLe");

-- CreateIndex
CREATE INDEX "Projet_statut_idx" ON "Projet"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "MembreProjet_projetId_membreId_key" ON "MembreProjet"("projetId", "membreId");

-- CreateIndex
CREATE INDEX "Phase_projetId_ordre_idx" ON "Phase"("projetId", "ordre");

-- CreateIndex
CREATE INDEX "Objectif_projetId_idx" ON "Objectif"("projetId");

-- CreateIndex
CREATE INDEX "Jalon_projetId_date_idx" ON "Jalon"("projetId", "date");

-- CreateIndex
CREATE INDEX "Tache_projetId_statut_idx" ON "Tache"("projetId", "statut");

-- CreateIndex
CREATE INDEX "Tache_assigneId_idx" ON "Tache"("assigneId");

-- CreateIndex
CREATE INDEX "Commentaire_tacheId_creeLe_idx" ON "Commentaire"("tacheId", "creeLe");

-- CreateIndex
CREATE INDEX "HistoriqueTache_tacheId_creeLe_idx" ON "HistoriqueTache"("tacheId", "creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "Blocage_tacheId_key" ON "Blocage"("tacheId");

-- CreateIndex
CREATE INDEX "Validation_tacheId_idx" ON "Validation"("tacheId");

-- CreateIndex
CREATE INDEX "Risque_projetId_niveau_idx" ON "Risque"("projetId", "niveau");

-- CreateIndex
CREATE INDEX "Document_categorie_idx" ON "Document"("categorie");

-- CreateIndex
CREATE UNIQUE INDEX "VersionDocument_documentId_numero_key" ON "VersionDocument"("documentId", "numero");

-- CreateIndex
CREATE INDEX "Evenement_debut_idx" ON "Evenement"("debut");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationEvenement_evenementId_membreId_key" ON "ParticipationEvenement"("evenementId", "membreId");

-- CreateIndex
CREATE INDEX "Notification_membreId_lu_idx" ON "Notification"("membreId", "lu");

-- CreateIndex
CREATE INDEX "Contribution_membreId_date_idx" ON "Contribution"("membreId", "date");

-- CreateIndex
CREATE INDEX "JournalAction_creeLe_idx" ON "JournalAction"("creeLe");

-- CreateIndex
CREATE INDEX "RapportIA_type_genereeLe_idx" ON "RapportIA"("type", "genereeLe");

-- AddForeignKey
ALTER TABLE "Capital" ADD CONSTRAINT "Capital_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueCapital" ADD CONSTRAINT "HistoriqueCapital_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "Capital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreProjet" ADD CONSTRAINT "MembreProjet_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreProjet" ADD CONSTRAINT "MembreProjet_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectif" ADD CONSTRAINT "Objectif_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jalon" ADD CONSTRAINT "Jalon_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_assigneId_fkey" FOREIGN KEY ("assigneId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueTache" ADD CONSTRAINT "HistoriqueTache_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocage" ADD CONSTRAINT "Blocage_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risque" ADD CONSTRAINT "Risque_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risque" ADD CONSTRAINT "Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ajouteParId_fkey" FOREIGN KEY ("ajouteParId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionDocument" ADD CONSTRAINT "VersionDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationEvenement" ADD CONSTRAINT "ParticipationEvenement_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationEvenement" ADD CONSTRAINT "ParticipationEvenement_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAction" ADD CONSTRAINT "JournalAction_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapportIA" ADD CONSTRAINT "RapportIA_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
