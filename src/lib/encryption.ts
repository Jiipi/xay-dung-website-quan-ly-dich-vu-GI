import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Fail-fast nếu thiếu/ngắn — KHÔNG dùng fallback hardcode (rủi ro bảo mật nghiêm trọng).
// ENCRYPTION_KEY phải >= 32 ký tự; sha256 → 32 bytes cho AES-256-GCM.
function getSecretKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY chưa được cấu hình hoặc ngắn hơn 32 ký tự. Hãy đặt biến môi trường ENCRYPTION_KEY (>= 32 ký tự ngẫu nhiên).",
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(12); // Vector khởi tạo 12 bytes cho GCM
    const key = getSecretKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Ghép các phần: iv:tag:ciphertext
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Lỗi mã hóa dữ liệu:", error);
    throw new Error("Mã hóa thông tin tài khoản thất bại");
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Định dạng dữ liệu mã hóa không hợp lệ");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = Buffer.from(parts[2], "hex");
    
    const key = getSecretKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Lỗi giải mã dữ liệu:", error);
    throw new Error("Giải mã thông tin tài khoản thất bại (Sai key hoặc dữ liệu bị sửa đổi)");
  }
}
