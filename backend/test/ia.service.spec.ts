import { IaService } from '../src/modules/ia/ia.service';

function svc(over: { prisma?: any; pilotage?: any; analytics?: any } = {}) {
  const prisma = over.prisma ?? {
    rapportIA: {
      create: jest.fn(async ({ data }: any) => ({ id: 'r1', genereeLe: new Date(), ...data })),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  return new IaService(prisma as any, (over.pilotage ?? {}) as any, (over.analytics ?? {}) as any);
}

const vueGlobale = {
  donnees: {
    projet: { id: 'p1', nom: 'TontineBénin', statut: 'EN_COURS', version: 1 },
    avancement: 60,
    etat: 'En bonne voie',
    objectifs: { total: 5, atteints: 3, restants: 2 },
    taches: { total: 10, parStatut: { A_FAIRE: 4, EN_COURS: 3, TERMINE: 3, BLOQUE: 0, EN_VALIDATION: 0 } },
    retards: [{ titre: 'API paiement', echeance: new Date('2020-01-01'), statut: 'EN_COURS', assigne: { nomComplet: 'Carrache' } }],
    phases: [{ nom: 'MVP', statut: 'EN_COURS', avancement: 60 }],
    roadmap: { prochains: [{ date: new Date('2999-01-01'), titre: 'Lancement' }], enRetard: [] },
    risques: { total: 2, critiques: 1 },
  },
};

describe('IaService — rapports déterministes', () => {
  beforeEach(() => {
    delete process.env.IA_PROVIDER; // socle déterministe par défaut
  });

  it('ETAT_PROJET : bâtit le markdown depuis vueGlobale et le persiste', async () => {
    const create = jest.fn(async ({ data }: any) => ({ id: 'r1', genereeLe: new Date(), ...data }));
    const s = svc({
      prisma: { rapportIA: { create } },
      pilotage: { vueGlobale: jest.fn().mockResolvedValue(vueGlobale) },
    });

    const r = await s.genererRapportProjet('p1', 'ETAT_PROJET' as any);

    expect(r.succes).toBe(true);
    expect(r.donnees.genereParIA).toBe(false);
    expect(r.donnees.source).toBe('deterministe');
    expect(r.donnees.contenu).toContain('État du projet — TontineBénin');
    expect(r.donnees.contenu).toContain('60 %');
    expect(r.donnees.contenu).toContain('3/5 atteints');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'ETAT_PROJET', projetId: 'p1' }) }),
    );
  });

  it('ANALYSE_RETARDS : liste les tâches en retard', async () => {
    const s = svc({ pilotage: { vueGlobale: jest.fn().mockResolvedValue(vueGlobale) } });
    const r = await s.genererRapportProjet('p1', 'ANALYSE_RETARDS' as any);
    expect(r.donnees.contenu).toContain('Analyse des retards');
    expect(r.donnees.contenu).toContain('API paiement');
    expect(r.donnees.contenu).toContain('Carrache');
  });

  it('PERFORMANCE_EQUIPE : classe les membres par taux de complétion', async () => {
    const analytics = {
      performanceMembres: jest.fn().mockResolvedValue({
        donnees: [
          { membre: { nomComplet: 'Alphonsine' }, assignees: 4, terminees: 3, enCours: 1, enRetard: 0, tempsPasseH: 6, tauxCompletion: 75 },
          { membre: { nomComplet: 'Carrache' }, assignees: 2, terminees: 2, enCours: 0, enRetard: 0, tempsPasseH: 3, tauxCompletion: 100 },
        ],
      }),
    };
    const s = svc({ analytics });
    const r = await s.genererRapportProjet('p1', 'PERFORMANCE_EQUIPE' as any);
    // Carrache (100 %) doit apparaître avant Alphonsine (75 %)
    const idxCarrache = r.donnees.contenu.indexOf('Carrache');
    const idxAlpho = r.donnees.contenu.indexOf('Alphonsine');
    expect(idxCarrache).toBeGreaterThan(-1);
    expect(idxCarrache).toBeLessThan(idxAlpho);
  });

  it('SYNTHESE globale : indicateurs du portefeuille', async () => {
    const analytics = {
      apercu: jest.fn().mockResolvedValue({
        donnees: {
          totalProjets: 3, projetsActifs: 2, avancementMoyen: 45, totalMembres: 4,
          totalTaches: 20, tachesTerminees: 8, tachesEnRetard: 2,
          repartitionStatuts: { A_FAIRE: 6, EN_COURS: 4, TERMINE: 8, BLOQUE: 2, EN_VALIDATION: 0 },
        },
      }),
    };
    const s = svc({ analytics });
    const r = await s.genererSynthese();
    expect(r.donnees.contenu).toContain('Synthèse du portefeuille');
    expect(r.donnees.contenu).toContain('2 tâche(s) en retard');
  });
});
