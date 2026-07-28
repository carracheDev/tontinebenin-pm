import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TypeRapportIA } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PilotageService } from '../pilotage/pilotage.service';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Assistant IA — génère des rapports de pilotage.
 *
 * Deux couches :
 *  1) SOCLE DÉTERMINISTE : le rapport markdown est bâti directement à partir des
 *     vraies données (pilotage / analytics). Zéro dépendance, zéro coût, toujours
 *     disponible — les chiffres sont exacts, jamais inventés.
 *  2) ENRICHISSEMENT IA (optionnel) : si IA_PROVIDER=gemini + GEMINI_API_KEY sont
 *     présents, le brouillon factuel est reformulé par l'IA (synthèse plus fluide).
 *     L'IA ne reçoit QUE le brouillon chiffré et a pour consigne de ne rien inventer.
 *     En cas d'absence de clé, d'erreur réseau ou de timeout → on garde le socle.
 */
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pilotage: PilotageService,
    private readonly analytics: AnalyticsService,
  ) {}

  private get provider(): string {
    return (process.env.IA_PROVIDER || 'none').toLowerCase();
  }

  // ───────────────────── API PUBLIQUE ─────────────────────

  /** Génère un rapport lié à un projet (ETAT_PROJET, ANALYSE_RETARDS, PREVISION_RISQUES, PERFORMANCE_EQUIPE). */
  async genererRapportProjet(projetId: string, type: TypeRapportIA) {
    let brouillon: string;
    switch (type) {
      case 'ETAT_PROJET':
        brouillon = await this.brouillonEtatProjet(projetId);
        break;
      case 'ANALYSE_RETARDS':
        brouillon = await this.brouillonRetards(projetId);
        break;
      case 'PREVISION_RISQUES':
        brouillon = await this.brouillonRisques(projetId);
        break;
      case 'PERFORMANCE_EQUIPE':
        brouillon = await this.brouillonPerformance();
        break;
      case 'SYNTHESE':
        brouillon = await this.brouillonSynthese();
        break;
      default:
        throw new NotFoundException({ message: 'Type de rapport inconnu.' });
    }
    return this.finaliser(type, projetId, brouillon);
  }

  /** Synthèse globale de tout le portefeuille (sans projet précis). */
  async genererSynthese() {
    const brouillon = await this.brouillonSynthese();
    return this.finaliser('SYNTHESE', null, brouillon);
  }

  /** Historique des rapports générés. */
  async liste(projetId?: string, type?: TypeRapportIA) {
    const rapports = await this.prisma.rapportIA.findMany({
      where: {
        ...(projetId ? { projetId } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { genereeLe: 'desc' },
      take: 100,
      select: { id: true, type: true, projetId: true, genereeLe: true },
    });
    return { succes: true, message: 'Rapports IA générés.', donnees: rapports };
  }

  async parId(id: string) {
    const rapport = await this.prisma.rapportIA.findUnique({ where: { id } });
    if (!rapport) throw new NotFoundException({ message: 'Rapport introuvable.' });
    return { succes: true, message: 'Rapport IA.', donnees: rapport };
  }

  async supprimer(id: string) {
    const rapport = await this.prisma.rapportIA.findUnique({ where: { id } });
    if (!rapport) throw new NotFoundException({ message: 'Rapport introuvable.' });
    await this.prisma.rapportIA.delete({ where: { id } });
    return { succes: true, message: 'Rapport supprimé.' };
  }

  // ───────────────────── FINALISATION ─────────────────────

  private async finaliser(type: TypeRapportIA, projetId: string | null, brouillon: string) {
    const enrichi = await this.enrichir(type, brouillon);
    const contenu = enrichi ?? brouillon;

    const rapport = await this.prisma.rapportIA.create({
      data: { type, projetId, contenu },
    });

    return {
      succes: true,
      message: 'Rapport généré.',
      donnees: {
        id: rapport.id,
        type: rapport.type,
        projetId: rapport.projetId,
        genereeLe: rapport.genereeLe,
        contenu,
        genereParIA: enrichi !== null,
        source: enrichi !== null ? this.provider : 'deterministe',
      },
    };
  }

  // ───────────────────── ENRICHISSEMENT IA (Gemini) ─────────────────────

  /** Reformule le brouillon via l'IA. Retourne null si désactivé/indisponible → socle conservé. */
  private async enrichir(type: TypeRapportIA, brouillon: string): Promise<string | null> {
    if (this.provider === 'gemini') return this.appelerGemini(type, brouillon);
    // 'none' (défaut) ou provider non implémenté → pas d'enrichissement
    return null;
  }

  private async appelerGemini(type: TypeRapportIA, brouillon: string): Promise<string | null> {
    const cle = process.env.GEMINI_API_KEY;
    if (!cle) {
      this.logger.warn('[IA] IA_PROVIDER=gemini mais GEMINI_API_KEY absente → socle déterministe.');
      return null;
    }
    const modele = process.env.IA_MODELE || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${cle}`;

    const consigne = [
      "Tu es analyste en gestion de projet pour une startup fintech béninoise (TontineBénin).",
      `Reformule le rapport factuel ci-dessous (type: ${type}) en une synthèse professionnelle en français,`,
      "claire et orientée décision, à destination des cofondateurs.",
      "RÈGLE ABSOLUE : n'invente, ne modifie et ne supprime AUCUN chiffre ni fait — appuie-toi STRICTEMENT",
      "sur les données fournies. Tu peux ajouter des recommandations, mais seulement si elles découlent des données.",
      "Réponds en Markdown.",
      '',
      '--- RAPPORT FACTUEL ---',
      brouillon,
    ].join('\n');

    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const rep = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: consigne }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
        signal: ctrl.signal,
      });
      if (!rep.ok) {
        this.logger.warn(`[IA] Gemini HTTP ${rep.status} → socle déterministe.`);
        return null;
      }
      const json: any = await rep.json();
      const texte: string | undefined =
        json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') || undefined;
      if (!texte || !texte.trim()) {
        this.logger.warn('[IA] Gemini réponse vide → socle déterministe.');
        return null;
      }
      return texte.trim();
    } catch (e) {
      this.logger.warn(`[IA] Gemini indisponible (${(e as Error).message}) → socle déterministe.`);
      return null;
    } finally {
      clearTimeout(minuteur);
    }
  }

  // ───────────────────── BROUILLONS DÉTERMINISTES ─────────────────────

  private entete(titre: string): string {
    const d = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
    return `# ${titre}\n\n_Généré le ${d}_\n`;
  }

  private async brouillonEtatProjet(projetId: string): Promise<string> {
    const { donnees: d } = await this.pilotage.vueGlobale(projetId);
    const l: string[] = [this.entete(`État du projet — ${d.projet.nom}`)];
    l.push(`## Vue d'ensemble`);
    l.push(`- **Statut** : ${d.projet.statut}  ·  **État** : ${d.etat}`);
    l.push(`- **Avancement global** : ${d.avancement} %`);
    l.push(`- **Objectifs** : ${d.objectifs.atteints}/${d.objectifs.total} atteints (${d.objectifs.restants} restants)`);
    l.push(`- **Tâches** : ${d.taches.total} au total`);
    for (const [statut, n] of Object.entries(d.taches.parStatut)) {
      if ((n as number) > 0) l.push(`  - ${statut} : ${n}`);
    }
    l.push(`- **Retards** : ${d.retards.length} tâche(s) en retard`);
    l.push(`- **Risques ouverts** : ${d.risques.total} (dont ${d.risques.critiques} critique(s))`);

    if (d.phases.length) {
      l.push(`\n## Avancement par phase`);
      for (const p of d.phases) l.push(`- ${p.nom} — ${p.avancement} % (${p.statut})`);
    }
    if (d.roadmap.prochains.length) {
      l.push(`\n## Prochains jalons`);
      for (const j of d.roadmap.prochains) {
        l.push(`- ${new Date(j.date).toLocaleDateString('fr-FR')} — ${j.titre}`);
      }
    }
    return l.join('\n');
  }

  private async brouillonRetards(projetId: string): Promise<string> {
    const { donnees: d } = await this.pilotage.vueGlobale(projetId);
    const l: string[] = [this.entete(`Analyse des retards — ${d.projet.nom}`)];
    l.push(`## Résumé`);
    l.push(`- **Tâches en retard** : ${d.retards.length}`);
    l.push(`- **Jalons en retard** : ${d.roadmap.enRetard.length}`);

    if (d.retards.length) {
      l.push(`\n## Tâches en retard`);
      for (const t of d.retards) {
        const ech = t.echeance ? new Date(t.echeance).toLocaleDateString('fr-FR') : '—';
        const qui = t.assigne?.nomComplet ?? 'non assignée';
        l.push(`- **${t.titre}** — échéance ${ech} · ${qui} · statut ${t.statut}`);
      }
    } else {
      l.push(`\n_Aucune tâche en retard. 👍_`);
    }
    if (d.roadmap.enRetard.length) {
      l.push(`\n## Jalons dépassés`);
      for (const j of d.roadmap.enRetard) {
        l.push(`- ${new Date(j.date).toLocaleDateString('fr-FR')} — ${j.titre}`);
      }
    }
    return l.join('\n');
  }

  private async brouillonRisques(projetId: string): Promise<string> {
    const { donnees: d } = await this.pilotage.vueGlobale(projetId);
    const { donnees: risques } = await this.pilotage.listeRisques(projetId);
    const l: string[] = [this.entete(`Prévision des risques — ${d.projet.nom}`)];
    l.push(`## Contexte`);
    l.push(`- **État du projet** : ${d.etat} (${d.avancement} % réalisé)`);
    l.push(`- **Risques ouverts** : ${d.risques.total} · **critiques** : ${d.risques.critiques}`);
    l.push(`- **Retards constatés** : ${d.retards.length} tâche(s), ${d.roadmap.enRetard.length} jalon(s)`);

    const ouverts = (risques as any[]).filter((r) => !r.resolu);
    if (ouverts.length) {
      l.push(`\n## Registre des risques ouverts`);
      for (const r of ouverts) {
        l.push(`- **[${r.niveau}]** ${r.description ?? r.titre ?? 'Risque'}${r.mitigation ? ` — _mitigation : ${r.mitigation}_` : ''}`);
      }
    } else {
      l.push(`\n_Aucun risque ouvert enregistré._`);
    }
    l.push(`\n## Signaux d'alerte automatiques`);
    if (d.risques.critiques > 0) l.push(`- ⚠️ ${d.risques.critiques} risque(s) critique(s) non résolu(s).`);
    if (d.retards.length > 0) l.push(`- ⚠️ ${d.retards.length} tâche(s) en retard — risque de glissement du planning.`);
    if (d.roadmap.enRetard.length > 0) l.push(`- ⚠️ ${d.roadmap.enRetard.length} jalon(s) déjà dépassé(s).`);
    if (d.risques.critiques === 0 && d.retards.length === 0 && d.roadmap.enRetard.length === 0) {
      l.push(`- ✅ Aucun signal d'alerte majeur détecté.`);
    }
    return l.join('\n');
  }

  private async brouillonPerformance(): Promise<string> {
    const { donnees } = await this.analytics.performanceMembres();
    const l: string[] = [this.entete(`Performance de l'équipe`)];
    if (!donnees.length) {
      l.push(`_Aucun membre actif._`);
      return l.join('\n');
    }
    const tri = [...donnees].sort((a, b) => b.tauxCompletion - a.tauxCompletion);
    l.push(`## Taux de complétion par membre`);
    for (const m of tri) {
      l.push(
        `- **${m.membre.nomComplet}** — ${m.tauxCompletion} % ` +
          `(${m.terminees}/${m.assignees} terminées · ${m.enCours} en cours · ${m.enRetard} en retard · ${m.tempsPasseH} h)`,
      );
    }
    const totalTaches = donnees.reduce((s, m) => s + m.assignees, 0);
    const totalTerm = donnees.reduce((s, m) => s + m.terminees, 0);
    const totalRetard = donnees.reduce((s, m) => s + m.enRetard, 0);
    l.push(`\n## Synthèse`);
    l.push(`- **Tâches assignées** : ${totalTaches} · **terminées** : ${totalTerm} · **en retard** : ${totalRetard}`);
    l.push(`- **Taux de complétion global** : ${totalTaches ? Math.round((totalTerm / totalTaches) * 100) : 0} %`);
    return l.join('\n');
  }

  private async brouillonSynthese(): Promise<string> {
    const { donnees: a } = await this.analytics.apercu();
    const l: string[] = [this.entete(`Synthèse du portefeuille`)];
    l.push(`## Indicateurs clés`);
    l.push(`- **Projets** : ${a.totalProjets} (dont ${a.projetsActifs} actifs)`);
    l.push(`- **Avancement moyen** : ${a.avancementMoyen} %`);
    l.push(`- **Membres actifs** : ${a.totalMembres}`);
    l.push(`- **Tâches** : ${a.totalTaches} · terminées : ${a.tachesTerminees} · en retard : ${a.tachesEnRetard}`);
    l.push(`\n## Répartition des tâches`);
    for (const [statut, n] of Object.entries(a.repartitionStatuts)) {
      if ((n as number) > 0) l.push(`- ${statut} : ${n}`);
    }
    l.push(`\n## Points d'attention`);
    if (a.tachesEnRetard > 0) l.push(`- ⚠️ ${a.tachesEnRetard} tâche(s) en retard sur l'ensemble du portefeuille.`);
    if (a.avancementMoyen < 30) l.push(`- ⚠️ Avancement moyen faible (${a.avancementMoyen} %).`);
    if (a.tachesEnRetard === 0) l.push(`- ✅ Aucun retard global.`);
    return l.join('\n');
  }
}
