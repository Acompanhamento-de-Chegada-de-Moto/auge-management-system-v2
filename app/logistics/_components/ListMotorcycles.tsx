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
import { CopyToClipboard } from "./CopyToClipboard";
import { LogisticsClientWrapper } from "./LogisticsClientWrapper";

interface Props {
  page: number;
  pageSize: number;
}

export async function ListMotorcycle({ page, pageSize }: Props) {
  const { data, totalPages } = await logisticsGetMotorcycles(page, pageSize);

  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-0">
        <LogisticsClientWrapper
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                <TableHead className="w-[280px] font-semibold">
                  Chassi
                </TableHead>
                <TableHead className="font-semibold">Modelo</TableHead>
                <TableHead className="text-right font-semibold">
                  Data de Chegada
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground font-medium"
                  >
                    Nenhuma moto cadastrada nesta página.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                    <CopyToClipboard chassis={e.chassis} />
                    <TableCell className="font-medium align-middle">{e.model}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm align-middle">
                      {new Intl.DateTimeFormat("pt-BR").format(
                        new Date(e.arrivalDate),
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </LogisticsClientWrapper>
      </CardContent>
    </Card>
  );
}
