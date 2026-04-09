"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseExcelFile } from "@/lib/upload-file";
import type { MotorcycleArrivalSchema } from "@/validators/motorcycleArrivalSchema";
import { importMotorcycles } from "../../actions";

export function Uploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    fileInputRef.current?.click();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const result = await parseExcelFile(file);

      if (!result.success) {
        alert(result.error);
        return;
      }

      const response = await importMotorcycles(result.data!);

      if (response.status === "error") {
        alert(response.message);
        return;
      }

      alert(response.message);
    } catch (error) {
      console.error(error);
      alert("Unexpected error.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />

      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        onClick={handleClick}
      >
        {loading ? (
          <Loader2 className="size-4 mr-2 animate-spin" />
        ) : (
          <Upload className="size-4 mr-2" />
        )}
        {loading ? "Importando..." : "Importar Excel"}
      </Button>
    </>
  );
}
