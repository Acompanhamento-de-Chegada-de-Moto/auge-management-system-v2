import ExcelJS from "exceljs";
import type { MotorcycleArrivalSchema } from "@/validators/motorcycleArrivalSchema";

type UploadResult = {
  success: boolean;
  data?: MotorcycleArrivalSchema[];
  error?: string;
};

export async function parseExcelFile(file: File): Promise<UploadResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, error: "Invalid spreadsheet." };
    }

    const normalize = (value: unknown) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as unknown[];

    let chassiIndex = -1;
    let modeloIndex = -1;
    let dataIndex = -1;

    headers.forEach((header, index) => {
      const normalized = normalize(header);

      if (normalized === "chassi") chassiIndex = index;
      if (normalized === "modelo") modeloIndex = index;
      if (normalized === "datachegada") dataIndex = index;
    });

    if (chassiIndex === -1 || modeloIndex === -1 || dataIndex === -1) {
      return {
        success: false,
        error: "The spreadsheet must contain: chassi, modelo and dataChegada.",
      };
    }

    const rows: MotorcycleArrivalSchema[] = [];
    const seenChassis = new Set<string>();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const chassi = row.getCell(chassiIndex).value;
      const modelo = row.getCell(modeloIndex).value;
      const dataChegada = row.getCell(dataIndex).value;

      if (!chassi || !dataChegada) return;

      const chassisStr = String(chassi).trim();

      if (seenChassis.has(chassisStr)) return;
      seenChassis.add(chassisStr);

      rows.push({
        chassis: chassisStr,
        model: modelo ? String(modelo).trim() : "",
        arrivalDate: new Date(dataChegada as string),
      });
    });

    if (!rows.length) {
      return { success: false, error: "No valid rows found." };
    }

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error processing spreadsheet." };
  }
}
