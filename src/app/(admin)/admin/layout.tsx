import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Trang login: render thẳng children, không verify
  // (dùng x-pathname vì middleware đã set ở một số cases)
  // Trong App Router, layout không nhận trực tiếp pathname — kiểm tra qua header
  // mà Next.js không expose. Dùng ref: layout có thể nhận request headers.
  // Cách đơn giản: thử verify. Nếu fail hoặc user không phải ADMIN,
  //   render children để login page tự hiển thị.
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    // Có thể là /admin/login (không có cookie) — render children để trang tự xử lý
    return <>{children}</>;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    // Token có nhưng user không hợp lệ → render để login page xử lý
    return <>{children}</>;
  }

  return (
    <AdminShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
