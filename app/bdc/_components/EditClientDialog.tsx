"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";
import { DatePicker } from "@/components/layout/DatePicker";
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
import { notify } from "@/lib/notify";
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
    : "Data de Saída para Emplacamento";
}

function getArrivalStatusLabel(date: Date | undefined): {
  text: string;
  color: string;
} {
  if (!date) return { text: "Não definida", color: "text-muted-foreground" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const arrival = new Date(date);
  arrival.setHours(0, 0, 0, 0);

  if (arrival <= today) {
    return { text: "Chegou", color: "text-emerald-600" };
  }

  return { text: "Não chegou", color: "text-amber-600" };
}

export function EditClientDialog({ open, onOpenChange, row }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientName, setClientName] = useState(row.clientName);
  const [sellerName, setSellerName] = useState(row.sellerName);
  const [city, setCity] = useState(row.city);

  const [billingDate, setBillingDate] = useState<Date | undefined>(
    row.billingDate ? new Date(row.billingDate) : undefined,
  );

  const [plateStatus, setPlateStatus] = useState(
    mapRegistrationToPlateStatus(row.registrationStatus),
  );

  const [registrationStatusDate, setRegistrationStatusDate] = useState<
    Date | undefined
  >(
    row.registrationStatusDate
      ? new Date(row.registrationStatusDate)
      : undefined,
  );

  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    row.arrivalDate ? new Date(row.arrivalDate) : undefined,
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setClientName(row.clientName);
    setSellerName(row.sellerName);
    setCity(row.city);

    setBillingDate(row.billingDate ? new Date(row.billingDate) : undefined);

    setPlateStatus(mapRegistrationToPlateStatus(row.registrationStatus));

    setRegistrationStatusDate(
      row.registrationStatusDate
        ? new Date(row.registrationStatusDate)
        : undefined,
    );

    setArrivalDate(row.arrivalDate ? new Date(row.arrivalDate) : undefined);

    setSubmitError(null);
  }, [row]);

  useEffect(() => {
    if (!shouldShowRegistrationDate(plateStatus)) {
      setRegistrationStatusDate(undefined);
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
        motorcycleId: row.motorcycleId,

        billingDate: billingDate
          ? billingDate.toISOString().split("T")[0]
          : null,

        registrationStatus: mapPlateStatusToRegistration(plateStatus),

        registrationStatusDate: shouldShowRegistrationDate(plateStatus)
          ? registrationStatusDate
            ? registrationStatusDate.toISOString().split("T")[0]
            : null
          : null,
        arrivalDate: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : null,
      });

      if (result.status !== "success") {
        notify.error(result.message || "Erro ao atualizar cliente");
        return;
      }

      notify.success("Cliente atualizado com sucesso.");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      notify.error("Erro ao atualizar cliente");
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Cliente</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Vendedor</Label>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Modelo</Label>
              <Input value={row.model} disabled className="bg-muted" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Chassi</Label>
              <Input value={row.chassis} disabled className="bg-muted" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data de Faturamento</Label>
              <DatePicker value={billingDate} onChange={setBillingDate} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data de Chegada</Label>
              <DatePicker value={arrivalDate} onChange={setArrivalDate} />
              {(() => {
                const { text, color } = getArrivalStatusLabel(arrivalDate);
                return (
                  <span className={`text-xs font-medium ${color}`}>
                    {text}
                  </span>
                );
              })()}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Situação de Emplacamento</Label>
              <select
                value={plateStatus}
                onChange={(e) => setPlateStatus(e.target.value)}
                className="h-12 rounded-lg border px-3 cursor-pointer"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em emplacamento">Em emplacamento</option>
                <option value="Emplacado">Emplacado</option>
              </select>
            </div>

            {shouldShowRegistrationDate(plateStatus) && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{getRegistrationDateLabel(plateStatus)}</Label>

                <DatePicker
                  value={registrationStatusDate}
                  onChange={setRegistrationStatusDate}
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
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
