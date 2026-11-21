"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

import { login } from "@/app/actions/auth";
import type { LoginState } from "@/lib/types/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  function handleCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>No pudimos iniciar tu sesión</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            placeholder="tu@correo.com"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Tu contraseña"
              onKeyDown={handleCapsLock}
              onKeyUp={handleCapsLock}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {capsLockOn ? (
            <FieldDescription>
              La tecla Bloq Mayús está activada.
            </FieldDescription>
          ) : null}
        </Field>

        <Field orientation="horizontal">
          <Checkbox id="remember" name="remember" defaultChecked />
          <FieldLabel htmlFor="remember" className="font-normal">
            Mantener la sesión iniciada
          </FieldLabel>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner aria-label="Iniciando sesión" />
            Ingresando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  );
}
