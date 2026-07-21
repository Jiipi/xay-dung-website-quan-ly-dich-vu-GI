"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bắt lỗi nghiêm trọng xảy ra trong root layout (Provider crash, etc.).
 * Phải tự render <html><body> vì root layout có thể đã hỏng.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              margin: "0 auto",
              borderRadius: "9999px",
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle
              style={{ width: "2rem", height: "2rem", color: "#ef4444" }}
            />
          </div>

          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Hệ thống gặp sự cố nghiêm trọng
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Đội ngũ kỹ thuật đã được thông báo tự động. Vui lòng thử lại
              sau ít phút.
            </p>
          </div>

          {error?.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Mã lỗi: {error.digest}
            </p>
          )}

          <Button
            onClick={() => reset()}
            style={{
              margin: "0 auto",
              padding: "0.625rem 1.25rem",
              background: "#f59e0b",
              color: "#0f172a",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RotateCcw style={{ width: "1rem", height: "1rem" }} />
            Thử lại
          </Button>
        </div>
      </body>
    </html>
  );
}
