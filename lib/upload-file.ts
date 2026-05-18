import type { MotorcycleArrivalSchema } from "@/validators/motorcycleArrivalSchema";

type UploadResult = {
  success: boolean;
  data?: MotorcycleArrivalSchema[];
  error?: string;
};

function parseExcelDate(value: unknown): Date {
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const [day, month, year] = trimmed.split("/");
    if (day && month && year) {
      return new Date(`${year}-${month}-${day}`);
    }
    const [y, m, d] = trimmed.split("-");
    if (y && m && d) {
      return new Date(`${y}-${m}-${d}`);
    }
  }

  return new Date(String(value));
}

const ABA_ALTERNATIVAS = ["Página2", "Pagina2", "PÁGINA2", "PAGINA2", "página2", "pagina2"];

export async function parseExcelFile(file: File): Promise<UploadResult> {
  try {
    const buffer = await file.arrayBuffer();
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let worksheet = null;
    for (const nome of ABA_ALTERNATIVAS) {
      worksheet = workbook.getWorksheet(nome);
      if (worksheet) {
        console.log(`[Logistics Upload] Aba encontrada: ${nome}`);
        break;
      }
    }

    if (!worksheet) {
      const abasDisponiveis = workbook.worksheets.map((w) => w.name);
      console.error("[Logistics Upload] Abas disponíveis:", abasDisponiveis);
      return {
        success: false,
        error: `Aba 'Página2' não encontrada. Abas disponíveis: ${abasDisponiveis.join(", ")}`,
      };
    }

    const normalize = (value: unknown) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");

    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as unknown[];

    console.log("[Logistics Upload] Headers brutos:", headers);

    let chassiIndex = -1;
    let modeloIndex = -1;
    let dataIndex = -1;

    headers.forEach((header, index) => {
      const normalized = normalize(header);

      if (normalized === "chassi") chassiIndex = index;
      if (normalized === "modelo") modeloIndex = index;
      if (
        normalized === "data de chegada da moto" ||
        normalized === "data de chegada" ||
        normalized === "datachegada" ||
        normalized === "data chegada" ||
        normalized === "data de chegada moto"
      )
        dataIndex = index;
    });

    console.log("[Logistics Upload] Índices encontrados:", {
      chassiIndex,
      modeloIndex,
      dataIndex,
    });

    if (chassiIndex === -1 || modeloIndex === -1 || dataIndex === -1) {
      return {
        success: false,
        error:
          "A aba 'Página2' deve conter as colunas: DATA DE CHEGADA DA MOTO, MODELO e CHASSI.",
      };
    }

    const CHASSI_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

    const rows: MotorcycleArrivalSchema[] = [];
    const seenChassis = new Set<string>();
    const skippedRows: number[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const chassi = row.getCell(chassiIndex).value;
      const modelo = row.getCell(modeloIndex).value;
      const dataChegada = row.getCell(dataIndex).value;

      if (!chassi || !dataChegada) {
        skippedRows.push(rowNumber);
        return;
      }

      const chassisStr = String(chassi).trim().toUpperCase();

      if (!CHASSI_REGEX.test(chassisStr)) {
        console.warn(`[Logistics Upload] Linha ${rowNumber} ignorada: chassi inválido "${chassisStr}"`);
        skippedRows.push(rowNumber);
        return;
      }

      if (seenChassis.has(chassisStr)) {
        skippedRows.push(rowNumber);
        return;
      }
      seenChassis.add(chassisStr);

      const modelStr = modelo ? String(modelo).trim() : "";
      if (!modelStr) {
        console.warn(`[Logistics Upload] Linha ${rowNumber} ignorada: modelo vazio`);
        skippedRows.push(rowNumber);
        return;
      }

      const arrivalDate = parseExcelDate(dataChegada);
      if (Number.isNaN(arrivalDate.getTime())) {
        console.warn(`[Logistics Upload] Linha ${rowNumber} ignorada: data inválida "${dataChegada}"`);
        skippedRows.push(rowNumber);
        return;
      }

      rows.push({
        chassis: chassisStr,
        model: modelStr,
        arrivalDate,
      });
    });

    console.log(`[Logistics Upload] Total processado: ${rows.length} linhas válidas, ${skippedRows.length} ignoradas.`);

    if (!rows.length) {
      return {
        success: false,
        error: "Nenhuma linha válida encontrada na aba 'Página2'. Verifique se os dados estão preenchidos corretamente.",
      };
    }

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error("[Logistics Upload] Erro ao processar planilha:", error);
    return { success: false, error: "Erro ao processar a planilha." };
  }
}
