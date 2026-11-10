// FE-4.1 — Ruta /clases/reservar. Server Component: trae las clases con el token de la cookie.
import { getSession } from '@/lib/session';
import { nextDays } from './dates';
import ReservarClases, { type ClassItem } from './reservar-clases';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getSession();
  let classes: ClassItem[] = [];
  let error = '';

  try {
    const res = await fetch(`${process.env.API_URL}/class-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) classes = await res.json();
    else error = 'No se pudieron cargar las clases. Intenta de nuevo.';
  } catch {
    error = 'No se pudieron cargar las clases. Intenta de nuevo.';
  }

  return <ReservarClases days={nextDays()} initialClasses={classes} loadError={error} />;
}
