"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pen } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { DatePicker } from "@/components/layout/DatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tryCatch } from "@/lib/tryCatch";
import {
  type MotorcycleArrivalSchema,
  motorcycleArrivalSchema,
} from "@/validators/motorcycleArrivalSchema";
import { EditMotorcycle, GetMotorcycleByChassis } from "../actions";

export function EditMotorcycleArrivalDialog({ chassis }: { chassis: string }) {
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingMotorcycle, setLoadingMotorcycle] = useState(false);

  const form = useForm<MotorcycleArrivalSchema>({
    resolver: zodResolver(
      motorcycleArrivalSchema,
    ) as Resolver<MotorcycleArrivalSchema>,
    defaultValues: { chassis: "", model: "", arrivalDate: new Date() },
  });

  async function handleOpenDialog() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setLoadingMotorcycle(true);

    const { data, error } = await tryCatch(GetMotorcycleByChassis(chassis));

    setLoadingMotorcycle(false);

    if (error || data?.status !== "success") {
      return;
    }

    form.reset({
      chassis: data.data.chassis,
      model: data.data.model,
      arrivalDate: new Date(data.data.arrivalDate),
    });

    setIsOpen(true);
  }

  function onSubmit(values: MotorcycleArrivalSchema) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        EditMotorcycle(chassis, values),
      );

      if (error) {
        return;
      }

      if (result.status === "success") {
        form.reset();
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        size="icon"
        className="cursor-pointer"
        variant="ghost"
        onClick={handleOpenDialog}
      >
        <Pen />
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chegada de Moto</DialogTitle>
            <DialogDescription>
              Edite os dados da moto que chegou na concessionaria
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="chassis">Chassi</Label>
                <Input
                  id="chassis"
                  placeholder="Numero do chassi"
                  {...form.register("chassis")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: Honda CG 160 Titan"
                  {...form.register("model")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="arrivalDate">Data de Chegada</Label>

                <Controller
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={handleOpenDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="cursor-pointer"
              >
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
