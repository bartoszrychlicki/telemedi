import { describe, expect, it } from "vitest";

import { validateEmail, validateRequired } from "@/lib/form-validation";

describe("form validation helpers", () => {
  it("reports missing required labels", () => {
    expect(
      validateRequired([
        { label: "Nazwa", value: "ACME" },
        { label: "NIP", value: " " },
        { label: "Adres", value: "" },
      ]),
    ).toBe("Uzupełnij wymagane pola: NIP, Adres.");
  });

  it("allows optional blank email and rejects invalid emails", () => {
    expect(validateEmail("Email kontaktowy", "")).toBeNull();
    expect(validateEmail("Email kontaktowy", "brak-emaila")).toBe(
      'Pole "Email kontaktowy" musi zawierać prawidłowy adres email.',
    );
  });
});
