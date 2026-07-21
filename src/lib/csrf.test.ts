import { describe, expect, it } from "vitest";
import { isCrossSiteRequest, isBlockedCrossSite } from "./csrf";

describe("isCrossSiteRequest (CSRF/Origin)", () => {
  it("same-origin (Origin host = Host) -> KHÔNG chặn", () => {
    expect(isCrossSiteRequest("http://localhost:3000", "localhost:3000")).toBe(false);
  });

  it("cross-site (Origin khác Host) -> chặn", () => {
    expect(isCrossSiteRequest("https://evil.com", "localhost:3000")).toBe(true);
  });

  it("không có Origin -> KHÔNG kết luận (false, dựa SameSite cookie)", () => {
    expect(isCrossSiteRequest(null, "localhost:3000")).toBe(false);
  });

  it("Origin nằm trong allowedOrigins -> KHÔNG chặn", () => {
    expect(
      isCrossSiteRequest("https://app.example.com", "internal:8080", [
        "https://app.example.com",
      ])
    ).toBe(false);
  });

  it("Origin dị dạng -> chặn (đáng ngờ)", () => {
    expect(isCrossSiteRequest("not-a-url", "localhost:3000")).toBe(true);
  });
});

describe("isBlockedCrossSite (đọc từ Request)", () => {
  it("Origin khớp Host -> không chặn", () => {
    const req = new Request("http://localhost:3000/api/x", {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    });
    expect(isBlockedCrossSite(req)).toBe(false);
  });

  it("Origin lạ -> chặn", () => {
    const req = new Request("http://localhost:3000/api/x", {
      method: "POST",
      headers: { origin: "https://evil.com", host: "localhost:3000" },
    });
    expect(isBlockedCrossSite(req)).toBe(true);
  });
});
