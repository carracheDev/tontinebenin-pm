'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';

const md = {
  h1: (p: React.ComponentProps<'h1'>) => <h1 className="mb-3 mt-1 text-2xl font-bold text-texte" {...p} />,
  h2: (p: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-7 border-b border-bordure pb-2 text-lg font-semibold text-texte" {...p} />,
  h3: (p: React.ComponentProps<'h3'>) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-texte" {...p} />,
  p: (p: React.ComponentProps<'p'>) => <p className="mb-3 text-sm leading-relaxed text-texte-sec" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-texte-sec" {...p} />,
  ol: (p: React.ComponentProps<'ol'>) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-texte-sec" {...p} />,
  li: (p: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => <strong className="font-semibold text-texte" {...p} />,
  em: (p: React.ComponentProps<'em'>) => <em className="italic text-texte-sec" {...p} />,
  hr: () => <hr className="my-6 border-bordure" />,
  blockquote: (p: React.ComponentProps<'blockquote'>) => (
    <blockquote className="mb-3 rounded-r-lg border-l-4 border-brand bg-surface-2 px-4 py-2 text-sm text-texte-sec" {...p} />
  ),
  code: (p: React.ComponentProps<'code'>) => (
    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-brand" {...p} />
  ),
  pre: (p: React.ComponentProps<'pre'>) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-bordure bg-surface-2 p-3 text-xs leading-relaxed text-texte" {...p} />
  ),
  table: (p: React.ComponentProps<'table'>) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  thead: (p: React.ComponentProps<'thead'>) => <thead className="bg-surface-2" {...p} />,
  th: (p: React.ComponentProps<'th'>) => <th className="border border-bordure px-3 py-2 text-left font-semibold text-texte" {...p} />,
  td: (p: React.ComponentProps<'td'>) => <td className="border border-bordure px-3 py-2 align-top text-texte-sec" {...p} />,
  a: (p: React.ComponentProps<'a'>) => <a className="text-brand underline underline-offset-2" {...p} />,
};

export default function EtatProduitPage() {
  const [contenu, setContenu] = useState('Chargement du document…');

  useEffect(() => {
    fetch('/etat-produit.md')
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setContenu)
      .catch(() => setContenu('Impossible de charger le document.'));
  }, []);

  return (
    <>
      <Header titre="État du produit" />
      <main className="p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
            {contenu}
          </ReactMarkdown>
        </Card>
      </main>
    </>
  );
}
