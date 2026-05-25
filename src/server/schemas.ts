import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Podaj prawidłowy adres email.",
  });

const requiredText = z.string().trim().min(1);

export const companyCreateSchema = z.object({
  name: requiredText,
  shortName: optionalText,
  nip: requiredText,
  regon: optionalText,
  address: requiredText,
  contactPhone: optionalText,
  contactEmail: optionalEmail,
});

export const invitationCreateSchema = z.object({
  email: z.email(),
  role: z.enum(["COORDINATOR", "HR_STAFF"]).default("COORDINATOR"),
});

export const companySettingsSchema = z.object({
  name: requiredText,
  shortName: optionalText,
  nip: requiredText,
  regon: optionalText,
  address: requiredText,
  contactPhone: optionalText,
  contactEmail: optionalEmail,
  pdfIssuedPlace: optionalText,
  pdfSignatoryName: optionalText,
  pdfSignatoryTitle: optionalText,
  pdfFooterNote: optionalText,
});

const employeeBaseSchema = z.object({
    firstName: requiredText,
    lastName: requiredText,
    pesel: optionalText,
    birthDate: optionalText,
    identityDocumentSeries: optionalText,
    identityDocumentNumber: optionalText,
    identityDocumentName: optionalText,
    identityDocumentCountry: optionalText,
    position: requiredText,
    address: requiredText,
    email: z.email(),
    phone: requiredText,
  });

export const employeeSchema = employeeBaseSchema
  .superRefine((value, ctx) => {
    if (!value.pesel) {
      const hasDocument =
        value.birthDate &&
        value.identityDocumentSeries &&
        value.identityDocumentNumber &&
        value.identityDocumentName &&
        value.identityDocumentCountry;

      if (!hasDocument) {
        ctx.addIssue({
          code: "custom",
          path: ["pesel"],
          message:
            "Podaj PESEL albo komplet danych dokumentu i datę urodzenia.",
        });
      }
    }
  });

export const employeeUpdateSchema = employeeBaseSchema.partial().extend({
  archivedAt: z.coerce.date().nullable().optional(),
});

export const hazardCreateSchema = z.object({
  category: z.enum(["PHYSICAL", "CHEMICAL", "BIOLOGICAL", "DUST", "OTHER"]),
  names: z.array(requiredText).min(1),
});

export const hazardUpdateSchema = z.object({
  name: requiredText,
});

export const templateHazardSchema = z.object({
  hazardFactorId: requiredText,
  defaultExposureValue: optionalText,
  defaultMeasurementResult: optionalText,
});

export const templateCreateSchema = z.object({
  name: requiredText,
  positionDescription: optionalText,
  workDescription: optionalText,
  hazardFactors: z.array(templateHazardSchema).default([]),
});

export const templateUpdateSchema = templateCreateSchema.partial();

export const referralHazardSchema = z.object({
  hazardFactorId: requiredText.optional().nullable(),
  category: z.enum(["PHYSICAL", "CHEMICAL", "BIOLOGICAL", "DUST", "OTHER"]),
  factorName: requiredText,
  exposureValue: requiredText,
  measurementResult: optionalText,
  notes: optionalText,
});

export const referralCreateSchema = z
  .object({
    employeeIds: z.array(requiredText).min(1),
    type: z.enum(["INITIAL", "PERIODIC", "CONTROL"]),
    employmentContext: z.enum(["EMPLOYED", "STARTING_WORK"]),
    issuedPlace: requiredText,
    deadlineDate: z.coerce.date(),
    positionDescription: requiredText,
    workDescription: requiredText,
    positionOverride: optionalText,
    hazards: z.array(referralHazardSchema).min(1),
    bulkConfirmation: z.boolean().optional(),
    saveAsTemplateName: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.employeeIds.length > 1 && !value.bulkConfirmation) {
      ctx.addIssue({
        code: "custom",
        path: ["bulkConfirmation"],
        message:
          "Potwierdź, że wszyscy wybrani pracownicy mają identyczne warunki pracy.",
      });
    }
  });

export const referralStatusUpdateSchema = z
  .object({
    status: z.enum([
      "DRAFT",
      "SUBMITTED",
      "SCHEDULED",
      "COMPLETED",
      "CLOSED",
      "CANCELLED",
    ]),
    attentionReason: z
      .enum([
        "NONE",
        "NEEDS_CORRECTION",
        "EMPLOYEE_UNREACHABLE",
        "RESCHEDULE_REQUIRED",
        "NO_SHOW",
        "NEGATIVE_DECISION",
      ])
      .default("NONE"),
    facilityName: optionalText,
    appointmentDate: z.coerce.date().nullable().optional(),
    note: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.status === "SCHEDULED") {
      if (!value.facilityName) {
        ctx.addIssue({
          code: "custom",
          path: ["facilityName"],
          message: "Podaj placówkę dla statusu Umówione.",
        });
      }
      if (!value.appointmentDate) {
        ctx.addIssue({
          code: "custom",
          path: ["appointmentDate"],
          message: "Podaj termin wizyty dla statusu Umówione.",
        });
      }
    }
  });

export const referralListQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  q: z.string().optional(),
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type ReferralCreateInput = z.infer<typeof referralCreateSchema>;
export type ReferralStatusUpdateInput = z.infer<
  typeof referralStatusUpdateSchema
>;
