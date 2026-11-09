This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Backend externo

La aplicación consume una API externa configurada con `API_URL`. No incluye datos ni respuestas simbólicas: sin un backend disponible, el inicio de sesión y el inventario muestran el error correspondiente.

| Método | Endpoint | Respuestas esperadas |
| --- | --- | --- |
| `POST` | `/auth/login` | `200` con el token (`token`, `accessToken` o `access_token`), `400`, `401` |
| `GET` | `/api/equipment` | `200` con las máquinas, `401`, `403` |
| `PATCH` | `/api/equipment/:id/status` | `200`, `400`, `401`, `403`, `404` |

Cada máquina se espera como `{ id, name, status, reason, updatedAt }`, con `status` en `OPERATIVA`, `EN_MANTENIMIENTO` o `FUERA_DE_SERVICIO`. Los errores se leen de `message`, `error` o `detail`.

La pantalla de administración de máquinas vive en [`/equipment/admin`](app/equipment/admin/page.tsx).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
