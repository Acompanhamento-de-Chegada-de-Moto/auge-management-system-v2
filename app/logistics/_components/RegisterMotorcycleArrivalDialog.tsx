"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";

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
import { RegisterMotorcycleArrival } from "../actions";

export function RegisterMotorcycleArrivalDialog() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  function handleOpenDialog() {
    setIsOpen((prev) => !prev);
  }

  const form = useForm<MotorcycleArrivalSchema>({
    resolver: zodResolver(
      motorcycleArrivalSchema,
    ) as Resolver<MotorcycleArrivalSchema>,
  });

  function onSubmit(values: MotorcycleArrivalSchema) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        RegisterMotorcycleArrival(values),
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
      <Button size="sm" className="cursor-pointer" onClick={handleOpenDialog}>
        <Plus className="size-4 mr-2" />
        Registrar Chegada
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Chegada de Moto</DialogTitle>
            <DialogDescription>
              Informe os dados da moto que chegou na concessionaria
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
                <Input
                  id="arrivalDate"
                  type="date"
                  {...form.register("arrivalDate")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenDialog}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={pending}
                className="cursor-pointer"
              >
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
