import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "./validation";

describe("registerSchema", () => {
  it("dữ liệu hợp lệ", () => {
    const r = registerSchema.safeParse({
      name: "Nguyễn An",
      email: "an@example.com",
      password: "12345678",
    });
    expect(r.success).toBe(true);
  });

  it("email sai định dạng -> lỗi", () => {
    expect(
      registerSchema.safeParse({ name: "An", email: "abc", password: "12345678" }).success
    ).toBe(false);
  });

  it("mật khẩu < 8 ký tự -> lỗi", () => {
    expect(
      registerSchema.safeParse({ name: "An", email: "a@b.com", password: "123" }).success
    ).toBe(false);
  });

  it("thiếu tên -> lỗi", () => {
    expect(
      registerSchema.safeParse({ name: "  ", email: "a@b.com", password: "12345678" }).success
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("dữ liệu hợp lệ", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("email sai -> lỗi", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("thiếu mật khẩu -> lỗi", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});
