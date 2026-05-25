import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isValidPesel, normalizeEmail, normalizeOptionalText } from "@/lib/validation";
import { ApiError } from "@/lib/api";
import type { EmployeeInput } from "@/server/schemas";

function toEmployeeData(input: Partial<EmployeeInput>) {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (key === "email" && typeof value === "string") {
      data.email = normalizeEmail(value);
      continue;
    }
    if (key === "birthDate") {
      data.birthDate = value ? new Date(value as string) : null;
      continue;
    }
    if (typeof value === "string" || value === null) {
      data[key] = normalizeOptionalText(value);
      continue;
    }
    data[key] = value;
  }

  if (typeof data.pesel === "string" && !isValidPesel(data.pesel)) {
    throw new ApiError(422, "invalid_pesel", "PESEL ma nieprawidłowy format.");
  }

  return data;
}

export async function listEmployees(companyId: string, query?: string | null) {
  const q = query?.trim();
  const where: Prisma.EmployeeWhereInput = {
    companyId,
    archivedAt: null,
  };

  if (q && q.length >= 2) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { position: { contains: q, mode: "insensitive" } },
      ...(q.length >= 4 ? [{ pesel: { contains: q } }] : []),
    ];
  }

  return db.employee.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      _count: {
        select: { referrals: true },
      },
    },
  });
}

export async function createEmployee(companyId: string, input: EmployeeInput) {
  const data = toEmployeeData(input);

  return db.employee.create({
    data: {
      ...data,
      companyId,
    } as Prisma.EmployeeUncheckedCreateInput,
  });
}

export async function updateEmployee(
  companyId: string,
  employeeId: string,
  input: Partial<EmployeeInput> & { archivedAt?: Date | null },
) {
  const existing = await db.employee.findFirst({
    where: { id: employeeId, companyId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "employee_not_found", "Pracownik nie istnieje.");
  }

  return db.employee.update({
    where: { id: employeeId },
    data: {
      ...toEmployeeData(input),
      ...(input.archivedAt !== undefined ? { archivedAt: input.archivedAt } : {}),
    },
  });
}
