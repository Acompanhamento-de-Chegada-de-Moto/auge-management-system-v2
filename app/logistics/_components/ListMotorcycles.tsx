import { logisticsGetMotorcycles } from "@/app/data/logistics/logistics-get-motorcycles";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function ListMotorcycle() {
  const data = await logisticsGetMotorcycles();

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
            {data?.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <span className="font-mono text-xs">{e.chassis}</span>
                </TableCell>
                <TableCell>{e.model}</TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(e.arrivalDate),
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
