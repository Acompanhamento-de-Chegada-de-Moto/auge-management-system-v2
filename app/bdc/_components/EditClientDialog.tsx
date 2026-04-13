"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClient } from "../actions";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: BdcClientTableRow;
};

function mapPlateStatusToRegistration(label: string): RegistrationStatus {
  switch (label) {
    case "Em andamento":
      return RegistrationStatus.IN_PROGRESS;
    case "Concluído":
      return RegistrationStatus.COMPLETED;
    default:
      return RegistrationStatus.PENDING;
  }
}

function mapRegistrationToPlateStatus(status: string): string {
  switch (status) {
    case RegistrationStatus.IN_PROGRESS:
      return "Em andamento";
    case RegistrationStatus.COMPLETED:
      return "Concluído";
    default:
      return "Pendente";
  }
}

export function EditClientDialog({ open, onOpenChange, row }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState(row.clientName);
  const [sellerName, setSellerName] = useState(row.sellerName);
  const [city, setCity] = useState(row.city);
  const [billingDate, setBillingDate] = useState(
    row.billingDate
      ? new Date(row.billingDate).toISOString().split("T")[0]
      : "",
  );
  const [plateStatus, setPlateStatus] = useState(
    mapRegistrationToPlateStatus(row.registrationStatus),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await updateClient({
        clientId: row.clientId,
        name: clientName,
        sellerName,
        city,
        billingDate: billingDate || null,
        motorcycleId: row.motorcycleId,
        registrationStatus: mapPlateStatusToRegistration(plateStatus),
      });

      if (result.status !== "success") {
        setSubmitError(result.message);
        return;
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setSubmitError("Erro ao atualizar cliente");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize os dados do cliente e a situação de emplacamento
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {/* Vendedor */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Vendedor</Label>
              <Input
                placeholder="Nome do vendedor"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>

            {/* Cidade */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Modelo */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Modelo</Label>
              <Input
                value={row.model}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            {/* Chassi */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Chassi</Label>
              <Input
                value={row.chassis}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            {/* Data de Faturamento */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Data de Faturamento</Label>
              <Input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>

            {/* Situação de Emplacamento */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Situação de Emplacamento</Label>
              <select
                value={plateStatus}
                onChange={(e) => setPlateStatus(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>

          {submitError && (
            <div className="mt-3 text-sm text-red-500">{submitError}</div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              className="cursor-pointer min-w-36"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Salvando
                </span>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
