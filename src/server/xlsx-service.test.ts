import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

vi.mock("@/server/employee-service", () => ({
  createEmployee: vi.fn(async (_companyId, input) => ({
    id: "emp_1",
    ...input,
  })),
}));

const { buildEmployeeImportTemplate, importEmployeesFromWorkbook } = await import(
  "@/server/xlsx-service"
);

describe("xlsx service", () => {
  it("builds the expected import template columns", () => {
    return buildEmployeeImportTemplate().then(async (buffer) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as never);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("worksheet missing");
      }
      const values = worksheet.getRow(1).values;
      const headers = Array.isArray(values) ? values.slice(1) : [];

      expect(headers).toEqual([
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
      ]);
    });
  });

  it("imports valid rows and reports invalid rows", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pracownicy");
    worksheet.addRow([
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
    ]);
    worksheet.addRow([
      "Anna",
      "Kowalska",
      "85010112345",
      "",
      "",
      "",
      "",
      "",
      "Specjalistka",
      "Warszawa",
      "anna@example.com",
      "500100200",
    ]);
    worksheet.addRow(["", "", "", "", "", "", "", "", "", "", "bad", ""]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const arrayBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(arrayBuffer).set(buffer);

    const result = await importEmployeesFromWorkbook("company_1", arrayBuffer);

    expect(result.imported).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
  });
});
