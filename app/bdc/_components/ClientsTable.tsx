import { bdcGetClientRows } from "@/app/data/bdc/bdc-get-client-rows";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { ClientRowActions } from "./ClientRowActions";
import { StatusBadge } from "./StatusBadge";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function registrationBadge(status: RegistrationStatus) {
  switch (status) {
    case RegistrationStatus.IN_PROGRESS:
      return <StatusBadge variant="warning">Em emplacamento</StatusBadge>;
    case RegistrationStatus.COMPLETED:
      return <StatusBadge variant="success">Concluído</StatusBadge>;
    default:
      return <StatusBadge variant="neutral">Pendente</StatusBadge>;
  }
}

function hasArrived(arrivalDate: Date) {
  const today = new Date();

  const arrival = new Date(arrivalDate);
  arrival.setHours(0, 0, 0, 0);

  today.setHours(0, 0, 0, 0);

  return arrival <= today;
}

export async function ClientsTable() {
  const rows = await bdcGetClientRows();

  return (
    <Card className="rounded-lg border border-border shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">
                Cliente
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Vendedor
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Cidade
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Modelo
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Chassi
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Faturamento
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Chegada
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Data chegada
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Situação
              </TableHead>
              <TableHead className="w-25 text-right font-semibold text-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum cliente vinculado ainda. Use &quot;Novo cliente&quot;
                  para cadastrar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                return (
                  <TableRow key={row.motorcycleId} className="bg-background">
                    <TableCell className="font-medium text-foreground">
                      {row.clientName}
                    </TableCell>
                    <TableCell>{row.sellerName}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell>{row.model}</TableCell>
                    <TableCell
                      className="max-w-50 truncate font-mono text-xs"
                      title={row.chassis}
                    >
                      {row.chassis}
                    </TableCell>
                    <TableCell>
                      {row.billingDate
                        ? dateFormatter.format(row.billingDate)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {hasArrived(row.arrivalDate) ? (
                        <StatusBadge variant="success">Chegou</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">Aguardando</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.arrivalDate
                        ? dateFormatter.format(row.arrivalDate)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {registrationBadge(row.registrationStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ClientRowActions row={row} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
