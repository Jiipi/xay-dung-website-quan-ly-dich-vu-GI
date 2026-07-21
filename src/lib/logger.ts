/**
 * Logger tập trung cho server-side logs.
 *
 * Mục tiêu:
 *  - Thay thế toàn bộ `console.log/warn/error` trong src/
 *  - Cấu trúc JSON để dễ tích hợp Sentry/Datadog/CloudWatch
 *  - Tự động redact PII (email, password, token, cookie)
 *  - Production: chỉ xuất warn+error; dev: xuất tất cả + debug
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "cookie",
  "authorization",
  "jwt",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
  "session",
  "credit_card",
  "card",
  "cvv",
];

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    // Mask email: keep domain tld
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return value.replace(/^([^@]{2})[^@]*(@.*)$/, "$1***$2");
    }
    // Mask anything that looks like jwt (long base64url)
    if (value.length > 40 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
      return `${value.slice(0, 8)}...${value.slice(-6)}`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

function format(level: LogLevel, message: string, meta?: LogMeta): string {
  const entry = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...(meta ?? {}),
  };
  // JSON-line cho prod ingestion; human-readable không cần thiết vì Sentry/Datadog đọc được
  return JSON.stringify(entry);
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  const safe = redact(meta) as LogMeta;
  const payload = format(level, message, safe);

  const out = (line: string) => {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else if (process.env.NODE_ENV !== "production") {
      if (level === "info") console.info(line);
      else console.debug(line);
    }
  };
  out(payload);
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    emit("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta);
  },
};
