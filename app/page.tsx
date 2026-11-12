import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="font-heading text-4xl font-semibold">Hello world</h1>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
