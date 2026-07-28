import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ValidationsService } from '../src/modules/validations/validations.service';

function prismaMock() {
  return {
    tache: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    validation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'v1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    membre: { findMany: jest.fn().mockResolvedValue([]) },
    historiqueTache: { create: jest.fn().mockResolvedValue({}) },
  } as any;
}
const notifs = { notifier: jest.fn().mockResolvedValue({}) } as any;

describe('ValidationsService', () => {
  let prisma: any;
  let service: ValidationsService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new ValidationsService(prisma, notifs);
    notifs.notifier.mockClear();
  });

  it('demander : passe la tâche EN_VALIDATION', async () => {
    prisma.tache.findUnique.mockResolvedValue({ id: 't1', titre: 'X' });
    prisma.validation.findFirst.mockResolvedValue(null);
    await service.demander('t1', { validateurId: 'u2' } as any, 'u1');
    expect(prisma.tache.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { statut: 'EN_VALIDATION' } }),
    );
    expect(notifs.notifier).toHaveBeenCalledTimes(1); // responsable ciblé
  });

  it('demander : refuse si une validation est déjà en cours', async () => {
    prisma.tache.findUnique.mockResolvedValue({ id: 't1', titre: 'X' });
    prisma.validation.findFirst.mockResolvedValue({ id: 'vX' });
    await expect(
      service.demander('t1', {} as any, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('traiter ACCEPTEE : la tâche passe TERMINE', async () => {
    prisma.validation.findUnique.mockResolvedValue({
      id: 'v1', statut: 'DEMANDEE', tacheId: 't1',
      tache: { id: 't1', titre: 'X', assigneId: 'u1', createurId: 'u0' },
    });
    await service.traiter('v1', { decision: 'ACCEPTEE' } as any, 'u2');
    expect(prisma.tache.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statut: 'TERMINE' }) }),
    );
  });

  it('traiter : refuse une demande déjà traitée', async () => {
    prisma.validation.findUnique.mockResolvedValue({ id: 'v1', statut: 'ACCEPTEE', tache: {} });
    await expect(
      service.traiter('v1', { decision: 'REJETEE' } as any, 'u2'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('traiter : NotFound si validation inconnue', async () => {
    prisma.validation.findUnique.mockResolvedValue(null);
    await expect(
      service.traiter('x', { decision: 'ACCEPTEE' } as any, 'u2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
