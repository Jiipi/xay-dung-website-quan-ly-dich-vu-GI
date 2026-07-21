🚀 BƯỚC TIẾP THEO: THIẾT KẾ THƯƠNG HIỆU & CODE GIAO DIỆN TĨNH
Dưới đây tôi sẽ đề xuất bộ nhận diện thương hiệu, sau đó cung cấp code mẫu cho Landing Page, Bảng giá, và Form tạo đơn (đặc biệt nhấn mạnh form thông tin đăng nhập tạm thời) bằng Next.js + Tailwind + shadcn/ui.

🎨 Bộ nhận diện thương hiệu
Tên website: GenshinFlow

Ngụ ý “dòng chảy dịch vụ Genshin mượt mà, chuyên nghiệp”.

Màu sắc chủ đạo:

Primary (Xanh đậm): #1e3a8a (blue-900) → thể hiện sự tin cậy, công nghệ.

Accent (Vàng nổi bật): #f59e0b (amber-500) → tạo điểm nhấn, gợi nhớ màu Nguyên Tố trong game.

Neutral: Gray-50 đến Gray-900.

Font chữ: Inter (thân thiện, hiện đại) hoặc Noto Sans Vietnamese.

Logo: Có thể dùng icon lửa/vòng tròn kết hợp với chữ “GF” cách điệu.

💻 Triển khai code tĩnh (Giai đoạn A)
Tôi sẽ hướng dẫn bạn cấu trúc thư mục và viết các component chính. Giả sử bạn đã khởi tạo project Next.js và cài đặt shadcn/ui, tailwindcss, framer-motion, react-hook-form, zod.

Cấu trúc thư mục (khuyến nghị)
text
src/
├── app/
│   ├── (customer)/          # Layout cho khách
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing
│   │   ├── services/
│   │   │   └── page.tsx     # Bảng giá
│   │   ├── order/
│   │   │   └── create/
│   │   │       └── page.tsx # Form tạo đơn
│   │   └── dashboard/
│   ├── (admin)/             # Layout admin
│   └── api/
├── components/
│   ├── ui/                  # shadcn components
│   ├── landing/
│   ├── order/
│   └── shared/
├── lib/
└── styles/
Bây giờ tôi sẽ cung cấp code cho ba trang quan trọng.

