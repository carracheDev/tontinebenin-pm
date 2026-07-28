import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TachesService } from '../src/modules/taches/taches.service';

/** Prisma mocké : on vérifie la logique métier sans base réelle. */
function prismaMock() {
  return {
    projet: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
    tache: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _max: { ordre: 2 } }),
      create: jest.fn(),
      update: jest.fn(),
    },
    historiqueTache: { create: jest.fn().mockResolvedValue({}) },
    notification: { create: jest.fn().mockResolvedValue({}) },
    blocage: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
  } as any;
}

describe('TachesService', () => {
  let prisma: any;
  let service: TachesService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new TachesService(prisma);
  });

  it('kanban renvoie les 5 colonnes', async () => {
    prisma.tache.findMany.mockResolvedValue([
      { id: 't1', statut: 'A_FAIRE' },
      { id: 't2', statut: 'TERMINE' },
    ]);
    const r = await service.kanban('p1');
    expect(r.donnees.colonnes).toHaveLength(5);
    expect(r.donnees.colonnes[0].taches).toHaveLength(1); // A_FAIRE
  });

  it('créer place la tâche en fin de colonne À faire (ordre max+1)', async () => {
    prisma.tache.create.mockResolvedValue({ id: 't9', titre: 'X' });
    await service.creer({ projetId: 'p1', titre: 'X' } as any, 'u1');
    expect(prisma.tache.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ordre: 3 }) }),
    );
  });

  it('créer notifie l’assigné si différent du créateur', async () => {
    prisma.tache.create.mockResolvedValue({ id: 't9', titre: 'X' });
    await service.creer({ projetId: 'p1', titre: 'X', assigneId: 'u2' } as any, 'u1');
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('déplacer enregistre un historique quand le statut change', async () => {
    prisma.tache.findUnique.mockResolvedValue({ id: 't1', statut: 'A_FAIRE' });
    prisma.tache.update.mockResolvedValue({ id: 't1', statut: 'EN_COURS' });
    await service.deplacer('t1', { statut: 'EN_COURS', ordre: 0 } as any, 'u1');
    expect(prisma.historiqueTache.create).toHaveBeenCalled();
  });

  it('bloquer refuse si déjà bloquée', async () => {
    prisma.tache.findUnique.mockResolvedValue({ id: 't1', statut: 'EN_COURS' });
    prisma.blocage.findUnique.mockResolvedValue({ tacheId: 't1', resolu: false });
    await expect(
      service.bloquer('t1', { motif: 'attente API' } as any, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('detail lève NotFound si la tâche n’existe pas', async () => {
    prisma.tache.findUnique.mockResolvedValue(null);
    await expect(service.detail('inconnu')).rejects.toBeInstanceOf(NotFoundException);
  });
});
