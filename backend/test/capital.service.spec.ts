import { CapitalService } from '../src/modules/capital/capital.service';

const service = new CapitalService({} as any);

function cap(over: Partial<any> = {}) {
  return {
    pourcentageAlloue: 20,
    pourcentageAcquis: 0,
    vestingActif: true,
    dureeVestingMois: 48,
    cliffMois: 12,
    dateDebutVesting: new Date(),
    ...over,
  };
}
function ilYaMois(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(d.getDate() - 1); // sécurise le jour anniversaire
  return d;
}

describe('CapitalService — vesting', () => {
  it('avant le cliff (6 mois) : 0 acquis', () => {
    const r = service.calculerVesting(cap({ dateDebutVesting: ilYaMois(6) }));
    expect(r.pourcentageAcquis).toBe(0);
    expect(r.cliffAtteint).toBe(false);
  });

  it('au cliff (12 mois) : 25 % du lot acquis (12/48 de 20 %)', () => {
    const r = service.calculerVesting(cap({ dateDebutVesting: ilYaMois(12) }));
    expect(r.pourcentageAcquis).toBe(5); // 20 * 12/48 = 5
    expect(r.cliffAtteint).toBe(true);
  });

  it('à mi-parcours (24 mois) : la moitié acquise', () => {
    const r = service.calculerVesting(cap({ dateDebutVesting: ilYaMois(24) }));
    expect(r.pourcentageAcquis).toBe(10); // 20 * 24/48
  });

  it('au-delà de la durée (50 mois) : tout acquis', () => {
    const r = service.calculerVesting(cap({ dateDebutVesting: ilYaMois(50) }));
    expect(r.pourcentageAcquis).toBe(20);
    expect(r.acquisComplet).toBe(true);
    expect(r.prochaineAcquisition).toBeNull();
  });

  it('vesting désactivé : tout acquis immédiatement', () => {
    const r = service.calculerVesting(cap({ vestingActif: false, dateDebutVesting: new Date() }));
    expect(r.pourcentageAcquis).toBe(20);
  });
});
