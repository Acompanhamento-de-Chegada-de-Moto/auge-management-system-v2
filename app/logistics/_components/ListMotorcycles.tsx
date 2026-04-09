import Link from "next/link";
import { logisticsGetMotorcycles } from "@/app/data/logistics/logistics-get-motorcycles";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyToClipboard } from "./CopyToClipboard";

interface Props {
  page: number;
}

export async function ListMotorcycle({ page }: Props) {
  const { data, totalPages } = await logisticsGetMotorcycles(page, 10);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Chassi</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Data de Chegada</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((e) => (
              <TableRow key={e.id}>
                <CopyToClipboard chassis={e.chassis} />
                <td>{e.model}</td>
                <td>
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(e.arrivalDate),
                  )}
                </td>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINAÇÃO */}
        <div className="flex justify-center gap-2 p-4">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-3 py-1 border rounded"
            >
              ← Anterior
            </Link>
          )}

          <span className="px-3 py-1 text-sm">
            Página {page} de {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-3 py-1 border rounded"
            >
              Próxima →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
