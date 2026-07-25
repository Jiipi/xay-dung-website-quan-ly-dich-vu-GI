import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right: Branding */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-hero overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center">
            <Logo iconClassName="h-12 w-12" textClassName="text-4xl" />
          </div>
          <p className="text-lg text-blue-100/70 max-w-sm mx-auto leading-relaxed">
            Nền tảng dịch vụ Genshin Impact chuyên nghiệp, bảo mật và minh bạch.
          </p>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { value: "AES-256", label: "Mã hóa" },
              { value: "500+", label: "Đơn hoàn thành" },
              { value: "24/7", label: "Hỗ trợ" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-xs text-blue-200/60 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
