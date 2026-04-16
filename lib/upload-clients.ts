import type { ClientSchema } from "@/validators/clientSchema";

type UploadResult = {
  success: boolean;
  data?: ClientSchema[];
  error?: string;
};

export async function parseExcelFile(file: File): Promise<UploadResult> {
  try {
    const buffer = await file.arrayBuffer();

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet("Página 1");

    if (!worksheet) {
      return {
        success: false,
        error: "A aba Página 1 é obrigatória.",
      };
    }

    const normalize = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const parseExcelDate = (value: unknown): Date => {
      if (value instanceof Date) return value;

      if (typeof value === "number") {
        return new Date(Math.round((value - 25569) * 86400 * 1000));
      }

      if (typeof value === "string") {
        const [day, month, year] = value.split("/");
        if (day && month && year) {
          return new Date(`${year}-${month}-${day}`);
        }
      }

      return new Date(String(value));
    };

    const parseRegistrationStatus = (
      value: unknown,
      baseDate: Date,
    ): {
      status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
      date: Date | null;
    } => {
      const text = String(value ?? "").trim();

      if (!text) {
        return {
          status: "PENDING",
          date: null,
        };
      }

      const match = text.match(/(\d{2})\/(\d{2})/);

      if (!match) {
        return {
          status: "PENDING",
          date: null,
        };
      }

      const [, day, month] = match;

      let year = baseDate.getFullYear();

      // virada de ano
      if (Number(month) < baseDate.getMonth() + 1) {
        year += 1;
      }

      let status: "PENDING" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS";

      if (text.toLowerCase().includes("emplacado")) {
        status = "COMPLETED";
      }

      return {
        status,
        date: new Date(`${year}-${month}-${day}`),
      };
    };

    const requiredColumns = {
      cliente: -1,
      "data do faturamento": -1,
      modelo: -1,
      chassi: -1,
      vendedor: -1,
      cidade: -1,
      "status atualizado": -1,
    };

    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const normalized = normalize(cell.value);

      if (normalized in requiredColumns) {
        requiredColumns[normalized as keyof typeof requiredColumns] = colNumber;
      }
    });

    const missingColumns = Object.entries(requiredColumns)
      .filter(([, index]) => index === -1)
      .map(([name]) => name);

    if (missingColumns.length) {
      return {
        success: false,
        error: `Colunas obrigatórias ausentes: ${missingColumns.join(", ")}`,
      };
    }

    const rows: ClientSchema[] = [];
    const seenChassis = new Set<string>();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const chassis = String(
        row.getCell(requiredColumns.chassi).value ?? "",
      ).trim();

      if (!chassis || seenChassis.has(chassis)) return;
      seenChassis.add(chassis);

      const billingDate = parseExcelDate(
        row.getCell(requiredColumns["data do faturamento"]).value,
      );

      const statusData = parseRegistrationStatus(
        row.getCell(requiredColumns["status atualizado"]).value,
        billingDate,
      );

      rows.push({
        client: String(row.getCell(requiredColumns.cliente).value ?? "").trim(),
        billingDate,
        model: String(row.getCell(requiredColumns.modelo).value ?? "").trim(),
        chassis,
        sellersName: String(
          row.getCell(requiredColumns.vendedor).value ?? "",
        ).trim(),
        city: String(row.getCell(requiredColumns.cidade).value ?? "").trim(),
        registrationStatus: statusData.status,
        registrationStatusDate: statusData.date,
      });
    });

    if (!rows.length) {
      return {
        success: false,
        error: "Nenhuma linha válida encontrada.",
      };
    }

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("Spreadsheet processing error:", error);

    return {
      success: false,
      error: "Erro ao processar a planilha.",
    };
  }
}
