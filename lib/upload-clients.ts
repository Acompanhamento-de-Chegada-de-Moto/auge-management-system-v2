import type { ClientSchema } from "@/validators/clientSchema";

type UploadResult = {
  success: boolean;
  data?: ClientSchema[];
  error?: string;
};

const ABA_ALTERNATIVAS = [
  "Página1",
  "Pagina1",
  "PÁGINA1",
  "PAGINA1",
  "página1",
  "pagina1",
  "Página 1",
  "Pagina 1",
];

export async function parseExcelFile(file: File): Promise<UploadResult> {
  try {
    const buffer = await file.arrayBuffer();

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let worksheet = null;
    for (const nome of ABA_ALTERNATIVAS) {
      worksheet = workbook.getWorksheet(nome);
      if (worksheet) break;
    }

    if (!worksheet) {
      const abasDisponiveis = workbook.worksheets.map((w) => `"${w.name}"`);
      return {
        success: false,
        error: `Aba 'Página1' não foi encontrada. Abas disponíveis: ${abasDisponiveis.join(", ")}`,
      };
    }

    const normalize = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");

    const parseExcelDate = (value: unknown): Date | undefined => {
      if (value === null || value === undefined || value === "") return undefined;
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

      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) return undefined;
      return parsed;
    };

    const parseRegistrationStatus = (
      value: unknown,
      baseDate: Date | undefined,
    ): {
      status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
      date: Date | null;
    } => {
      const text = String(value ?? "").trim();

      if (!text) {
        return { status: "PENDING", date: null };
      }

      const match = text.match(/(\d{2})\/(\d{2})/);

      if (!match) {
        return { status: "PENDING", date: null };
      }

      const [, day, month] = match;

      let year = baseDate ? baseDate.getFullYear() : new Date().getFullYear();

      if (baseDate && Number(month) < baseDate.getMonth() + 1) {
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

    const targetHeaders = [
      "cliente",
      "data do faturamento",
      "modelo",
      "chassi",
      "vendedor",
      "cidade",
      "status atualizado",
    ];

    let headerRowNumber = -1;
    let requiredColumns: Record<string, number> = {};
    const maxRowsToCheck = Math.min(worksheet.rowCount, 10);

    for (let rowNum = 1; rowNum <= maxRowsToCheck; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const values = row.values as unknown[];
      const normalizedRow = values.map((v) => normalize(v));
      const matchedColumns: Record<string, number> = {};
      let matchCount = 0;

      for (let col = 1; col < normalizedRow.length; col++) {
        const cellNorm = normalizedRow[col];
        if (targetHeaders.includes(cellNorm)) {
          matchedColumns[cellNorm] = col;
          matchCount++;
        }
      }

      if (matchCount >= 6) {
        headerRowNumber = rowNum;
        requiredColumns = matchedColumns;
        break;
      }
    }

    if (headerRowNumber === -1) {
      return {
        success: false,
        error: `Não foi possível detectar a linha de cabeçalho nas primeiras ${maxRowsToCheck} linhas.`,
      };
    }

    const missingColumns = targetHeaders.filter((h) => !(h in requiredColumns));
    if (missingColumns.length) {
      return {
        success: false,
        error: `Colunas obrigatórias ausentes: ${missingColumns.join(", ")}`,
      };
    }

    const CHASSI_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

    const rows: ClientSchema[] = [];
    const seenChassis = new Set<string>();
    const skippedRows: number[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;

      const chassis = String(
        row.getCell(requiredColumns.chassi).value ?? "",
      ).trim().toUpperCase();

      if (!chassis || seenChassis.has(chassis)) {
        skippedRows.push(rowNumber);
        return;
      }

      if (!CHASSI_REGEX.test(chassis)) {
        skippedRows.push(rowNumber);
        return;
      }

      const client = String(row.getCell(requiredColumns.cliente).value ?? "").trim();
      const model = String(row.getCell(requiredColumns.modelo).value ?? "").trim();
      const sellersName = String(row.getCell(requiredColumns.vendedor).value ?? "").trim();
      const city = String(row.getCell(requiredColumns.cidade).value ?? "").trim();

      if (!client || !model || !sellersName || !city) {
        skippedRows.push(rowNumber);
        return;
      }

      seenChassis.add(chassis);

      const billingDate = parseExcelDate(
        row.getCell(requiredColumns["data do faturamento"]).value,
      );

      const statusData = parseRegistrationStatus(
        row.getCell(requiredColumns["status atualizado"]).value,
        billingDate,
      );

      rows.push({
        client,
        billingDate,
        model,
        chassis,
        sellersName,
        city,
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
  } catch {
    return {
      success: false,
      error: "Erro ao processar a planilha.",
    };
  }
}
