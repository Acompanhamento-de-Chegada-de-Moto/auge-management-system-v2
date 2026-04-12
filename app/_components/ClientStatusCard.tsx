import { Calendar, FileText, MapPin, User, Truck, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/app/bdc/_components/StatusBadge";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";
import { RegistrationStatus } from "@/generated/prisma/enums";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

export function ClientStatusCard({ row }: { row: BdcClientTableRow }) {
  const arrivalDateFormatted = row.arrivalDate ? dateFormatter.format(row.arrivalDate) : "—";
  const billingDateFormatted = row.billingDate ? dateFormatter.format(row.billingDate) : "—";

  function getStatusLabel(status: RegistrationStatus) {
    switch (status) {
      case RegistrationStatus.IN_PROGRESS:
        return "Em Emplacamento";
      case RegistrationStatus.COMPLETED:
        return "Concluído";
      default:
        return "Pendente";
    }
  }

  function getStatusVariant(status: RegistrationStatus) {
    switch (status) {
      case RegistrationStatus.IN_PROGRESS:
        return "warning";
      case RegistrationStatus.COMPLETED:
        return "success";
      default:
        return "neutral";
    }
  }

  return (
    <Card className="w-full max-w-4xl overflow-hidden border border-zinc-200 shadow-sm">
      <CardContent className="p-0 flex flex-col md:flex-row">
        {/* Main Info Section */}
        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">{row.clientName}</h3>
              <p className="text-sm text-zinc-500">{row.model}</p>
            </div>
            <StatusBadge variant={getStatusVariant(row.registrationStatus)}>
              {getStatusLabel(row.registrationStatus)}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <User className="h-4 w-4 text-zinc-400" />
              <span className="font-medium">Vendedor:</span>
              <span>{row.sellerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <span className="font-medium">Cidade:</span>
              <span>{row.city}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <FileText className="h-4 w-4 text-zinc-400" />
              <span className="font-medium">Chassi:</span>
              <span className="font-mono text-xs">{row.chassis}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span className="font-medium">Faturamento:</span>
              <span>{billingDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Gray Side Section */}
        <div className="w-full md:w-64 bg-zinc-50/80 border-l border-zinc-100 p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600">Chegada:</span>
              <StatusBadge variant="success">Chegou</StatusBadge>
            </div>
            <p className="text-xs text-zinc-500 pl-6">
              Chegou em {arrivalDateFormatted}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600">Situacao:</span>
              <StatusBadge variant={getStatusVariant(row.registrationStatus)}>
                {getStatusLabel(row.registrationStatus)}
              </StatusBadge>
            </div>
            {/* Note: Logic for "Saiu para emplacamento em" would go here if we had the date */}
            <p className="text-xs text-zinc-500 pl-6">
              Status atualizado recentemente
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
