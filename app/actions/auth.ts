// app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import type { LoginRequest, LoginResponse, LoginState } from "@/lib/types/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña.", email };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Ingresa un correo válido.", email };
  }

  try {
    const data = await apiFetch<LoginResponse>("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password } satisfies LoginRequest),
      requireAuth: false,
    });

    const token = data.token ?? data.accessToken;
    if (!token) {
      throw new Error("La respuesta de auth/login no incluye un token.");
    }

    await createSession(token);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { error: "Correo o contraseña incorrectos.", email };
    }
    console.error("Error al iniciar sesión:", error);
    return { error: "No se pudo iniciar sesión. Intenta más tarde.", email };
  }

  // Nota: redirect() siempre va fuera del try/catch porque lanza un error interno de Next.js
  redirect("/");
}


export async function logout() {
  await deleteSession();
  redirect("/login");
}