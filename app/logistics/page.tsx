import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { ListMotorcycle } from "./_components/ListMotorcycles";
import { RegisterMotorcycleArrivalDialog } from "./_components/RegisterMotorcycleArrivalDialog";

export default async function LogisticsRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/logistics/login");
  }

  if (session.user.role !== "LOGISTICS") {
    return redirect("/bdc");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Painel Logística</h2>
          <p className="text-sm text-muted-foreground">
            Registre a chegada de motos e importe planilhas Excel
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RegisterMotorcycleArrivalDialog />

          <Button variant="outline" size="sm" className="cursor-pointer">
            {false ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Upload className="size-4 mr-2" />
            )}
            {false ? "Importando..." : "Importar Excel"}
          </Button>

          <input type="file" accept=".xlsx,.xls" className="hidden" />

          <LogoutButton />
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-3">
          <FileSpreadsheet className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Formato da planilha para importação
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A planilha deve conter as colunas: <strong>chassi</strong>,{" "}
              <strong>modelo</strong> e <strong>dataChegada</strong>. Formatos
              de data aceitos: dd/mm/aaaa ou aaaa-mm-dd.
            </p>
          </div>
        </CardContent>
      </Card>

      <ListMotorcycle />
    </div>
  );
}
