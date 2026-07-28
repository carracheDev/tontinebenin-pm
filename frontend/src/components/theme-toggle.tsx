'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  const sombre = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(sombre ? 'light' : 'dark')}
      aria-label="Changer de thème"
      className="grid h-9 w-9 place-items-center rounded-lg border border-bordure bg-surface text-texte-sec transition hover:text-brand"
    >
      {monte ? sombre ? <Sun size={18} /> : <Moon size={18} /> : <span className="h-[18px] w-[18px]" />}
    </button>
  );
}
