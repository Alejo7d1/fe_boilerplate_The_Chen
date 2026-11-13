// lib/types/auth.ts
export type UserRole = "MIEMBRO" | "ENTRENADOR" | "RECEPCION_ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    nombre: string;
    apellido: string;
  };
}

export interface LoginState {
  error?: string;
  email?: string;
}