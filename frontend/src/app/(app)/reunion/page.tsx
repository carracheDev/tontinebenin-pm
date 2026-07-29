'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, Copy, Check, LogOut, Users, Plus, LogIn, Send, UserPlus, X } from 'lucide-react';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// Domaine de repli (mode démo, limité à 5 min par Jitsi).
const DOMAINE_DEMO = 'meet.jit.si';
// Salle fixe partagée par toute l'équipe (nom volontairement peu devinable).
const SALLE_EQUIPE = 'TontineBeninEquipe-R7x2kQ9';

type JitsiApi = {
  dispose: () => void;
  addEventListener?: (evenement: string, cb: () => void) => void;
};
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domaine: string, options: Record<string, unknown>) => JitsiApi;
  }
}

const scriptsCharges = new Set<string>();
function chargerJitsi(domaine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptsCharges.has(domaine) && window.JitsiMeetExternalAPI) return resolve();
    const s = document.createElement('script');
    s.src = `https://${domaine}/external_api.js`;
    s.async = true;
    s.onload = () => { scriptsCharges.add(domaine); resolve(); };
    s.onerror = () => reject(new Error('Chargement Jitsi impossible.'));
    document.body.appendChild(s);
  });
}

export default function ReunionPage() {
  const { membre } = useAuth();
  const [salle, setSalle] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [copie, setCopie] = useState(false);
  const [invite, setInvite] = useState<'' | 'envoi' | 'ok' | 'err'>('');
  const [modeDemo, setModeDemo] = useState(false);
  const [picker, setPicker] = useState<null | 'appel' | 'invite'>(null);
  const [erreur, setErreur] = useState('');
  const conteneurRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  // Auto-rejoint la salle passée en lien (?salle=…)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('salle');
    if (p) setSalle(p);
  }, []);

  function quitter() {
    apiRef.current?.dispose();
    apiRef.current = null;
    setSalle(null);
    // Retire le paramètre ?salle= de l'URL
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Monte la visio quand une salle est active
  useEffect(() => {
    if (!salle) return;
    let annule = false;
    (async () => {
      try {
        // Par défaut : mode démo (meet.jit.si). Si JaaS est configuré côté serveur,
        // on bascule sur 8x8.vc avec un jeton signé (durée illimitée, sans modérateur).
        let domaine = DOMAINE_DEMO;
        let roomName = salle;
        let jwt: string | undefined;
        try {
          const { data } = await api.get('/reunion/jaas');
          const d = data.donnees as { configure: boolean; domain?: string; appId?: string; token?: string };
          if (d?.configure && d.domain && d.appId && d.token) {
            domaine = d.domain;
            roomName = `${d.appId}/${salle}`;
            jwt = d.token;
            setModeDemo(false);
          } else {
            setModeDemo(true);
          }
        } catch {
          setModeDemo(true);
        }

        await chargerJitsi(domaine);
        if (annule || !conteneurRef.current || !window.JitsiMeetExternalAPI) return;
        apiRef.current = new window.JitsiMeetExternalAPI(domaine, {
          roomName,
          jwt,
          parentNode: conteneurRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: membre?.nomComplet ?? 'Invité' },
          configOverwrite: { startWithAudioMuted: true, prejoinPageEnabled: !jwt },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
        });
        apiRef.current.addEventListener?.('readyToClose', () => quitter());
      } catch {
        setErreur("La visio n'a pas pu démarrer. Vérifie ta connexion.");
      }
    })();
    return () => {
      annule = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salle]);

  function ouvrir(nom: string) {
    setErreur('');
    window.history.replaceState(null, '', `?salle=${encodeURIComponent(nom)}`);
    setSalle(nom);
  }

  function lienSalle() {
    return `${window.location.origin}/reunion?salle=${encodeURIComponent(salle ?? '')}`;
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lienSalle());
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch { /* ignore */ }
  }

  // Envoie l'invitation directement dans le canal d'équipe (plus de copier/coller).
  async function inviterEquipe() {
    setInvite('envoi');
    try {
      const { data } = await api.get('/messagerie/conversations');
      const canal = (data.donnees as { id: string; type: string }[]).find((c) => c.type === 'CANAL');
      if (!canal) { setInvite('err'); return; }
      await api.post(`/messagerie/conversations/${canal.id}/messages`, {
        contenu: `🎥 Réunion en cours — rejoignez-moi : ${lienSalle()}`,
      });
      setInvite('ok');
      setTimeout(() => setInvite(''), 3000);
    } catch {
      setInvite('err');
      setTimeout(() => setInvite(''), 3000);
    }
  }

  // Envoie le lien d'une salle dans la messagerie PRIVÉE d'un membre précis.
  async function envoyerDM(membreId: string, room: string) {
    const { data } = await api.post('/messagerie/direct', { membreId });
    const convId = data.donnees.id;
    const lien = `${window.location.origin}/reunion?salle=${encodeURIComponent(room)}`;
    await api.post(`/messagerie/conversations/${convId}/messages`, {
      contenu: `📞 ${membre?.nomComplet ?? 'Un membre'} t'invite à une réunion : ${lien}`,
    });
  }

  async function gererChoixMembre(membreId: string) {
    const mode = picker;
    setPicker(null);
    try {
      if (mode === 'appel') {
        // Réunion à deux : nouvelle salle privée + lien envoyé à la personne.
        const room = 'TontineBenin-' + Math.random().toString(36).slice(2, 10);
        await envoyerDM(membreId, room);
        ouvrir(room);
      } else if (mode === 'invite' && salle) {
        // Depuis une réunion en cours : invite une personne précise.
        await envoyerDM(membreId, salle);
        setInvite('ok');
        setTimeout(() => setInvite(''), 3000);
      }
    } catch {
      setInvite('err');
      setTimeout(() => setInvite(''), 3000);
    }
  }

  // ── En réunion ──
  if (salle) {
    return (
      <>
        <Header titre="Réunion en cours" />
        <main className="p-3 md:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={inviterEquipe}
              disabled={invite === 'envoi'}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
            >
              {invite === 'ok' ? <Check size={15} /> : <Send size={15} />}
              {invite === 'ok'
                ? 'Invitation envoyée !'
                : invite === 'envoi'
                  ? 'Envoi…'
                  : "Inviter l'équipe dans le chat"}
            </button>
            <button
              onClick={() => setPicker('invite')}
              className="flex items-center gap-1.5 rounded-lg border border-bordure px-3 py-1.5 text-sm font-medium text-texte transition hover:border-brand hover:text-brand"
            >
              <UserPlus size={15} /> Inviter une personne
            </button>
            <button
              onClick={copierLien}
              className="flex items-center gap-1.5 rounded-lg border border-bordure px-3 py-1.5 text-sm font-medium text-texte transition hover:border-brand hover:text-brand"
            >
              {copie ? <Check size={15} /> : <Copy size={15} />}
              {copie ? 'Copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={quitter}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-annuler px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <LogOut size={15} /> Quitter
            </button>
          </div>
          {invite === 'err' && (
            <p className="mb-3 text-sm text-annuler">Invitation non envoyée. Utilise « Copier le lien ».</p>
          )}
          {modeDemo && (
            <p className="mb-3 rounded-lg bg-attention/10 px-3 py-2 text-xs text-attention">
              ⚠️ Mode démo (meet.jit.si) : l’appel s’arrête au bout de 5 min. L’admin doit renseigner les clés 8x8 JaaS (JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY) pour des réunions illimitées.
            </p>
          )}
          <div
            ref={conteneurRef}
            className="h-[calc(100dvh-12rem)] overflow-hidden rounded-2xl border border-bordure bg-black md:h-[calc(100vh-190px)]"
          />
        </main>
        {picker && (
          <ChoixMembre monId={membre?.id} onChoisir={gererChoixMembre} onFerme={() => setPicker(null)} />
        )}
      </>
    );
  }

  // ── Accueil réunions ──
  return (
    <>
      <Header titre="Réunion" />
      <main className="space-y-5 p-4 md:p-6">
        <div className="max-w-2xl space-y-2 rounded-xl border border-bordure bg-surface-2 p-4 text-sm text-texte-sec">
          <p className="font-medium text-texte">Comment ça marche ?</p>
          <p>👥 <b>Le plus simple :</b> tout le monde clique sur <b>« Salle d’équipe »</b> → vous êtes automatiquement dans la même réunion. Aucun lien à partager.</p>
          <p>🔗 Pour une réunion privée, crée-la puis clique sur <b>« Inviter l’équipe dans le chat »</b> : le lien part tout seul dans la messagerie, les autres n’ont qu’à cliquer dessus.</p>
        </div>

        <div className="max-w-2xl space-y-1.5 rounded-xl border border-bordure bg-surface-2 p-4 text-sm text-texte-sec">
          <p>
            ℹ️ Une fois les <b>clés 8x8 JaaS</b> configurées par l’admin, chacun entre <b>directement</b>
            dans la réunion — pas d’écran « modérateur », pas de limite de durée.
          </p>
          <p className="text-xs">
            Tant qu’elles ne sont pas renseignées, la visio tourne en <b>mode démo</b> (meet.jit.si) :
            l’appel s’arrête au bout de 5 minutes et demande « Je suis l’hôte ».
          </p>
        </div>

        {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tuile text-brand">
              <Users size={24} />
            </div>
            <h3 className="font-semibold text-texte">Salle d’équipe</h3>
            <p className="text-sm text-texte-sec">La salle permanente de l’équipe. Tout le monde y rejoint la même réunion.</p>
            <button
              onClick={() => ouvrir(SALLE_EQUIPE)}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce"
            >
              <Video size={17} /> Rejoindre la salle d’équipe
            </button>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tuile text-brand">
              <UserPlus size={24} />
            </div>
            <h3 className="font-semibold text-texte">Appeler une personne</h3>
            <p className="text-sm text-texte-sec">Réunion à deux : choisis un membre, le lien arrive dans SA messagerie privée.</p>
            <button
              onClick={() => setPicker('appel')}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce"
            >
              <UserPlus size={17} /> Choisir une personne
            </button>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tuile text-brand">
              <Plus size={24} />
            </div>
            <h3 className="font-semibold text-texte">Nouvelle réunion</h3>
            <p className="text-sm text-texte-sec">Crée une salle privée à usage unique, puis partage le lien.</p>
            <button
              onClick={() => ouvrir('TontineBenin-' + Math.random().toString(36).slice(2, 10))}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-tuile"
            >
              <Plus size={17} /> Démarrer une réunion
            </button>
          </Card>
        </div>

        <Card className="flex flex-col gap-3">
          <h3 className="font-semibold text-texte">Rejoindre avec un code</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && code.trim()) ouvrir(code.trim()); }}
              placeholder="Nom / code de la salle"
              className="flex-1 rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none focus:border-brand"
            />
            <button
              onClick={() => code.trim() && ouvrir(code.trim())}
              disabled={!code.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-50"
            >
              <LogIn size={16} /> Rejoindre
            </button>
          </div>
        </Card>

        <p className="text-xs text-texte-sec">
          ⚠️ La visio consomme beaucoup de données : privilégie le Wi-Fi. Coupe la caméra si la connexion est faible.
        </p>
      </main>
      {picker && (
        <ChoixMembre monId={membre?.id} onChoisir={gererChoixMembre} onFerme={() => setPicker(null)} />
      )}
    </>
  );
}

/* ---------- Modal : choisir un membre à appeler / inviter ---------- */
function ChoixMembre({
  monId,
  onChoisir,
  onFerme,
}: {
  monId?: string;
  onChoisir: (membreId: string) => void;
  onFerme: () => void;
}) {
  const [membres, setMembres] = useState<{ id: string; nomComplet: string }[]>([]);
  useEffect(() => {
    api.get('/membres').then((r) =>
      setMembres((r.data.donnees ?? r.data).filter((m: { id: string }) => m.id !== monId)),
    );
  }, [monId]);
  const initiales = (n: string) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-bordure bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-texte">Choisir une personne</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={19} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {membres.map((m) => (
            <button
              key={m.id}
              onClick={() => onChoisir(m.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-2"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initiales(m.nomComplet)}</div>
              <span className="text-sm text-texte">{m.nomComplet}</span>
            </button>
          ))}
          {membres.length === 0 && <p className="py-6 text-center text-sm text-texte-sec">Aucun autre membre.</p>}
        </div>
      </div>
    </div>
  );
}
