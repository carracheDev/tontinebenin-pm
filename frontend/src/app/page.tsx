'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  // router.replace respecte le basePath (préfixe /pm en prod) — contrairement à redirect()
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return (
    <div className="grid min-h-screen place-items-center bg-fond">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-bordure border-t-brand" />
    </div>
  );
}
