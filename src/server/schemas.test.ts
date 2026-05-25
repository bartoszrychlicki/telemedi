import { describe, expect, it } from "vitest";

import {
  companyCreateSchema,
  companySettingsSchema,
  employeeSchema,
  referralCreateSchema,
  referralStatusUpdateSchema,
} from "@/server/schemas";

describe("request schemas", () => {
  it("allows company REGON to be left blank", () => {
    const createResult = companyCreateSchema.safeParse({
      name: "ACME Sp. z o.o.",
      shortName: "ACME",
      nip: "9571130261",
      regon: "",
      address: "Topolowa 2/7, 80-322 Gdansk",
      contactPhone: "",
      contactEmail: "",
    });
    const settingsResult = companySettingsSchema.safeParse({
      name: "ACME Sp. z o.o.",
      shortName: "ACME",
      nip: "9571130261",
      regon: "",
      address: "Topolowa 2/7, 80-322 Gdansk",
      contactPhone: "",
      contactEmail: "",
      pdfIssuedPlace: "",
      pdfSignatoryName: "",
      pdfSignatoryTitle: "",
      pdfFooterNote: "",
    });

    expect(createResult.success).toBe(true);
    expect(settingsResult.success).toBe(true);
  });

  it("requires document data when employee has no PESEL", () => {
    const result = employeeSchema.safeParse({
      firstName: "Anna",
      lastName: "Kowalska",
      position: "Specjalistka",
      address: "Warszawa",
      email: "anna@example.com",
      phone: "500100200",
    });

    expect(result.success).toBe(false);
  });

  it("allows employee without PESEL when document data is complete", () => {
    const result = employeeSchema.safeParse({
      firstName: "Anna",
      lastName: "Kowalska",
      birthDate: "1985-01-01",
      identityDocumentSeries: "ABC",
      identityDocumentNumber: "123456",
      identityDocumentName: "paszport",
      identityDocumentCountry: "PL",
      position: "Specjalistka",
      address: "Warszawa",
      email: "anna@example.com",
      phone: "500100200",
    });

    expect(result.success).toBe(true);
  });

  it("requires bulk confirmation for multi employee referrals", () => {
    const result = referralCreateSchema.safeParse({
      employeeIds: ["emp_1", "emp_2"],
      type: "INITIAL",
      employmentContext: "STARTING_WORK",
      issuedPlace: "Warszawa",
      deadlineDate: "2026-06-01",
      positionDescription: "Praca biurowa",
      workDescription: "Biuro",
      hazards: [
        {
          category: "PHYSICAL",
          factorName: "praca przy komputerze",
          exposureValue: "6 godzin dziennie",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires facility and date for scheduled status", () => {
    const result = referralStatusUpdateSchema.safeParse({
      status: "SCHEDULED",
    });

    expect(result.success).toBe(false);
  });
});
