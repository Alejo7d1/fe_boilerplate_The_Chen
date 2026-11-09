'use client';
// FE-4.1 y FE-4.2 — Tabs por día, tarjetas y reserva.
import { useState, useTransition } from 'react';
import { reserveClass } from './actions';
import { TZ, dayKey } from './dates';

export type ClassItem = {
  id: string; name: string; trainerName: string; startsAt: string;
  durationMin: number; capacity: number; availableSpots: number;
};

const WEEKDAYS: Record<string, string> = { Mon: 'lun', Tue: 'mar', Wed: 'mié', Thu: 'jue', Fri: 'vie', Sat: 'sáb', Sun: 'dom' };

// Texto armado a mano para que servidor y navegador generen exactamente lo mismo.
const dayLabel = (key: string) => {
  const d = new Date(`${key}T12:00:00-06:00`);
  const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(d);
  const [, month, day] = key.split('-');
  return `${WEEKDAYS[wd]} ${day}/${month}`;
};

const hour = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const period = get('dayPeriod').toLowerCase().startsWith('p') ? 'p. m.' : 'a. m.';
  return `${get('hour').padStart(2, '0')}:${get('minute')} ${period}`;
};

type Props = { days: string[]; initialClasses: ClassItem[]; loadError: string };

export default function ReservarClases({ days, initialClasses, loadError }: Props) {
  const [classes, setClasses] = useState(initialClasses);
  const [selected, setSelected] = useState(days[0]);
  const [reserved, setReserved] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [alert, setAlert] = useState('');
  const [isPending, startTransition] = useTransition();

  const ofDay = classes.filter((c) => dayKey(c.startsAt) === selected);

  function reserve(c: ClassItem) {
    if (isPending) return; // sin envíos duplicados
    setPendingId(c.id);
    setAlert('');
    startTransition(async () => {
      const r = await reserveClass(c.id);
      if (r.ok) {
        setReserved((s) => new Set(s).add(c.id));
        setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, availableSpots: x.availableSpots - 1 } : x)));
      } else {
        setAlert(r.message);
        if (r.status === 409 && r.message === 'Clase sin cupos')
          setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, availableSpots: 0 } : x)));
      }
      setPendingId(null);
    });
  }

  if (loadError) return <p className="p-8 text-center text-red-700">{loadError}</p>;

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Reservar clase</h1>

      {alert && (
        <div role="alert" className="fixed inset-x-4 top-4 z-10 ml-auto flex max-w-sm items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow">
          <span>{alert}</span>
          <button onClick={() => setAlert('')} aria-label="Cerrar aviso" className="text-lg leading-none">×</button>
        </div>
      )}

      <div role="tablist" className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button key={d} role="tab" aria-selected={d === selected} onClick={() => setSelected(d)}
            className={`shrink-0 rounded-full border px-4 py-2 ${d === selected ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-800'}`}>
            {dayLabel(d)}
          </button>
        ))}
      </div>

      {ofDay.length === 0 ? (
        <p className="py-8 text-center text-slate-600">No hay clases programadas para este día.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ofDay.map((c) => {
            const full = c.availableSpots <= 0;
            const busy = pendingId === c.id;
            return (
              <li key={c.id} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <p className="text-slate-600">{c.trainerName}</p>
                  <p className="text-slate-600">{hour(c.startsAt)} · {c.durationMin} min</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={full ? 'text-red-700' : ''}>
                    <b className="text-2xl">{Math.max(c.availableSpots, 0)}</b> {c.availableSpots === 1 ? 'cupo libre' : 'cupos libres'}
                  </span>
                  {reserved.has(c.id) ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">Reservado</span>
                  ) : (
                    <button onClick={() => reserve(c)} disabled={full || isPending}
                      className="inline-flex min-h-10 min-w-34 items-center justify-center rounded-lg bg-teal-700 px-3 text-white disabled:cursor-not-allowed disabled:bg-slate-400">
                      {busy ? <span aria-label="Reservando" className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : full ? 'Clase llena' : 'Reservar cupo'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
