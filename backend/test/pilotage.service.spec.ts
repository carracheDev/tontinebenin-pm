import { NotFoundException } from '@nestjs/common';
import { PilotageService } from '../src/modules/pilotage/pilotage.service';

function prismaMock() {
  return {
    projet: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', nom: 'X', statut: 'EN_COURS' }), update: jest.fn().mockResolvedValue({}) },
    phase: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn().mockResolvedValue({}), aggregate: jest.fn(), create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    tache: { count: jest.fn(), findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    objectif: { count: jest.fn().mockResolvedValue(0), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    jalon: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    risque: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
  } as any;
}

describe('PilotageService — avancement', () => {
  let prisma: any;
  let service: PilotageService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new PilotageService(prisma);
  });

  it('recalculer : 3 tâches sur 4 terminées → 75 %', async () => {
    // 1er appel count = total (4), 2e = terminées (3) pour le global (phases vides)
    prisma.tache.count
      .mockResolvedValueOnce(4)   // total projet
      .mockResolvedValueOnce(3);  // terminées projet
    const av = await service.recalculer('p1');
    expect(av).toBe(75);
    expect(prisma.projet.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { avancement: 75 } }),
    );
  });

  it('recalculer : aucune tâche → 0 %', async () => {
    prisma.tache.count.mockResolvedValue(0);
    const av = await service.recalculer('p1');
    expect(av).toBe(0);
  });

  it('recalculer : projet inexistant → NotFound', async () => {
    prisma.projet.findUnique.mockResolvedValue(null);
    await expect(service.recalculer('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('vueGlobale : marque « En retard » si une échéance est dépassée', async () => {
    prisma.tache.count.mockResolvedValue(0);
    prisma.tache.findMany.mockResolvedValue([
      { id: 't1', titre: 'R', statut: 'EN_COURS', echeance: new Date('2020-01-01'), assigne: null },
    ]);
    const r = await service.vueGlobale('p1');
    expect(r.donnees.etat).toBe('En retard');
    expect(r.donnees.retards).toHaveLength(1);
  });
});
