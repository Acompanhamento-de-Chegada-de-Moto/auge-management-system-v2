"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  value?: Date;
  onChange?: (date?: Date) => void;
};

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant="outline"
          data-empty={!value}
          className="w-full h-12 justify-start text-left font-normal data-[empty=true]:text-muted-foreground cursor-pointer"
        >
          <CalendarIcon />

          {value ? (
            format(value, "PPP", { locale: ptBR })
          ) : (
            <span>Escolha uma data</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
