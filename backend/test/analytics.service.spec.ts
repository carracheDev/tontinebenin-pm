import { AnalyticsService } from '../src/modules/analytics/analytics.service';

function svc(prisma: any) {
  return new AnalyticsService(prisma as any);
}
const passe = new Date('2020-01-01');
const futur = new Date('2999-01-01');

describe('AnalyticsService', () => {
  it('apercu : compte statuts, terminées et retards', async () => {
    const prisma = {
      projet: { findMany: jest.fn().mockResolvedValue([{ avancement: 40, statut: 'EN_COURS', parentId: null }, { avancement: 80, statut: 'EN_COURS', parentId: null }]) },
      membre: { count: jest.fn().mockResolvedValue(3) },
      tache: { findMany: jest.fn().mockResolvedValue([
        { statut: 'TERMINE', echeance: null },
        { statut: 'EN_COURS', echeance: passe },   // en retard
        { statut: 'A_FAIRE', echeance: futur },
      ]) },
    };
    const r = await svc(prisma).apercu();
    expect(r.donnees.tachesTerminees).toBe(1);
    expect(r.donnees.tachesEnRetard).toBe(1);
    expect(r.donnees.avancementMoyen).toBe(60); // (40+80)/2
  });

  it('performanceMembres : taux de complétion par membre', async () => {
    const prisma = {
      membre: { findMany: jest.fn().mockResolvedValue([{ id: 'u1', nomComplet: 'A' }]) },
      tache: { findMany: jest.fn().mockResolvedValue([
        { assigneId: 'u1', statut: 'TERMINE', echeance: null, tempsPasseH: 2 },
        { assigneId: 'u1', statut: 'EN_COURS', echeance: passe, tempsPasseH: 1 },
      ]) },
    };
    const r = await svc(prisma).performanceMembres();
    expect(r.donnees[0].assignees).toBe(2);
    expect(r.donnees[0].terminees).toBe(1);
    expect(r.donnees[0].enRetard).toBe(1);
    expect(r.donnees[0].tauxCompletion).toBe(50);
    expect(r.donnees[0].tempsPasseH).toBe(3);
  });

  it('evolution : renvoie exactement N mois', async () => {
    const prisma = { tache: { findMany: jest.fn().mockResolvedValue([]) } };
    const r = await svc(prisma).evolution(6);
    expect(r.donnees).toHaveLength(6);
  });
});
