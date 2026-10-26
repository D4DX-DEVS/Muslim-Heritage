import { describe, expect, it } from "vitest";
import { safeFilename, sniffMime } from "@/lib/admin/media";
import { hashPassword, hmacHex, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery", 1000);
    expect(hash).toMatch(/^pbkdf2_sha256\$1000\$/);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("uses a random salt", async () => {
    expect(await hashPassword("same", 1000)).not.toBe(await hashPassword("same", 1000));
  });

  it("rejects malformed or over-limit hashes", async () => {
    expect(await verifyPassword("x", "plain")).toBe(false);
    expect(await verifyPassword("x", "pbkdf2_sha256$999999999$aa$bb")).toBe(false);
  });

  it("HMACs session tokens deterministically", async () => {
    expect(await hmacHex("secret", "token")).toBe(await hmacHex("secret", "token"));
    expect(await hmacHex("secret", "token")).not.toBe(await hmacHex("other", "token"));
  });
});

describe("upload validation", () => {
  it("detects types from magic bytes, not names", () => {
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffMime(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("<html>"))).toBeNull();
  });

  it("produces safe object key names", () => {
    expect(safeFilename("../../etc/passwd")).not.toMatch(/[./\\]/);
    expect(safeFilename("ചിത്രം.jpg")).toBe("file");
    expect(safeFilename("My Photo (1).JPG")).toBe("my-photo-1");
  });
});
