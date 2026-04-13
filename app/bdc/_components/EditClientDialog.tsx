"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";
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
import { RegistrationStatus } from "@/generated/prisma/enums";
import { updateClient } from "../actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: BdcClientTableRow;
};

function mapPlateStatusToRegistration(label: string): RegistrationStatus {
  switch (label) {
    case "Em emplacamento":
      return RegistrationStatus.IN_PROGRESS;
    case "Emplacado":
      return RegistrationStatus.COMPLETED;
    default:
      return RegistrationStatus.PENDING;
  }
}

function mapRegistrationToPlateStatus(status: string): string {
  switch (status) {
    case RegistrationStatus.IN_PROGRESS:
      return "Em emplacamento";
    case RegistrationStatus.COMPLETED:
      return "Emplacado";
    default:
      return "Pendente";
  }
}

function shouldShowRegistrationDate(status: string): boolean {
  return status === "Em emplacamento" || status === "Emplacado";
}

function getRegistrationDateLabel(status: string): string {
  return status === "Emplacado"
    ? "Data de Emplacamento"
    : "Data de Sa�da para Emplacamento";
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
  const [registrationStatusDate, setRegistrationStatusDate] = useState(
    row.registrationStatusDate
      ? new Date(row.registrationStatusDate).toISOString().split("T")[0]
      : "",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setClientName(row.clientName);
    setSellerName(row.sellerName);
    setCity(row.city);
    setBillingDate(
      row.billingDate
        ? new Date(row.billingDate).toISOString().split("T")[0]
        : "",
    );
    setPlateStatus(mapRegistrationToPlateStatus(row.registrationStatus));
    setRegistrationStatusDate(
      row.registrationStatusDate
        ? new Date(row.registrationStatusDate).toISOString().split("T")[0]
        : "",
    );
    setSubmitError(null);
  }, [row, open]);

  useEffect(() => {
    if (!shouldShowRegistrationDate(plateStatus)) {
      setRegistrationStatusDate("");
    }
  }, [plateStatus]);

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
        registrationStatusDate: shouldShowRegistrationDate(plateStatus)
          ? registrationStatusDate || null
          : null,
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
            Atualize os dados do cliente e a situa��o de emplacamento
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Vendedor</Label>
              <Input
                placeholder="Nome do vendedor"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Modelo</Label>
              <Input
                value={row.model}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Chassi</Label>
              <Input
                value={row.chassis}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Data de Faturamento</Label>
              <Input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Status de Chegada</Label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm">
                <span className="font-medium text-emerald-600">Chegou</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(row.arrivalDate),
                  )}
                </span>
              </div>

              <span className="text-xs text-muted-foreground">
                Atualizado automaticamente pela logística
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Situação de Emplacamento</Label>
              <select
                value={plateStatus}
                onChange={(e) => setPlateStatus(e.target.value)}
                className="h-12 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em emplacamento">Em emplacamento</option>
                <option value="Emplacado">Emplacado</option>
              </select>
            </div>

            {shouldShowRegistrationDate(plateStatus) && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label className="text-sm">
                  {getRegistrationDateLabel(plateStatus)}
                </Label>
                <Input
                  type="date"
                  value={registrationStatusDate}
                  onChange={(e) => setRegistrationStatusDate(e.target.value)}
                  className="h-12"
                />
              </div>
            )}
          </div>

          {submitError && (
            <div className="mt-3 text-sm text-red-500">{submitError}</div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              size="lg"
              className="cursor-pointer px-6"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              size="lg"
              className="cursor-pointer min-w-40 px-6"
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
