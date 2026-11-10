"use client";

import { useMemo, useRef, useState } from "react";

/* ---------- Datos simulados del cobro (reemplazar por datos del backend) ---------- */
const COBRO = {
  id: "CHG-89421",
  concepto: "Renovación de Membresía Mensual",
  generadoPor: "H2 (Renovación Automática)",
  estado: "PENDIENTE",
  monto: 45.0,
};

const PROCESSING_DELAY_MS = 2000;

type Field = "titular" | "numero" | "expiracion" | "cvv";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

/* ---------- Formateo ---------- */
const digitsOnly = (v: string) => v.replace(/\D/g, "");

const formatCardNumber = (v: string) =>
  digitsOnly(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (v: string) => {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/* ---------- Validación ---------- */
function validate(values: Values): Errors {
  const errors: Errors = {};

  const nombre = values.titular.trim();
  if (nombre.length < 3 || nombre.length > 100) {
    errors.titular = "El nombre debe tener entre 3 y 100 caracteres.";
  }

  if (digitsOnly(values.numero).length !== 16) {
    errors.numero = "El número de tarjeta debe tener 16 dígitos.";
  }

  const match = /^(\d{2})\/(\d{2})$/.exec(values.expiracion);
  if (!match) {
    errors.expiracion = "Usa el formato MM/YY.";
  } else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expired =
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1);
    if (month < 1 || month > 12) errors.expiracion = "El mes debe estar entre 01 y 12.";
    else if (expired) errors.expiracion = "La tarjeta está vencida.";
  }

  if (!/^\d{3,4}$/.test(values.cvv)) {
    errors.cvv = "El CVV debe tener 3 o 4 dígitos.";
  }

  return errors;
}

type Result = { ok: boolean; message: string } | null;

export default function ProcesarPagoPage() {
  // TODO: proteger la ruta con el rol MIEMBRO usando el mecanismo de auth del proyecto
  // (guard / middleware / store). Ejemplo: if (user.role !== "MIEMBRO") redirect("/login")

  const [values, setValues] = useState<Values>({
    titular: "",
    numero: "",
    expiracion: "",
    cvv: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const submitLock = useRef(false); // evita reenvíos aunque React no haya re-renderizado

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const setField = (field: Field, raw: string) => {
    let value = raw;
    if (field === "numero") value = formatCardNumber(raw);
    if (field === "expiracion") value = formatExpiry(raw);
    if (field === "cvv") value = digitsOnly(raw).slice(0, 4);
    if (field === "titular") value = raw.slice(0, 100);
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || loading) return;

    setTouched({ titular: true, numero: true, expiracion: true, cvv: true });
    if (!isValid) return;

    submitLock.current = true;
    setLoading(true);
    setResult(null);

    // Simulación de pasarela: retardo de 2 segundos
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));

    const last4 = digitsOnly(values.numero).slice(-4);
    const approved = last4 === "4242" || last4 === "0002";

    setResult(
      approved
        ? { ok: true, message: `Pago aprobado. Cobro ${COBRO.id} pagado.` }
        : { ok: false, message: "Tarjeta rechazada. Revisa los datos o usa otra tarjeta." }
    );
    setLoading(false);
    submitLock.current = false;
  };

  const showError = (f: Field) => (touched[f] && errors[f] ? errors[f] : undefined);

  const inputClass = (f: Field) =>
    [
      "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
      "outline-none transition focus:ring-2 focus:ring-indigo-500/40",
      "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
      showError(f) ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-indigo-500",
    ].join(" ");

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Encabezado */}
        <header className="flex items-start justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold text-indigo-100">Checkout seguro</p>
            <h1 className="mt-1 text-xl font-bold">Realizar pago de cobro pendiente</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-100">Monto a pagar</p>
            <p className="text-3xl font-bold">${COBRO.monto.toFixed(2)}</p>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Detalles del cobro */}
          <section
            aria-label="Detalles del cobro"
            className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
          >
            <div>
              <p className="text-slate-500">ID de cobro</p>
              <p className="font-mono font-semibold text-slate-900">{COBRO.id}</p>
            </div>
            <div>
              <p className="text-slate-500">Concepto</p>
              <p className="font-semibold text-slate-900">{COBRO.concepto}</p>
            </div>
            <div>
              <p className="text-slate-500">Generado por</p>
              <p className="font-semibold text-slate-900">{COBRO.generadoPor}</p>
            </div>
            <div>
              <p className="text-slate-500">Estado actual</p>
              <p className="font-semibold text-amber-600">
                <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
                {COBRO.estado}
              </p>
            </div>
          </section>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate aria-busy={loading} className="space-y-5">
            {/* fieldset disabled inhabilita todos los controles durante el envío */}
            <fieldset disabled={loading} className="space-y-5">
              <div>
                <label htmlFor="titular" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Nombre del titular de la tarjeta
                </label>
                <input
                  id="titular"
                  type="text"
                  autoComplete="cc-name"
                  placeholder="Ej. Juan Pérez"
                  value={values.titular}
                  onChange={(e) => setField("titular", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, titular: true }))}
                  aria-invalid={!!showError("titular")}
                  aria-describedby="titular-err"
                  className={inputClass("titular")}
                />
                <p id="titular-err" role="alert" className="mt-1 min-h-4 text-xs text-red-600">
                  {showError("titular")}
                </p>
              </div>

              <div>
                <label htmlFor="numero" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Número de tarjeta
                </label>
                <input
                  id="numero"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  value={values.numero}
                  onChange={(e) => setField("numero", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, numero: true }))}
                  aria-invalid={!!showError("numero")}
                  aria-describedby="numero-err"
                  className={`${inputClass("numero")} font-mono`}
                />
                <p id="numero-err" role="alert" className="mt-1 min-h-4 text-xs text-red-600">
                  {showError("numero") ?? (
                    <span className="text-slate-500">
                      Soporta Visa y Mastercard. (Prueba 4242 o 0002 al final)
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiracion" className="mb-1.5 block text-sm font-medium text-slate-800">
                    Fecha de expiración
                  </label>
                  <input
                    id="expiracion"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={values.expiracion}
                    onChange={(e) => setField("expiracion", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, expiracion: true }))}
                    aria-invalid={!!showError("expiracion")}
                    aria-describedby="expiracion-err"
                    className={`${inputClass("expiracion")} font-mono`}
                  />
                  <p id="expiracion-err" role="alert" className="mt-1 min-h-4 text-xs text-red-600">
                    {showError("expiracion")}
                  </p>
                </div>
                <div>
                  <label htmlFor="cvv" className="mb-1.5 block text-sm font-medium text-slate-800">
                    CVV / CVC
                  </label>
                  <input
                    id="cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={values.cvv}
                    onChange={(e) => setField("cvv", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, cvv: true }))}
                    aria-invalid={!!showError("cvv")}
                    aria-describedby="cvv-err"
                    className={`${inputClass("cvv")} font-mono`}
                  />
                  <p id="cvv-err" role="alert" className="mt-1 min-h-4 text-xs text-red-600">
                    {showError("cvv")}
                  </p>
                </div>
              </div>
            </fieldset>

            {result && (
              <div
                role="status"
                className={`rounded-lg border px-4 py-3 text-sm ${
                  result.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {result.message}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">Transacción segura simulada (PCI-DSS compliant)</p>
              <button
                type="submit"
                disabled={loading || !isValid || result?.ok === true}
                className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Procesando...
                  </>
                ) : (
                  `Pagar $${COBRO.monto.toFixed(2)} Ahora`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}