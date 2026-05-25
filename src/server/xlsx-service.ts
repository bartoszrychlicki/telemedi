import ExcelJS from "exceljs";

import { createEmployee } from "@/server/employee-service";
import { employeeSchema } from "@/server/schemas";

const employeeColumns = [
  "imie",
  "nazwisko",
  "pesel",
  "data_urodzenia",
  "dokument_seria",
  "dokument_numer",
  "dokument_nazwa",
  "dokument_kraj",
  "stanowisko",
  "adres",
  "email",
  "telefon",
] as const;

type EmployeeColumn = (typeof employeeColumns)[number];

export async function buildEmployeeImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pracownicy");
  worksheet.columns = employeeColumns.map((column) => ({
    header: column,
    key: column,
    width: Math.max(column.length + 4, 16),
  }));
  worksheet.addRow({
    imie: "Anna",
    nazwisko: "Kowalska",
    pesel: "85010112345",
    data_urodzenia: "",
    dokument_seria: "",
    dokument_numer: "",
    dokument_nazwa: "",
    dokument_kraj: "",
    stanowisko: "Specjalistka ds. kadr",
    adres: "ul. Prosta 1, 00-001 Warszawa",
    email: "anna.kowalska@example.com",
    telefon: "500 100 200",
  } satisfies Record<EmployeeColumn, string>);

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

export async function importEmployeesFromWorkbook(
  companyId: string,
  buffer: ArrayBuffer,
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer) as never);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return {
      imported: [],
      errors: [{ row: 0, message: "Plik nie zawiera arkusza." }],
    };
  }

  const errors: { row: number; message: string }[] = [];
  const imported: Awaited<ReturnType<typeof createEmployee>>[] = [];

  const headerRow = worksheet.getRow(1);
  const rawHeaderValues = headerRow.values;
  const headerValues = Array.isArray(rawHeaderValues)
    ? rawHeaderValues.slice(1).map((value) => cellToString(value))
    : [];
  const headers = new Set(headerValues);
  const missingColumns = employeeColumns.filter((column) => !headers.has(column));

  if (missingColumns.length > 0) {
    return {
      imported,
      errors: [
        {
          row: 1,
          message: `Brak kolumn: ${missingColumns.join(", ")}`,
        },
      ],
    };
  }

  const columnIndex = Object.fromEntries(
    headerValues.map((header: string, index: number) => [header, index + 1]),
  ) as Record<EmployeeColumn, number>;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) {
      continue;
    }

    const parsed = employeeSchema.safeParse({
      firstName: getCell(row, columnIndex.imie),
      lastName: getCell(row, columnIndex.nazwisko),
      pesel: stringOrNull(getCell(row, columnIndex.pesel)),
      birthDate: dateCellToIso(row.getCell(columnIndex.data_urodzenia).value),
      identityDocumentSeries: stringOrNull(
        getCell(row, columnIndex.dokument_seria),
      ),
      identityDocumentNumber: stringOrNull(
        getCell(row, columnIndex.dokument_numer),
      ),
      identityDocumentName: stringOrNull(
        getCell(row, columnIndex.dokument_nazwa),
      ),
      identityDocumentCountry: stringOrNull(
        getCell(row, columnIndex.dokument_kraj),
      ),
      position: getCell(row, columnIndex.stanowisko),
      address: getCell(row, columnIndex.adres),
      email: getCell(row, columnIndex.email),
      phone: getCell(row, columnIndex.telefon),
    });

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      continue;
    }

    try {
      imported.push(await createEmployee(companyId, parsed.data));
    } catch (error) {
      errors.push({
        row: rowNumber,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się zaimportować wiersza.",
      });
    }
  }

  return { imported, errors };
}

function stringOrNull(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function dateCellToIso(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
}

function getCell(row: ExcelJS.Row, index: number) {
  return cellToString(row.getCell(index).value);
}

function cellToString(value: ExcelJS.CellValue | undefined) {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("text" in value && value.text) {
      return value.text;
    }
    if ("result" in value && value.result != null) {
      return String(value.result);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }
  return String(value);
}
