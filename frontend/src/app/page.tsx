import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard'); // le garde d'auth renverra vers /connexion si non connecté
}
