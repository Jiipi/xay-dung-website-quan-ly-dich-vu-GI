import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Endpoint để browser báo cáo CSP violations.
 * Browser sẽ gửi report khi một resource bị CSP policy chặn.
 *
 * Response shape (từ browser):
 * {
 *   "csp-report": {
 *     "document-uri": "https://example.com/page",
 *     "violated-directive": "script-src 'self'",
 *     "blocked-uri": "https://evil.com/track.js",
 *     "original-policy": "...",
 *     "source-file": "...",
 *     "line-number": 1
 *   }
 * }
 *
 * Lưu ý: chỉ log + trả về 204 (CSP spec yêu cầu endpoint
 * không được phản hồi với content lớn).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return new NextResponse(null, { status: 204 });

    const report = body["csp-report"] ?? body;
    logger.warn("csp_violation", {
      documentUri: report["document-uri"],
      violatedDirective: report["violated-directive"],
      blockedUri: report["blocked-uri"],
      sourceFile: report["source-file"],
      lineNumber: report["line-number"],
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("csp_report_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * CSP report endpoint phải chấp nhận CORS preflight nếu browser yêu cầu.
 * CSP spec không bắt buộc, nhưng nhiều browser vẫn gửi OPTIONS.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
