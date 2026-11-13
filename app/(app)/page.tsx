import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionData } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSessionData();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Panel</h1>
        <p className="text-muted-foreground text-sm">
          Bienvenido a The Chen. Usa el menú lateral para acceder a los módulos
          del sprint.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sesión actual</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
            <span>Correo: {session?.email ?? "No disponible en el token"}</span>
            <span>Rol: {session?.role ?? "No disponible en el token"}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Módulos del sprint</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Las secciones marcadas como «Pronto» en el menú se habilitan cuando
            se implementa su historia en la fase correspondiente.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
