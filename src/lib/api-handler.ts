/**
 * Helper ánh xạ lỗi nghiệp vụ (từ `src/modules/_shared/errors`) -> HTTP response.
 *
 * Mỗi route handler bọc try/catch bằng `withApiHandler` để:
 *  - Tự động parse JSON.
 *  - Tự động verify session nếu truyền `requireSession`.
 *  - Bắt lỗi domain và trả về status code tương ứng.
 */

import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/modules/_shared/errors";
import { getCurrentSession } from "@/modules/_shared/session";
import type { TokenPayload } from "@/lib/jwt";

export type ApiContext<P = unknown> = {
  request: Request;
  params: P;
  session: TokenPayload | null;
};

export type ApiHandler<P, R> = (ctx: ApiContext<P>) => Promise<R>;

export interface WithApiOptions<P> {
  /** Bắt buộc đăng nhập (trả 401 nếu thiếu). */
  requireSession?: boolean;
  /** Bắt buộc role cụ thể (vd: "ADMIN"). Trả 403 nếu sai. */
  requireRole?: "CUSTOMER" | "ADMIN";
  /** Route có dynamic params (mặc định: {}). */
  defaultParams?: P;
}

/**
 * Bọc handler, tự động:
 *  - resolve dynamic params (Next.js 16: Promise<{...}>).
 *  - verify session từ cookie.
 *  - kiểm tra role nếu yêu cầu.
 *  - bắt lỗi domain -> trả NextResponse với status code tương ứng.
 */
export function withApiHandler<P, R>(
  options: WithApiOptions<P> = {},
  handler: ApiHandler<P, R>
): (
  request: Request,
  ctx: { params: Promise<P> }
) => Promise<NextResponse<R | { error: string }>> {
  return async (request, ctx) => {
    try {
      const params = (await ctx.params) as P;
      const session = await getCurrentSession();

      if (options.requireSession && !session) {
        return NextResponse.json(
          { error: "Chưa đăng nhập" },
          { status: 401 }
        );
      }
      if (options.requireRole && (!session || session.role !== options.requireRole)) {
        return NextResponse.json(
          { error: "Từ chối truy cập" },
          { status: 403 }
        );
      }

      const result = await handler({ request, params, session });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result as R);
    } catch (err) {
      return errorToResponse(err);
    }
  };
}

/**
 * Validate body với schema, throw ValidationError nếu fail.
 * Route handler nên gọi ở đầu handler và bắt qua withApiHandler.
 */
export async function parseBody<T extends ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Body phải là JSON hợp lệ");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first?.message ?? "Dữ liệu không hợp lệ");
  }
  return result.data;
}

/**
 * Đọc query param an toàn, ép kiểu số.
 */
export function readQueryNumber(
  url: URL,
  key: string,
  fallback: number
): number {
  const v = url.searchParams.get(key);
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function readQueryString(
  url: URL,
  key: string,
  fallback: string | null = null
): string | null {
  const v = url.searchParams.get(key);
  return v == null || v === "" ? fallback : v;
}

/* ============================================================================
 *  Internal — map error -> NextResponse
 * ========================================================================== */

function errorToResponse(err: unknown): NextResponse<{ error: string }> {
  if (err instanceof ValidationError || err instanceof ZodError) {
    const message =
      err instanceof ZodError
        ? err.issues[0]?.message ?? "Dữ liệu không hợp lệ"
        : err.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ConflictError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  console.error("API handler error:", err);
  return NextResponse.json(
    {
      error: err instanceof Error ? err.message : "Lỗi máy chủ nội bộ",
    },
    { status: 500 }
  );
}