📄 1. Landing Page (app/(customer)/page.tsx)
tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Clock, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Genshin<span className="text-amber-400">Flow</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Dịch vụ Genshin Impact chuyên nghiệp - Uy tín, an toàn, minh bạch.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/services">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Xem dịch vụ <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/order/create">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Đặt đơn ngay
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Điểm mạnh */}
      <section className="max-w-6xl mx-auto py-20 px-4 grid md:grid-cols-3 gap-8">
        {[
          { icon: ShieldCheck, title: "Bảo mật tuyệt đối", desc: "Mã hóa thông tin tài khoản, chỉ admin mới có thể xem." },
          { icon: Clock, title: "Xử lý nhanh chóng", desc: "Thời gian hoàn thành trung bình chỉ 2-4 giờ." },
          { icon: Zap, title: "Dịch vụ đa dạng", desc: "Từ La Hoàn, Farm đến săn event – tất cả trong một nền tảng." },
        ].map((item, idx) => (
          <div key={idx} className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
            <item.icon className="h-12 w-12 text-blue-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA cuối */}
      <section className="bg-blue-900 text-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Sẵn sàng nâng tầm trải nghiệm Genshin?</h2>
        <p className="text-blue-200 mb-8">Nạp tiền lần đầu được tặng 10% giá trị nạp.</p>
        <Link href="/dashboard/deposit">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            Nạp tiền ngay
          </Button>
        </Link>
      </section>
    </main>
  );
}
📑 2. Trang Bảng giá (app/(customer)/services/page.tsx)
Sử dụng mock data.

tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const services = [
  { id: 1, name: "La Hoàn Thâm Cảnh", desc: "36 sao chế độ khó", price: 150000, oldPrice: 200000, category: "Endgame", popular: true },
  { id: 2, name: "Nhà Hát Giả Tưởng", desc: "Hoàn thành độ khó Siêu Khó", price: 120000, oldPrice: null, category: "Endgame" },
  { id: 3, name: "Farm Thánh Di Vật (tuần)", desc: "Farm tối ưu cho 1 tuần", price: 80000, oldPrice: null, category: "Farm" },
  // Thêm nhiều dịch vụ khác...
];

export default function ServicesPage() {
  return (
    <main className="max-w-7xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-12">Bảng giá dịch vụ</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((s) => (
          <Card key={s.id} className="relative hover:shadow-lg transition">
            {s.popular && <Badge className="absolute top-4 right-4 bg-amber-500 text-black">Phổ biến</Badge>}
            <CardHeader>
              <CardTitle className="text-2xl">{s.name}</CardTitle>
              <p className="text-gray-500">{s.desc}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-blue-700">{s.price.toLocaleString()}đ</span>
                {s.oldPrice && (
                  <span className="text-lg text-gray-400 line-through">{s.oldPrice.toLocaleString()}đ</span>
                )}
              </div>
              <Link href={`/order/create?service=${s.id}`}>
                <Button className="w-full">Đặt ngay</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
📝 3. Form Tạo đơn – Tập trung UI/UX bảo mật (app/(customer)/order/create/page.tsx)
Đây là phần quan trọng nhất. Form sẽ có các bước, sử dụng react-hook-form + zod. Tôi sẽ code phần "Thông tin đăng nhập tạm thời" với UI bảo mật.

tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useState } from "react";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

const orderSchema = z.object({
  uid: z.string().length(9, "UID phải có 9 chữ số").regex(/^\d+$/, "UID chỉ chứa số"),
  server: z.enum(["Asia", "Europe", "America", "TW/HK/MO"]),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirmRisk: z.literal(true, { errorMap: () => ({ message: "Bạn phải đồng ý để tiếp tục" }) }),
  note: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function CreateOrderPage() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { confirmRisk: false },
  });

  function onSubmit(values: OrderFormValues) {
    // sau này gọi API
    console.log(values);
    alert("Tạo đơn thành công (mô phỏng)");
  }

  return (
    <main className="max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Tạo đơn dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Bước 1: Thông tin tài khoản game */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">1. Thông tin tài khoản Genshin</h3>
                <FormField control={form.control} name="uid" render={({ field }) => (
                  <FormItem>
                    <FormLabel>UID</FormLabel>
                    <FormControl><Input placeholder="Nhập UID (9 số)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="server" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server</FormLabel>
                    <FormControl>
                      <select className="w-full border rounded-md p-2" {...field}>
                        <option value="">Chọn server</option>
                        <option value="Asia">Asia</option>
                        <option value="Europe">Europe</option>
                        <option value="America">America</option>
                        <option value="TW/HK/MO">TW/HK/MO</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Bước 2: Thông tin đăng nhập tạm thời - SIÊU BẢO MẬT */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                  2. Thông tin đăng nhập tạm thời
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                  <p className="font-semibold mb-2">⚠️ Cảnh báo bảo mật quan trọng:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Chỉ gửi mật khẩu <strong>tài khoản game</strong>, không gửi mật khẩu email hoặc mã backup.</li>
                    <li>Hãy <strong>đổi mật khẩu tạm thời</strong> trước khi gửi và đổi lại ngay sau khi đơn hoàn tất.</li>
                    <li>Mật khẩu của bạn sẽ được mã hóa và chỉ hiển thị cho admin khi cần thiết, có ghi log.</li>
                    <li>Chúng tôi không lưu mật khẩu vĩnh viễn; dữ liệu sẽ tự động bị xóa sau khi hoàn thành.</li>
                  </ul>
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email / Tài khoản đăng nhập game</FormLabel>
                    <FormControl><Input placeholder="example@gmail.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu Genshin (tạm thời)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới thay đổi"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Không sử dụng mật khẩu email chính. Hãy tạo mật khẩu riêng cho lần này.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="confirmRisk" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Tôi đã đọc, hiểu rõ rủi ro và đồng ý với <a href="#" className="underline text-blue-700">Điều khoản dịch vụ</a>.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />
              </div>

              {/* Bước 3: Ghi chú thêm */}
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú cho admin (không bắt buộc)</FormLabel>
                  <FormControl><Input placeholder="Yêu cầu cụ thể..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white" size="lg">
                Xác nhận và tạo đơn (trừ tiền trong ví)
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}