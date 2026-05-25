"use client";

type RequiredField = {
  label: string;
  value: string | null | undefined;
};

export function isBlank(value: string | null | undefined) {
  return !value?.trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateRequired(fields: RequiredField[]) {
  const missing = fields
    .filter((field) => isBlank(field.value))
    .map((field) => field.label);

  if (!missing.length) {
    return null;
  }

  return `Uzupełnij wymagane pola: ${missing.join(", ")}.`;
}

export function validateEmail(label: string, value: string, required = false) {
  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `Uzupełnij wymagane pole: ${label}.` : null;
  }

  return isValidEmail(trimmed) ? null : `Pole "${label}" musi zawierać prawidłowy adres email.`;
}
