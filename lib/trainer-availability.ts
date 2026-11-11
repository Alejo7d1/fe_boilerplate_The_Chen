export type TrainerSlot = {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

// Debe coincidir con la zona horaria que usa el backend para decidir qué es "pasado".
export const GYM_TIME_ZONE = "America/El_Salvador";

function endpoint() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("Falta la variable de entorno API_URL.");
  }
  return new URL("trainer-availability", apiUrl.replace(/\/?$/, "/"));
}

export async function fetchMySlots(token: string) {
  const res = await fetch(endpoint(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return { status: res.status, slots: [] as TrainerSlot[] };
  return { status: res.status, slots: (await res.json()) as TrainerSlot[] };
}

export async function postSlot(
  token: string,
  body: { date: string; startTime: string },
) {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  // Nest responde { message: string | string[] } en los errores.
  let message: string | undefined;
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const raw = data?.message;
    message = Array.isArray(raw)
      ? raw.join(" ")
      : typeof raw === "string"
        ? raw
        : undefined;
  }
  return { status: res.status, message };
}