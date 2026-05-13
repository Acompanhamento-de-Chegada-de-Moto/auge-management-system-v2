"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
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

import { notify } from "@/lib/notify";
import { tryCatch } from "@/lib/tryCatch";
import { type ClientSchema, clientSchema } from "@/validators/clientSchema";
import { createClient, FetchMotorcycleByChassis } from "../actions";
import { RegistrationStatus } from "@/generated/prisma/enums";

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

function mapRegistrationToPlateStatus(status: RegistrationStatus): string {
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

export function CreateClientDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryChassis, setQueryChassis] = useState("");
  const [motorcycle, setMotorcycle] = useState<MotorcyclePreview | null>(null);

  const form = useForm<ClientSchema>({
    resolver: zodResolver(clientSchema) as Resolver<ClientSchema>,
    defaultValues: {
      registrationStatus: RegistrationStatus.PENDING,
    },
  });

  const arrivalDate = form.watch("arrivalDate");
  const plateStatus = mapRegistrationToPlateStatus(
    form.watch("registrationStatus") ?? RegistrationStatus.PENDING,
  );

  useEffect(() => {
    if (!shouldShowRegistrationDate(plateStatus)) {
      form.setValue("registrationStatusDate", null, { shouldValidate: false });
    }
  }, [plateStatus, form]);

  function handleQueryMotorcycleByChassis() {
    if (!queryChassis) return;

    setMotorcycle(null);

    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        FetchMotorcycleByChassis(queryChassis),
      );

      if (error) {
        notify.error("Erro ao buscar moto. Tente novamente.");
        return;
      }

      if (result.status === "error") {
        notify.warning(result?.message);
        return;
      }

      if (result.status === "success" && result.data) {
        setMotorcycle(result.data);
        form.setValue("model", result.data.model, { shouldValidate: true });
        form.setValue("chassis", result.data.chassis, { shouldValidate: true });
        form.setValue("arrivalDate", new Date(result.data.arrivalDate));
        return;
      }
    });
  }

  function handleOpenDialog(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setMotorcycle(null);
      setQueryChassis("");
      form.reset();
    }
  }

  async function handleCreateClient(values: ClientSchema) {
    if (!motorcycle) {
      notify.error("Moto não selecionada.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createClient({
        name: values.client,
        sellerName: values.sellersName,
        city: values.city,
        billingDate: values.billingDate
          ? values.billingDate.toISOString().split("T")[0]
          : null,
        motorcycleId: motorcycle.id,
        registrationStatus:
          values.registrationStatus ?? RegistrationStatus.PENDING,
        registrationStatusDate: shouldShowRegistrationDate(plateStatus)
          ? values.registrationStatusDate
            ? values.registrationStatusDate.toISOString().split("T")[0]
            : null
          : null,
        arrivalDate: values.arrivalDate
          ? values.arrivalDate.toISOString().split("T")[0]
          : null,
      });

      if (result.status !== "success") {
        notify.error(result.message || "Erro ao salvar cliente.");
        return;
      }

      notify.success("Cliente criado com sucesso.");
      setIsOpen(false);
      setMotorcycle(null);
      setQueryChassis("");
      form.reset();
    } catch (err) {
      console.error(err);
      notify.error("Erro ao salvar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="cursor-pointer"
        onClick={() => handleOpenDialog(true)}
      >
        <Plus className="size-4 mr-1" /> Novo Cliente
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenDialog}>
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
                value={queryChassis}
                onChange={({ target }) => setQueryChassis(target.value)}
                placeholder="Digite o número do chassi"
                className="font-mono"
                maxLength={17}
              />

              <Button
                variant="secondary"
                className="w-32 cursor-pointer"
                onClick={handleQueryMotorcycleByChassis}
                disabled={pending}
              >
                {pending ? (
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
              <form
                onSubmit={form.handleSubmit(handleCreateClient)}
                className="rounded-lg border border-border p-4 mt-4"
              >
                <p className="text-sm font-medium mb-3">
                  2. Preencher dados do cliente
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Cliente</Label>
                    <Input
                      placeholder="Nome do cliente"
                      {...form.register("client")}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Vendedor</Label>
                    <Input
                      placeholder="Nome do vendedor"
                      {...form.register("sellersName")}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      {...form.register("city")}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Modelo</Label>
                    <Input
                      {...form.register("model")}
                      value={motorcycle.model}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Chassi</Label>
                    <Input
                      {...form.register("chassis")}
                      value={motorcycle.chassis}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Data de Faturamento</Label>
                    <Controller
                      control={form.control}
                      name="billingDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Data de Chegada</Label>
                    <Controller
                      control={form.control}
                      name="arrivalDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
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
                    <Controller
                      control={form.control}
                      name="registrationStatus"
                      render={({ field }) => (
                        <select
                          value={mapRegistrationToPlateStatus(
                            field.value ?? RegistrationStatus.PENDING,
                          )}
                          onChange={(e) => {
                            const registrationStatus = mapPlateStatusToRegistration(
                              e.target.value,
                            );
                            field.onChange(registrationStatus);
                          }}
                          className="h-12 rounded-lg border px-3 cursor-pointer"
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em emplacamento">
                            Em emplacamento
                          </option>
                          <option value="Emplacado">Emplacado</option>
                        </select>
                      )}
                    />
                  </div>

                  {shouldShowRegistrationDate(plateStatus) && (
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>{getRegistrationDateLabel(plateStatus)}</Label>
                      <Controller
                        control={form.control}
                        name="registrationStatusDate"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ?? undefined}
                            onChange={(date) =>
                              field.onChange(date ?? null)
                            }
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-700">
                      Corrija os seguintes erros:
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-red-600">
                      {Object.entries(form.formState.errors).map(
                        ([key, error]) => (
                          <li key={key}>
                            {error?.message || `Erro em ${key}`}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenDialog(false)}
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Salvando
                      </span>
                    ) : (
                      "Salvar cliente"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
