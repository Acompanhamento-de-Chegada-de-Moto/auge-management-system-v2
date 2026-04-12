"use client";

import { Loader2, Plus, Search } from "lucide-react";
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
import { createClient, getMotorcycleByChassis } from "../actions";

type MotorcyclePreview = {
  id: string;
  chassis: string;
  model: string;
  arrivalDate: Date | string;
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

export function CreateClientForm() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMotorcycle, setIsLoadingMotorcycle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [city, setCity] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [plateStatus, setPlateStatus] = useState("Pendente");
  const [chassis, setChassis] = useState("");
  const [motorcycle, setMotorcycle] = useState<MotorcyclePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

          {/* Step 1 */}
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

            {/* Feedback */}
            {motorcycle && (
              <div className="mt-3 text-sm text-green-600">
                Moto encontrada: <strong>{motorcycle.model}</strong>
              </div>
            )}

            {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
          </div>

          {/* Step 2 (exemplo simples preenchido) */}
          {motorcycle && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium mb-3">
                2. Preencher dados do cliente
              </p>

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
                    value={motorcycle.model}
                    disabled
                    className="bg-muted font-mono"
                  />
                </div>

                {/* Chassi */}
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

                {/* Data de Faturamento */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">Data de Faturamento</Label>
                  <Input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                  />
                </div>

                {/* Status de Chegada */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">Status de Chegada</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted text-sm">
                    {motorcycle.arrivalDate ? (
                      <>
                        <span className="text-emerald-600 font-medium">
                          Chegou
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
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
