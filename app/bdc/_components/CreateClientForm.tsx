"use client";

import {
  CheckCircle2,
  Loader2,
  LogOut,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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

export function CreateClientForm() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMotorcycle, setIsLoadingMotorcycle] = useState(false);

  return (
    <>
      <Button
        size="sm"
        className="cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="size-4 mr-1" /> Novo Cliente
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={() => setDialogOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Consulte o chassi para vincular a moto ao cliente
            </DialogDescription>
          </DialogHeader>
          {/* Step 1: Chassis search */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3">
              1. Consultar chassi na logística
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Digite o número do chassi"
                className="font-mono"
                maxLength={17}
              />

              <Button variant="secondary" className="w-32 cursor-pointer">
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
          </div>

          {/* Step 2: Fill form after query chassis motorcycle */}
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              2. Preencher dados do cliente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Cliente</Label>
                <Input id="name" placeholder="Nome do cliente" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="seller_name">Vendedor</Label>
                <Input id="seller_name" placeholder="Nome do vendedor" />
              </div>
              <div className="flex flex-col gap-2">
                <Input id="city" placeholder="Cidade" />
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  id="model"
                  placeholder="Ex: Honda CG 160 Titan"
                  disabled
                  className="bg-muted font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="chassis">Chassi</Label>
                <Input id="chassis" disabled className="bg-muted font-mono" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="billing_date">Data de Faturamento</Label>
                <Input id="billing_date" type="date" />
              </div>

              {/* Status de Chegada - somente leitura, derivado automaticamente */}
              <div className="flex flex-col gap-2">
                <Label>Status de Chegada</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted">
                  {1 + 1 === 2 ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Chegou
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        date
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Aguardando
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Situação de Emplacamento</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6"></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
