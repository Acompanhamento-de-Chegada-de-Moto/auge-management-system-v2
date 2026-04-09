import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROW_KEYS = ["r0", "r1", "r2", "r3", "r4", "r5"] as const;
const SKELETON_COL_KEYS = [
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
] as const;

export function ClientsTableSkeleton() {
  return (
    <Card className="rounded-lg border border-border shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {[
                "Cliente",
                "Vendedor",
                "Cidade",
                "Modelo",
                "Chassi",
                "Faturamento",
                "Chegada",
                "Data chegada",
                "Situação",
                "Ações",
              ].map((label) => (
                <TableHead key={label} className="font-semibold">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {SKELETON_ROW_KEYS.map((rowKey) => (
              <TableRow key={rowKey}>
                {SKELETON_COL_KEYS.map((colKey) => (
                  <TableCell key={`${rowKey}-${colKey}`}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
