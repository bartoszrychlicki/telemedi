import { describe, expect, it } from "vitest";

import { isValidPesel, maskEmail, maskPesel } from "@/lib/validation";

describe("validation helpers", () => {
  it("validates PESEL checksum", () => {
    expect(isValidPesel("85010112345")).toBe(true);
    expect(isValidPesel("85010112349")).toBe(false);
    expect(isValidPesel("abc")).toBe(false);
  });

  it("masks sensitive values for list views", () => {
    expect(maskPesel("85010112345")).toBe("85****2345");
    expect(maskEmail("anna.kowalska@example.com")).toBe("an***@example.com");
  });
});
