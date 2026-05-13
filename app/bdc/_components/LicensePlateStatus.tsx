"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { DatePicker } from "@/components/layout/DatePicker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegistrationStatus } from "@/generated/prisma/enums";
import type { ClientSchema } from "@/validators/clientSchema";

const statusMap = {
  [RegistrationStatus.PENDING]: {
    label: "Pendente",
    dateLabel: "",
  },
  [RegistrationStatus.IN_PROGRESS]: {
    label: "Em emplacamento",
    dateLabel: "Data de Saída para Emplacamento",
  },
  [RegistrationStatus.COMPLETED]: {
    label: "Emplacado",
    dateLabel: "Data de Emplacamento",
  },
};

interface LicensePlateStatusProps {
  form: UseFormReturn<ClientSchema>;
}

export function LicensePlateStatus({ form }: LicensePlateStatusProps) {
  const currentStatus = form.watch("registrationStatus") as RegistrationStatus;

  const showDate =
    currentStatus && currentStatus !== RegistrationStatus.PENDING;

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Situação de Emplacamento</Label>

        <Controller
          control={form.control}
          name="registrationStatus"
          render={({ field }) => (
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (value === RegistrationStatus.PENDING) {
                  form.setValue("registrationStatusDate", null, {
                    shouldValidate: false,
                  });
                }
              }}
              value={field.value}
            >
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Selecione uma situação">
                  {field.value
                    ? statusMap[field.value as RegistrationStatus].label
                    : "Selecione uma situação"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {Object.values(RegistrationStatus).map((status) => (
                  <SelectItem
                    key={status}
                    className="h-12 text-base"
                    value={status}
                  >
                    {statusMap[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {showDate && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
          <Label className="text-sm">
            {statusMap[currentStatus].dateLabel}
          </Label>
          <Controller
            control={form.control}
            name="registrationStatusDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date ?? null)}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
