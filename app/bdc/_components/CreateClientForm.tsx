"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
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
import { createClient, getMotorcycleByChassis } from "../actions";

type MotorcyclePreview = {
  id: string;
  chassis: string;
  model: string;
  arrivalDate: Date | string;
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

function shouldShowRegistrationDate(status: string): boolean {
  return status === "Em emplacamento" || status === "Emplacado";
}

function getRegistrationDateLabel(status: string): string {
  return status === "Emplacado"
    ? "Data de Emplacamento"
    : "Data de Saída para Emplacamento";
}

export function CreateClientForm() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMotorcycle, setIsLoadingMotorcycle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [city, setCity] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [plateStatus, setPlateStatus] = useState("Pendente");
  const [registrationStatusDate, setRegistrationStatusDate] = useState("");
  const [chassis, setChassis] = useState("");
  const [motorcycle, setMotorcycle] = useState<MotorcyclePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldShowRegistrationDate(plateStatus)) {
      setRegistrationStatusDate("");
    }
  }, [plateStatus]);

  async function handleSearch() {
    if (!chassis) return;

    setIsLoadingMotorcycle(true);
    setError(null);
    setMotorcycle(null);

    try {
      const result = await getMotorcycleByChassis(chassis);

      if (result.status !== "success") {
        setError(result.message);
      } else if (result.data) {
        setMotorcycle(result.data);
      } else {
        setError("Moto não encontrada");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar moto");
    } finally {
      setIsLoadingMotorcycle(false);
    }
  }

  function resetForm() {
    setChassis("");
    setMotorcycle(null);
    setClientName("");
    setSellerName("");
    setCity("");
    setBillingDate("");
    setPlateStatus("Pendente");
    setRegistrationStatusDate("");
    setError(null);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!motorcycle) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await createClient({
        name: clientName,
        sellerName,
        city,
        billingDate: billingDate || null,
        motorcycleId: motorcycle.id,
        registrationStatus: mapPlateStatusToRegistration(plateStatus),
        registrationStatusDate: shouldShowRegistrationDate(plateStatus)
          ? registrationStatusDate || null
          : null,
      });

      if (result.status !== "success") {
        setSubmitError(result.message);
        return;
      }

      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setSubmitError("Erro ao salvar cliente");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="size-4 mr-1" /> Novo Cliente
      </Button>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Consulte o chassi para vincular a moto ao cliente
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3">
              1. Consultar chassi na logística
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Digite o número do chassi"
                className="font-mono"
                maxLength={17}
                value={chassis}
                onChange={(e) => setChassis(e.target.value)}
              />

              <Button
                variant="secondary"
                className="w-32 cursor-pointer"
                onClick={handleSearch}
                disabled={isLoadingMotorcycle}
              >
                {isLoadingMotorcycle ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Buscando
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Search className="size-4" />
                    Buscar
                  </span>
                )}
              </Button>
            </div>

            {motorcycle && (
              <div className="mt-3 text-sm text-green-600">
                Moto encontrada: <strong>{motorcycle.model}</strong>
              </div>
            )}

            {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
          </div>

          {motorcycle && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium mb-3">
                2. Preencher dados do cliente
              </p>

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
                    value={motorcycle.model}
                    disabled
                    className="bg-muted font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm">Chassi</Label>
                  <Input
                    value={motorcycle.chassis}
                    disabled
                    className="bg-muted font-mono"
                  />
                  <span className="text-xs text-muted-foreground">
                    Definido pela busca acima
                  </span>
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
                    {motorcycle.arrivalDate ? (
                      <>
                        <span className="font-medium text-emerald-600">
                          Chegou
                        </span>
                        <span className="ml-auto text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat("pt-BR").format(
                            new Date(motorcycle.arrivalDate),
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Aguardando</span>
                    )}
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
                      onChange={(e) =>
                        setRegistrationStatusDate(e.target.value)
                      }
                      className="h-12"
                    />
                    <DatePicker />
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
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
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
                    "Salvar cliente"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
