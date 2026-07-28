'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Hash, Mic, Plus, Send, User, X, Play, Pause, Trash2 } from 'lucide-react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

interface Auteur { id: string; nomComplet: string; photoUrl?: string | null }
interface Message {
  id: string;
  type: 'TEXTE' | 'VOCAL';
  contenu?: string | null;
  audioFichier?: string | null;
  dureeSec?: number | null;
  creeLe: string;
  auteur: Auteur;
}
interface Conversation {
  id: string;
  type: 'CANAL' | 'DIRECT';
  nom: string;
  interlocuteur?: Auteur | null;
  membres: Auteur[];
  dernierMessage?: Message | null;
  nonLus: number;
}

const initiales = (n: string) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const heure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function MessageriePage() {
  const { membre } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [actifId, setActifId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [modalDM, setModalDM] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  const chargerConvs = useCallback(async () => {
    const { data } = await api.get('/messagerie/conversations');
    setConvs(data.donnees);
    return data.donnees as Conversation[];
  }, []);

  const chargerMessages = useCallback(async (id: string) => {
    if (!id) return;
    const { data } = await api.get(`/messagerie/conversations/${id}/messages`);
    setMessages(data.donnees);
  }, []);

  // init : conversations + sélectionne le canal d'équipe
  useEffect(() => {
    (async () => {
      const liste = await chargerConvs();
      const canal = liste.find((c) => c.type === 'CANAL') ?? liste[0];
      if (canal) setActifId(canal.id);
    })();
  }, [chargerConvs]);

  useEffect(() => {
    chargerMessages(actifId);
  }, [actifId, chargerMessages]);

  // temps réel : nouveaux messages
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNouveau = (p: { conversationId: string; message: Message }) => {
      chargerConvs();
      if (p.conversationId === actifId) {
        setMessages((m) => (m.some((x) => x.id === p.message.id) ? m : [...m, p.message]));
      }
    };
    s.on('message:nouveau', onNouveau);
    return () => { s.off('message:nouveau', onNouveau); };
  }, [actifId, chargerConvs]);

  // filet de sécurité : rafraîchit la liste toutes les 15 s
  useEffect(() => {
    const t = setInterval(() => chargerConvs(), 15000);
    return () => clearInterval(t);
  }, [chargerConvs]);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function ouvrirDM(membreId: string) {
    const { data } = await api.post('/messagerie/direct', { membreId });
    await chargerConvs();
    setActifId(data.donnees.id);
    setModalDM(false);
  }

  async function envoyerTexte(contenu: string) {
    const { data } = await api.post(`/messagerie/conversations/${actifId}/messages`, { contenu });
    setMessages((m) => [...m, data.donnees]);
    chargerConvs();
  }

  async function envoyerVocal(blob: Blob, dureeSec: number) {
    const fd = new FormData();
    fd.append('audio', blob, 'vocal.webm');
    fd.append('dureeSec', String(dureeSec));
    const { data } = await api.post(`/messagerie/conversations/${actifId}/vocal`, fd);
    setMessages((m) => [...m, data.donnees]);
    chargerConvs();
  }

  const actif = convs.find((c) => c.id === actifId);

  return (
    <>
      <Header titre="Messagerie" />
      <main className="p-6">
        <div className="grid h-[calc(100vh-140px)] grid-cols-1 overflow-hidden rounded-2xl border border-bordure bg-surface md:grid-cols-[300px_1fr]">
          {/* Colonne conversations */}
          <div className="flex flex-col border-r border-bordure">
            <div className="flex items-center justify-between border-b border-bordure px-4 py-3">
              <span className="text-sm font-semibold text-texte">Conversations</span>
              <button onClick={() => setModalDM(true)} title="Nouveau message privé" className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white hover:bg-brand-fonce">
                <Plus size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActifId(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-bordure/60 px-4 py-3 text-left transition ${actifId === c.id ? 'bg-brand-tuile' : 'hover:bg-surface-2'}`}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${c.type === 'CANAL' ? 'bg-brand text-white' : 'bg-surface-2 text-texte'}`}>
                    {c.type === 'CANAL' ? <Hash size={18} /> : initiales(c.nom)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-texte">{c.nom}</span>
                      {c.dernierMessage && <span className="shrink-0 text-[11px] text-texte-sec">{heure(c.dernierMessage.creeLe)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-texte-sec">
                        {c.dernierMessage ? (c.dernierMessage.type === 'VOCAL' ? '🎙️ Message vocal' : c.dernierMessage.contenu) : 'Aucun message'}
                      </span>
                      {c.nonLus > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">{c.nonLus}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fenêtre de discussion */}
          {actif ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-bordure px-5 py-3">
                <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${actif.type === 'CANAL' ? 'bg-brand text-white' : 'bg-surface-2 text-texte'}`}>
                  {actif.type === 'CANAL' ? <Hash size={16} /> : initiales(actif.nom)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-texte">{actif.nom}</p>
                  <p className="text-xs text-texte-sec">{actif.type === 'CANAL' ? `${actif.membres.length} membres` : 'Message privé'}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-fond/40 px-5 py-4">
                {messages.map((m) => {
                  const moi = m.auteur.id === membre?.id;
                  return (
                    <div key={m.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${moi ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        {!moi && actif.type === 'CANAL' && <span className="px-1 text-[11px] font-medium text-texte-sec">{m.auteur.nomComplet}</span>}
                        <div className={`rounded-2xl px-3 py-2 ${moi ? 'bg-brand text-white' : 'bg-surface text-texte'}`}>
                          {m.type === 'VOCAL' ? (
                            <LecteurVocal fichier={m.audioFichier!} duree={m.dureeSec ?? 0} moi={moi} />
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm">{m.contenu}</p>
                          )}
                        </div>
                        <span className={`px-1 text-[10px] text-texte-sec ${moi ? 'text-right' : ''}`}>{heure(m.creeLe)}</span>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="py-10 text-center text-sm text-texte-sec">Aucun message. Lance la discussion 👋</p>}
                <div ref={finRef} />
              </div>

              <Composer onTexte={envoyerTexte} onVocal={envoyerVocal} />
            </div>
          ) : (
            <div className="grid place-items-center text-sm text-texte-sec">Sélectionne une conversation</div>
          )}
        </div>
      </main>

      {modalDM && <ModalDM monId={membre?.id} onChoisir={ouvrirDM} onFerme={() => setModalDM(false)} />}
    </>
  );
}

/* ---------- Composer (texte + vocal maintenu) ---------- */
function Composer({ onTexte, onVocal }: { onTexte: (c: string) => Promise<void>; onVocal: (b: Blob, d: number) => Promise<void> }) {
  const [texte, setTexte] = useState('');
  const [enreg, setEnreg] = useState(false);
  const [secs, setSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const debutRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function envoyer() {
    const c = texte.trim();
    if (!c) return;
    setTexte('');
    await onTexte(c);
  }

  async function demarrerEnreg() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const duree = Math.max(1, Math.round((Date.now() - debutRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) onVocal(blob, duree);
      };
      recRef.current = rec;
      debutRef.current = Date.now();
      rec.start();
      setEnreg(true);
      setSecs(0);
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      alert('Micro inaccessible. Autorise le micro dans le navigateur.');
    }
  }

  function arreterEnreg(annuler = false) {
    if (timerRef.current) clearInterval(timerRef.current);
    setEnreg(false);
    const rec = recRef.current;
    if (!rec) return;
    if (annuler) rec.onstop = () => rec.stream.getTracks().forEach((t) => t.stop());
    rec.stop();
    recRef.current = null;
  }

  return (
    <div className="flex items-center gap-2 border-t border-bordure px-4 py-3">
      {enreg ? (
        <div className="flex flex-1 items-center gap-3 rounded-lg bg-annuler/10 px-3 py-2.5">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-annuler" />
          <span className="text-sm font-medium text-annuler">Enregistrement… {secs}s</span>
          <button onClick={() => arreterEnreg(true)} className="ml-auto text-texte-sec hover:text-annuler" title="Annuler"><Trash2 size={17} /></button>
        </div>
      ) : (
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
          placeholder="Écris un message…"
          className="flex-1 rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none focus:border-brand"
        />
      )}

      {texte.trim() && !enreg ? (
        <button onClick={envoyer} className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white hover:bg-brand-fonce"><Send size={18} /></button>
      ) : (
        <button
          onMouseDown={demarrerEnreg}
          onMouseUp={() => arreterEnreg(false)}
          onMouseLeave={() => enreg && arreterEnreg(false)}
          onTouchStart={(e) => { e.preventDefault(); demarrerEnreg(); }}
          onTouchEnd={(e) => { e.preventDefault(); arreterEnreg(false); }}
          title="Maintiens pour parler"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition ${enreg ? 'bg-annuler text-white' : 'bg-brand text-white hover:bg-brand-fonce'}`}
        >
          <Mic size={18} />
        </button>
      )}
    </div>
  );
}

/* ---------- Lecteur de message vocal ---------- */
function LecteurVocal({ fichier, duree, moi }: { fichier: string; duree: number; moi: boolean }) {
  const [url, setUrl] = useState('');
  const [joue, setJoue] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function basculer() {
    if (!url) {
      const { data } = await api.get(`/messagerie/audio/${fichier}`, { responseType: 'blob' });
      const u = URL.createObjectURL(data as Blob);
      setUrl(u);
      const a = new Audio(u);
      audioRef.current = a;
      a.onended = () => setJoue(false);
      a.play(); setJoue(true);
      return;
    }
    const a = audioRef.current!;
    if (joue) { a.pause(); setJoue(false); } else { a.play(); setJoue(true); }
  }

  const mm = Math.floor(duree / 60);
  const ss = String(duree % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <button onClick={basculer} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${moi ? 'bg-white/20' : 'bg-brand/15 text-brand'}`}>
        {joue ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className={`h-1 w-24 rounded-full ${moi ? 'bg-white/30' : 'bg-bordure'}`} />
      <span className="text-xs opacity-80">{mm}:{ss}</span>
    </div>
  );
}

/* ---------- Modal : nouveau message privé ---------- */
function ModalDM({ monId, onChoisir, onFerme }: { monId?: string; onChoisir: (id: string) => void; onFerme: () => void }) {
  const [membres, setMembres] = useState<Auteur[]>([]);
  useEffect(() => { api.get('/membres').then((r) => setMembres((r.data.donnees ?? r.data).filter((m: Auteur) => m.id !== monId))); }, [monId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="w-full max-w-sm rounded-2xl border border-bordure bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-texte">Message privé à…</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={19} /></button>
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {membres.map((m) => (
            <button key={m.id} onClick={() => onChoisir(m.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initiales(m.nomComplet)}</div>
              <span className="text-sm text-texte">{m.nomComplet}</span>
            </button>
          ))}
          {membres.length === 0 && <p className="py-6 text-center text-sm text-texte-sec"><User size={20} className="mx-auto mb-1 opacity-50" />Aucun autre membre.</p>}
        </div>
      </div>
    </div>
  );
}
