"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { unlinkClientMotorcycle } from "../actions";
import { EditClientDialog } from "./EditClientDialog";

type Props = {
  row: BdcClientTableRow;
};

export function ClientRowActions({ row }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmRemove() {
    setError(null);
    setPending(true);

    try {
      const result = await unlinkClientMotorcycle(row.motorcycleId);

      if (result.status !== "success") {
        setError(result.message);
        return;
      }

      setConfirmOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground cursor-pointer"
          title="Editar cliente"
          aria-label="Editar cliente"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          title="Remover vínculo"
          aria-label="Remover vínculo"
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <EditClientDialog open={editOpen} onOpenChange={setEditOpen} row={row} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover vínculo</DialogTitle>
            <DialogDescription>
              O cliente <strong>{row.clientName}</strong> será desvinculado
              desta moto. Se não houver outras motos no mesmo cliente, o
              cadastro do cliente será excluído.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleConfirmRemove}
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Removendo
                </span>
              ) : (
                "Remover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
