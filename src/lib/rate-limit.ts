interface RateLimitRecord {
  timestamps: number[];
}

// Sử dụng global object để giữ dữ liệu map trong bộ nhớ qua các lần hot-reload của Next.js
const globalForRateLimit = global as unknown as {
  rateLimitMap: Map<string, RateLimitRecord>;
};

if (!globalForRateLimit.rateLimitMap) {
  globalForRateLimit.rateLimitMap = new Map();
}

const rateLimitMap = globalForRateLimit.rateLimitMap;

/**
 * Kiểm tra xem một IP có bị giới hạn tần suất yêu cầu (Rate Limit) hay không.
 * @param ip Địa chỉ IP của client
 * @param limit Số lượng yêu cầu tối đa cho phép trong cửa sổ thời gian
 * @param windowMs Cửa sổ thời gian tính bằng mili giây (ví dụ: 60000ms = 1 phút)
 * @returns true nếu bị giới hạn (blocked), false nếu hợp lệ
 */
export function isRateLimited(
  ip: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = ip;

  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { timestamps: [now] });
    return false;
  }

  // Lọc bỏ các timestamp nằm ngoài cửa sổ thời gian windowMs
  const validTimestamps = record.timestamps.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (validTimestamps.length >= limit) {
    // Cập nhật lại danh sách timestamp hợp lệ để tránh phình to bộ nhớ
    record.timestamps = validTimestamps;
    rateLimitMap.set(key, record);
    return true;
  }

  validTimestamps.push(now);
  record.timestamps = validTimestamps;
  rateLimitMap.set(key, record);
  return false;
}

// Hàm dọn dẹp bộ nhớ định kỳ cho rate limiter
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    const validTimestamps = record.timestamps.filter(
      (timestamp) => now - timestamp < 15 * 60 * 1000 // Giữ lại tối đa 15 phút
    );
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 5 * 60 * 1000); // 5 phút dọn dẹp một lần
