import { SignJWT, jwtVerify } from "jose";

// Fail-fast nếu thiếu secret — KHÔNG dùng fallback hardcode (rủi ro bảo mật).
function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET chưa được cấu hình hoặc ngắn hơn 32 ký tự. Hãy đặt biến môi trường NEXTAUTH_SECRET (>= 32 ký tự ngẫu nhiên)."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "BOOSTER" | "ADMIN";
  name?: string;
  type?: string;
}

export async function signToken(payload: TokenPayload, expirationTime = "7d"): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecretKey());
  return token;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
