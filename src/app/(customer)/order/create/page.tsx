"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  Swords,
  Coins,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { createOrderAction } from "@/modules/orders/actions";
import { formatCurrency, GAME_SERVERS } from "@/lib/constants";

interface PriceOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  isActive: boolean;
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  priceOptions: PriceOption[];
}

const STEPS = [
  { num: 1, label: "Gói cước" },
  { num: 2, label: "Tài khoản" },
  { num: 3, label: "Bảo mật" },
  { num: 4, label: "Xác nhận" },
];

function OrderWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("service") || "";

  // Dynamic state loaded from API
  const [services, setServices] = useState<ServiceData[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);

  // Wizard Steps
  const [step, setStep] = useState(1);

  // Form Fields
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [uid, setUid] = useState("");
  const [server, setServer] = useState("");
  const [gameEmail, setGameEmail] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [note, setNote] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [svcRes, meRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/auth/me"),
        ]);
        const svcData = await svcRes.json();
        if (svcData.success) setServices(svcData.services);
        const meData = await meRes.json();
        if (meData.success) setBalance(meData.user.balance);
      } catch (err) {
        console.error("Lỗi tải dữ liệu tạo đơn:", err);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      const svcParam = searchParams.get("service") || "";
      const optParam = searchParams.get("option") || "";

      const targetSvc = services.find((s) => s.id === svcParam) || services[0];
      if (targetSvc) {
        setSelectedServiceId(targetSvc.id);
        const targetOpt = targetSvc.priceOptions.find((o) => o.id === optParam) || targetSvc.priceOptions[0];
        if (targetOpt) {
          setSelectedOptionId(targetOpt.id);
        }
      }
    }
  }, [services, searchParams]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedOption = selectedService?.priceOptions.find(
    (opt) => opt.id === selectedOptionId
  );

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedServiceId) {
        toast.error("Vui lòng chọn dịch vụ");
        return;
      }
      if (selectedService?.priceOptions && selectedService.priceOptions.length > 0 && !selectedOptionId) {
        toast.error("Vui lòng chọn gói cước");
        return;
      }
    }
    if (step === 2) {
      if (!uid || uid.length !== 9 || !/^\d+$/.test(uid)) {
        toast.error("UID game phải chứa đúng 9 chữ số");
        return;
      }
      if (!server) {
        toast.error("Vui lòng chọn Server game");
        return;
      }
    }
    if (step === 3) {
      if (!gameEmail.trim()) {
        toast.error("Vui lòng nhập email hoặc tài khoản đăng nhập game");
        return;
      }
      if (!gamePassword || gamePassword.length < 6) {
        toast.error("Mật khẩu game tạm thời tối thiểu 6 ký tự");
        return;
      }
      if (!agreed) {
        toast.error("Bạn phải đồng ý với cảnh báo bảo mật và điều khoản");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; description?: string } | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleValidateCoupon = async () => {
    if (!couponCodeInput.trim() || !selectedOption) return;
    try {
      setValidatingCoupon(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          orderAmount: selectedOption.price,
          serviceId: selectedServiceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        toast.success(`Đã áp dụng mã ${data.coupon.code}! Giảm ${formatCurrency(data.discountAmount)}`);
      } else {
        toast.error(data.error || "Mã giảm giá không hợp lệ");
      }
    } catch {
      toast.error("Lỗi khi kiểm tra mã giảm giá");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedServiceId || !selectedOptionId || !uid || !server || !gameEmail || !gamePassword) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await createOrderAction({
        serviceId: selectedServiceId,
        priceOptionId: selectedOptionId,
        uid,
        server,
        note: note.trim() || undefined,
        gameEmail,
        gamePasswordPlain: gamePassword,
        couponCode: appliedCoupon?.code,
      });

      if (res.success) {
        toast.success("Tạo đơn hàng và tạm giữ ví thành công!");
        router.refresh();
        router.push("/dashboard/orders");
      } else {
        toast.error(res.error || "Tạo đơn hàng thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (servicesLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-muted-foreground text-sm">Đang tải danh sách gói dịch vụ...</span>
      </div>
    );
  }

  const price = selectedOption?.price ?? 0;
  const remaining = balance !== null ? balance - price : null;
  const insufficient = balance !== null && price > 0 && balance < price;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo đơn dịch vụ</h1>
        <p className="text-muted-foreground text-sm">
          Hoàn tất 4 bước — thanh toán bằng số dư ví. Thông tin tài khoản được mã hóa AES-256-GCM.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Wizard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stepper Indicator */}
          <div className="flex items-center justify-between">
            {STEPS.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1 relative">
                {s.num < 4 && (
                  <div
                    className={`absolute top-4 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] h-0.5 ${
                      step > s.num ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 1 && "Chọn gói dịch vụ"}
                {step === 2 && "Thông tin tài khoản game"}
                {step === 3 && "Thông tin đăng nhập tạm thời"}
                {step === 4 && "Xác nhận đơn hàng"}
              </CardTitle>
              <CardDescription>
                Bước {step}/4:{" "}
                {step === 1 && "Lựa chọn gói dịch vụ cần hỗ trợ"}
                {step === 2 && "Cung cấp UID và Server game của bạn"}
                {step === 3 && "Nhập thông tin đăng nhập game tạm thời"}
                {step === 4 && "Xác nhận lại chi tiết và tạo đơn"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* STEP 1: SELECT SERVICE & OPTION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chọn dịch vụ game</Label>
                    <Select
                      key={`select-svc-${selectedServiceId || "empty"}`}
                      value={selectedServiceId}
                      onValueChange={(val) => {
                        if (val) {
                          setSelectedServiceId(val);
                          const newSvc = services.find((s) => s.id === val);
                          if (newSvc && newSvc.priceOptions.length > 0) {
                            setSelectedOptionId(newSvc.priceOptions[0].id);
                          } else {
                            setSelectedOptionId("");
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Bấm vào để chọn dịch vụ">
                          {selectedService ? selectedService.name : "Bấm vào để chọn dịch vụ"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedService && (
                    <div className="space-y-3 pt-2">
                      <Label>Chọn gói cước cụ thể</Label>
                      <div className="grid gap-2">
                        {selectedService.priceOptions.map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={`flex items-center justify-between p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedOptionId === opt.id
                                ? "border-primary bg-primary/5"
                                : "border-border/50 bg-card hover:bg-muted/30"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm">{opt.name}</p>
                              {opt.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {opt.description}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-sm text-primary">
                              {formatCurrency(opt.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Ghi chú & Yêu cầu cụ thể */}
                      <div className="space-y-2 pt-3 border-t border-border/50">
                        <Label htmlFor="wiz-note" className="flex items-center gap-1.5 font-semibold">
                          <span>Ghi chú & Yêu cầu (Tên Nhân vật, Vũ khí, Lưu ý...)</span>
                          <span className="text-xs text-muted-foreground font-normal">(Không bắt buộc)</span>
                        </Label>
                        <Textarea
                          id="wiz-note"
                          placeholder={
                            selectedService.name.toLowerCase().includes("roll")
                              ? "Ví dụ: Roll Banner Nhân vật Raiden Shogun hoặc Vũ khí Trảm Ma Tối Cường..."
                              : "Nhập tên nhân vật, vũ khí, đội hình hoặc lưu ý đặc biệt dành cho Booster..."
                          }
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="bg-background border-border/80 min-h-[80px] text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          💡 Điền tên Nhân vật / Vũ khí cần roll hoặc các yêu cầu riêng để Booster hỗ trợ tốt nhất.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: UID & SERVER */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wiz-uid">UID nhân vật game (9 số)</Label>
                    <Input
                      id="wiz-uid"
                      placeholder="Nhập 9 số UID trong game"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Server game</Label>
                    <Select value={server} onValueChange={(val) => { if (val) setServer(val); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn server nhân vật" />
                      </SelectTrigger>
                      <SelectContent>
                        {GAME_SERVERS.map((srv) => (
                          <SelectItem key={srv.value} value={srv.value}>
                            {srv.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wiz-note">Ghi chú cho Admin (nếu có)</Label>
                    <Input
                      id="wiz-note"
                      placeholder="Yêu cầu đội hình, khung giờ đăng nhập..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: TEMPORARY GAME CREDENTIALS */}
              {step === 3 && (
                <div className="space-y-4">
                  <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="h-5 w-5" />
                    <AlertTitle className="font-semibold text-sm">Cảnh báo bảo mật quan trọng</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed mt-1">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Chỉ cung cấp mật khẩu <strong>tài khoản game</strong> (không đưa mật khẩu email hay mã backup).</li>
                        <li>Vui lòng <strong>đổi sang mật khẩu tạm thời</strong> trước khi gửi, và đổi lại ngay sau khi hoàn tất.</li>
                        <li>Mật khẩu của bạn được mã hóa hai chiều bằng <strong>AES-256-GCM</strong> bảo vệ nghiêm ngặt.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="wiz-game-email">Tài khoản / Email đăng nhập game</Label>
                    <Input
                      id="wiz-game-email"
                      placeholder="Tên đăng nhập hoặc email liên kết game"
                      value={gameEmail}
                      onChange={(e) => setGameEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wiz-game-pass">Mật khẩu game (tạm thời)</Label>
                    <div className="relative">
                      <Input
                        id="wiz-game-pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu game tạm thời"
                        value={gamePassword}
                        onChange={(e) => setGamePassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="wiz-agree"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(v === true)}
                    />
                    <label
                      htmlFor="wiz-agree"
                      className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      Tôi xác nhận đã đọc kỹ cảnh báo bảo mật, tự chịu trách nhiệm rủi ro liên quan đến điều khoản chia sẻ tài khoản của nhà phát hành game.
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY & CONFIRMATION */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 overflow-hidden divide-y divide-border">
                    <div className="p-4 flex justify-between gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Dịch vụ</span>
                        <span className="font-semibold text-sm">{selectedService?.name}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          Gói: {selectedOption?.name}
                        </span>
                      </div>
                      <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-muted-foreground block">UID Game</span>
                        <span className="font-semibold text-sm">{uid}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Server</span>
                        <span className="font-semibold text-sm">{server}</span>
                      </div>
                    </div>

                    {/* Coupon Input Box */}
                    <div className="p-4 bg-muted/20 border-t border-border">
                      <Label className="text-xs font-semibold block mb-2">Mã Giảm Giá / Voucher (nếu có)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ví dụ: GFWELCOME10"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="text-xs uppercase font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleValidateCoupon}
                          disabled={validatingCoupon || !couponCodeInput.trim()}
                          className="shrink-0 font-semibold text-xs"
                        >
                          {validatingCoupon ? "..." : "Áp dụng"}
                        </Button>
                      </div>
                      {appliedCoupon && (
                        <p className="text-xs text-emerald-500 font-semibold mt-1.5 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Đã áp dụng mã {appliedCoupon.code} (-{formatCurrency(discountAmount)})
                        </p>
                      )}
                    </div>

                    <div className="p-4 flex items-center justify-between bg-primary/5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Coins className="h-4 w-4 text-amber-500" />
                        Tổng thanh toán thực tế (trừ ví)
                      </div>
                      <div className="text-right">
                        {discountAmount > 0 && selectedOption && (
                          <span className="text-xs text-muted-foreground line-through block">
                            {formatCurrency(selectedOption.price)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-primary">
                          {selectedOption ? formatCurrency(selectedOption.price - discountAmount) : "0đ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Dữ liệu tài khoản của bạn được mã hóa an toàn
                  </div>
                </div>
              )}

              {/* Nav Controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={handlePrevStep} disabled={submitLoading}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => router.push("/services")} disabled={submitLoading}>
                    Hủy
                  </Button>
                )}

                {step < 4 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Tiếp tục <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmitOrder} disabled={submitLoading || insufficient} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xác nhận & Thanh toán
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Order summary */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-24 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" /> Tóm tắt đơn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Dịch vụ</span>
                <span className="font-medium text-right">{selectedService?.name || "Chưa chọn"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Gói cước</span>
                <span className="font-medium text-right">{selectedOption?.name || "—"}</span>
              </div>
              {note.trim() && (
                <div className="flex flex-col gap-1 text-xs pt-1">
                  <span className="text-muted-foreground font-medium">Ghi chú / Yêu cầu:</span>
                  <p className="bg-muted/40 p-2 rounded border border-border/60 text-foreground font-normal break-words">
                    {note.trim()}
                  </p>
                </div>
              )}
              {(uid || server) && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">UID / Server</span>
                  <span className="font-medium text-right">
                    {uid || "—"}{server ? ` • ${server}` : ""}
                  </span>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số dư ví</span>
                  <span className="font-semibold">
                    {balance !== null ? formatCurrency(balance) : "…"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thanh toán</span>
                  <span className="font-bold text-primary">
                    {price > 0 ? formatCurrency(price) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Còn lại sau khi trừ</span>
                  <span className={insufficient ? "font-semibold text-rose-500" : "font-semibold"}>
                    {remaining !== null && price > 0 ? formatCurrency(remaining) : "—"}
                  </span>
                </div>
              </div>

              {insufficient && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  Số dư không đủ để thanh toán gói này.{" "}
                  <Link href="/dashboard/deposit" className="underline font-semibold">
                    Nạp thêm tiền
                  </Link>
                  .
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-muted-foreground border-t pt-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Thông tin đăng nhập game được mã hóa AES-256-GCM; chỉ admin xem khi cần và đều được ghi log.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-muted-foreground text-sm">
          Đang tải thông tin dịch vụ...
        </div>
      }
    >
      <OrderWizardContent />
    </Suspense>
  );
}
