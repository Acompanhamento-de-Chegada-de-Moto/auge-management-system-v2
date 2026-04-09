"use client";

import { useState } from "react";
import { TableCell } from "@/components/ui/table";

interface IAppProps {
  chassis: string;
}

export function CopyToClipboard({ chassis }: IAppProps) {
  const [copiedChassis, setCopiedChassis] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(chassis);
    setCopiedChassis(chassis);
  }

  const isCopied = copiedChassis === chassis;

  return (
    <TableCell>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={copyToClipboard}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="font-mono text-xs cursor-pointer hover:underline"
        >
          {chassis}
        </button>

        {hovered && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded shadow whitespace-nowrap">
            {isCopied ? "Copiado" : "Clique para copiar"}
          </div>
        )}
      </div>
    </TableCell>
  );
}
