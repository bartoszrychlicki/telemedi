export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeOptionalText(value?: string | null) {
  const normalized = normalizeText(value ?? "");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidPesel(pesel: string) {
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce(
    (total, weight, index) => total + Number(pesel[index]) * weight,
    0,
  );
  const control = (10 - (sum % 10)) % 10;
  return control === Number(pesel[10]);
}

export function maskPesel(pesel?: string | null) {
  if (!pesel) {
    return null;
  }
  return `${pesel.slice(0, 2)}****${pesel.slice(-4)}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain || name.length <= 2) {
    return email;
  }
  return `${name.slice(0, 2)}***@${domain}`;
}

export function parseDateInput(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
