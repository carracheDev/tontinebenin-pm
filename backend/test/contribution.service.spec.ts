import { ContributionService } from '../src/modules/contribution/contribution.service';

const maintenant = new Date();
const passe = new Date('2020-01-01');
const avant = new Date('2019-12-01'); // termineLe <= echeance(passe)

function svc(prisma: any) {
  return new ContributionService(prisma as any);
}

// F = fondateur (aucune tâche) · A = 2 terminées à temps, 4h · B = 1 terminée, 1h
const membres = [
  { id: 'F', nomComplet: 'Fondateur', typeMembre: 'FONDATEUR', photoUrl: null, creeLe: maintenant },
  { id: 'A', nomComplet: 'Alice', typeMembre: 'COLLABORATEUR', photoUrl: null, creeLe: maintenant },
  { id: 'B', nomComplet: 'Bob', typeMembre: 'COLLABORATEUR', photoUrl: null, creeLe: maintenant },
];
const taches = [
  { assigneId: 'A', statut: 'TERMINE', tempsPasseH: 2, echeance: passe, termineLe: avant },
  { assigneId: 'A', statut: 'TERMINE', tempsPasseH: 2, echeance: passe, termineLe: avant },
  { assigneId: 'B', statut: 'TERMINE', tempsPasseH: 1, echeance: null, termineLe: null },
];

function prismaMock() {
  return {
    membre: { findMany: jest.fn().mockResolvedValue(membres) },
    tache: { findMany: jest.fn().mockResolvedValue(taches) },
    contribution: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('ContributionService', () => {
  it('table : classe par contribution, le fondateur sans tâche a un poids nul', async () => {
    const r = await svc(prismaMock()).table();
    const lignes = r.donnees.lignes;
    expect(lignes[0].membre.nomComplet).toBe('Alice'); // plus fort score
    const f = lignes.find((l: any) => l.membre.nomComplet === 'Fondateur')!;
    expect(f.poidsContribution).toBe(0); // aucune tâche terminée
    // Alice > Bob
    const a = lignes.find((l: any) => l.membre.nomComplet === 'Alice')!;
    const b = lignes.find((l: any) => l.membre.nomComplet === 'Bob')!;
    expect(a.poidsContribution).toBeGreaterThan(b.poidsContribution);
  });

  it('projection : plancher fondateur = 60 %, reste réparti par contribution', async () => {
    const r = await svc(prismaMock()).projection();
    const rep = r.donnees.repartition;
    expect(r.donnees.plancherFondateur).toBe(60);
    const f = rep.find((x: any) => x.typeMembre === 'FONDATEUR')!;
    expect(f.pourcentageProjete).toBe(60);
    const a = rep.find((x: any) => x.membre === 'Alice')!;
    const b = rep.find((x: any) => x.membre === 'Bob')!;
    expect(a.pourcentageProjete).toBeGreaterThan(b.pourcentageProjete);
    const total = rep.reduce((s: number, x: any) => s + x.pourcentageProjete, 0);
    expect(Math.round(total)).toBe(100);
    expect(r.donnees.avertissement).toContain('non contractuelle');
  });

  it("projection : sans fondateur, tout est réparti entre les contributeurs (pas de plancher)", async () => {
    const p = prismaMock();
    p.membre.findMany = jest.fn().mockResolvedValue(
      membres.map((m) => ({ ...m, typeMembre: 'COLLABORATEUR' })),
    );
    const r = await svc(p).projection();
    const total = r.donnees.repartition.reduce((s: number, x: any) => s + x.pourcentageProjete, 0);
    expect(Math.round(total)).toBe(100);
  });
});
