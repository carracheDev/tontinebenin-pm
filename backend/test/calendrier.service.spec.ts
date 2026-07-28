import { CalendrierService } from '../src/modules/calendrier/calendrier.service';

const notifs = { notifier: jest.fn().mockResolvedValue({}) } as any;

function prismaMock(evenements: any[]) {
  return {
    evenement: {
      findMany: jest.fn().mockResolvedValue(evenements),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    },
  } as any;
}

describe('CalendrierService — rappels', () => {
  beforeEach(() => notifs.notifier.mockClear());

  it('envoie un rappel quand on est dans la fenêtre (rappelAvantMin)', async () => {
    const dans10min = new Date(Date.now() + 10 * 60000);
    const prisma = prismaMock([
      { id: 'e1', titre: 'Réunion', debut: dans10min, rappelAvantMin: 15, participants: [{ membreId: 'u1' }, { membreId: 'u2' }] },
    ]);
    const service = new CalendrierService(prisma, notifs);
    await service.envoyerRappels();
    expect(notifs.notifier).toHaveBeenCalledTimes(2); // 2 participants
    expect(prisma.evenement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { rappelEnvoye: true } }),
    );
  });

  it('n’envoie pas si l’événement est trop loin', async () => {
    const dans2h = new Date(Date.now() + 120 * 60000);
    const prisma = prismaMock([
      { id: 'e2', titre: 'Loin', debut: dans2h, rappelAvantMin: 15, participants: [{ membreId: 'u1' }] },
    ]);
    const service = new CalendrierService(prisma, notifs);
    await service.envoyerRappels();
    expect(notifs.notifier).not.toHaveBeenCalled();
  });
});
