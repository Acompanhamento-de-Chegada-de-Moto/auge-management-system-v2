"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/lib/tryCatch";
import { DeleteMotorcycle } from "../actions";

type ActionTypes = "delete" | "edit";

export function TableActions({ chassis }: { chassis: string }) {
  async function handleDeleteMotorcycle(chassis: string) {
    await tryCatch(DeleteMotorcycle(chassis));
  }

  return (
    <div className="flex gap-x-3 justify-end">
      <Button
        className="cursor-pointer"
        size="icon"
        variant="ghost"
        onClick={() => handleDeleteMotorcycle(chassis)}
      >
        <Trash2 className="text-red-500" />
      </Button>
    </div>
  );
}
