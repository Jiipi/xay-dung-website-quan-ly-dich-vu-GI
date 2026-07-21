import { beforeAll, describe, expect, it } from "vitest";
import { encrypt, decrypt } from "./encryption";

// Khóa test 32 ký tự (không phải secret thật)
const TEST_KEY = "0123456789abcdef0123456789abcdef";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

describe("encryption AES-256-GCM", () => {
  it("round-trip: giải mã ra đúng plaintext", () => {
    const plain = "GamePass@Raiden2026";
    const enc = encrypt(plain);
    expect(enc).not.toContain(plain);
    expect(enc.split(":")).toHaveLength(3); // iv:tag:ciphertext
    expect(decrypt(enc)).toBe(plain);
  });

  it("mỗi lần mã hóa cho ciphertext khác nhau (IV ngẫu nhiên) nhưng giải mã vẫn đúng", () => {
    const a = encrypt("same-plaintext");
    const b = encrypt("same-plaintext");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same-plaintext");
    expect(decrypt(b)).toBe("same-plaintext");
  });

  it("phát hiện dữ liệu bị sửa đổi (tamper) — ném lỗi", () => {
    const enc = encrypt("secret-data");
    const [iv, tag, data] = enc.split(":");
    const lastChar = data.slice(-1);
    const flipped = lastChar === "0" ? "1" : "0";
    const tampered = `${iv}:${tag}:${data.slice(0, -1)}${flipped}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it("sai định dạng chuỗi mã hóa — ném lỗi", () => {
    expect(() => decrypt("khong-hop-le")).toThrow();
  });

  it("REGRESSION P0-4: thiếu ENCRYPTION_KEY -> ném lỗi (fail-fast, KHÔNG dùng fallback)", () => {
    const orig = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => encrypt("x")).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = orig;
    }
  });
});
