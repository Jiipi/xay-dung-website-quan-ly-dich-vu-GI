"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Wallet,
  Copy,
  Check,
  QrCode,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, QUICK_DEPOSIT_AMOUNTS } from "@/lib/constants";

export default function CustomerDepositPage() {
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [qrDetails, setQrDetails] = useState<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    content: string;
    amount: number;
    qrUrl: string;
    checkoutUrl?: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch current user and dynamic balance
  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setBalance(data.user.balance);
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin số dư ví:", e);
    }
  };

  useEffect(() => {
    // Fetch khi mount (pattern client hợp lệ; fix triệt để = Server Component, P2-8).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBalance();
  }, []);

  // Polling payment status every 3 seconds
  useEffect(() => {
    if (!qrDetails) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposit/status/${qrDetails.id}`);
        const data = await res.json();

        if (data.success) {
          if (data.status === "completed") {
            toast.success(`Nạp thành công ${formatCurrency(data.amount)} vào ví!`);
            fetchBalance();
            setQrDetails(null);
            setAmount("");
            clearInterval(interval);
          } else if (data.status === "expired" || data.status === "cancelled") {
            toast.error("Yêu cầu thanh toán đã hết hạn hoặc bị hủy.");
            setQrDetails(null);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Lỗi polling kiểm tra nạp tiền:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [qrDetails]);

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10000) {
      toast.error("Số tiền tối thiểu nạp là 10.000đ");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (data.success) {
        const intent = data.paymentIntent;
        setQrDetails({
          id: intent.id,
          bankName: intent.bankName,
          accountNumber: intent.accountNumber,
          accountName: intent.accountName,
          content: intent.content,
          amount: intent.amount,
          qrUrl: intent.qrCodeUrl,
          checkoutUrl: intent.checkoutUrl,
        });
        toast.success("Tạo mã VietQR nạp tiền thành công!");
      } else {
        toast.error(data.error || "Không thể tạo yêu cầu thanh toán");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra kết nối với máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDevDeposit = async () => {
    if (!qrDetails) return;
    setLoading(true);
    try {
      const res = await fetch("/api/deposits/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: qrDetails.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Giả lập nạp tiền tự động thành công!");
        fetchBalance();
        setQrDetails(null);
        setAmount("");
      } else {
        toast.error(data.error || "Giả lập nạp tiền thất bại");
      }
    } catch {
      toast.error("Lỗi khi kết nối tới API giả lập");
    } finally {
      setLoading(false);
    }
  };

  const handleResetIntent = () => {
    setQrDetails(null);
    setAmount("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nạp tiền vào ví</h1>
        <p className="text-muted-foreground text-sm">
          Sử dụng VietQR quét mã chuyển khoản nhanh 24/7 tự động cộng số dư ví.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Input Form / QR info */}
        {!qrDetails ? (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tạo mã nạp tiền</CardTitle>
              <CardDescription>
                Nhập số tiền hoặc chọn mệnh giá nạp nhanh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateIntent} className="space-y-6">
                {/* Balance display */}
                <div className="p-4 rounded-xl bg-muted/40 border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Wallet className="h-4 w-4 text-amber-500" />
                    Số dư hiện tại
                  </div>
                  <span className="font-bold text-lg">
                    {formatCurrency(balance)}
                  </span>
                </div>

                {/* Amount selection */}
                <div className="space-y-3">
                  <Label>Mệnh giá nạp nhanh</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_DEPOSIT_AMOUNTS.map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant={amount === val ? "default" : "outline"}
                        onClick={() => handleQuickAmount(val)}
                        className="text-xs"
                      >
                        {formatCurrency(val)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Hoặc nhập số tiền tùy chọn (đ)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Ví dụ: 50,000"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    min={10000}
                    className="font-semibold text-base"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    * Hạn mức tối thiểu nạp: 10,000đ
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tạo mã quét QR
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Thông tin chuyển khoản</CardTitle>
              <CardDescription>
                Thực hiện chuyển khoản chính xác nội dung bên dưới
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Bank */}
                <div>
                  <span className="text-xs text-muted-foreground block">Ngân hàng</span>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-sm">{qrDetails.bankName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(qrDetails.bankName, "Ngân hàng")}
                      className="h-7 w-7 p-0"
                    >
                      {copiedField === "Ngân hàng" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <span className="text-xs text-muted-foreground block">Số tài khoản</span>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-sm">{qrDetails.accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(qrDetails.accountNumber, "Số tài khoản")}
                      className="h-7 w-7 p-0"
                    >
                      {copiedField === "Số tài khoản" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <span className="text-xs text-muted-foreground block">Tên tài khoản</span>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-sm">{qrDetails.accountName}</span>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <span className="text-xs text-muted-foreground block">Số tiền</span>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-base text-primary">
                      {formatCurrency(qrDetails.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(String(qrDetails.amount), "Số tiền")}
                      className="h-7 w-7 p-0"
                    >
                      {copiedField === "Số tiền" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <span className="text-xs text-muted-foreground block">Nội dung chuyển khoản</span>
                  <div className="flex items-center justify-between border border-dashed border-amber-500/50 bg-amber-500/5 p-3 rounded-lg">
                    <span className="font-bold text-amber-500 tracking-wider text-sm">
                      {qrDetails.content}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(qrDetails.content, "Nội dung chuyển khoản")}
                      className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                    >
                      {copiedField === "Nội dung chuyển khoản" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {qrDetails.checkoutUrl && (
                <div className="pt-2">
                  <a href={qrDetails.checkoutUrl} target="_blank" rel="noreferrer">
                    <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold">
                      <ExternalLink className="h-4 w-4" /> Thanh toán trực tuyến (payOS)
                    </Button>
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" className="w-full text-xs" onClick={handleResetIntent}>
                  Tạo mã khác
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Right: VietQR Code display / Warning instructions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Mã quét VietQR</CardTitle>
            <CardDescription>
              Quét mã bằng ví điện tử hoặc ứng dụng ngân hàng di động
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
            {qrDetails ? (
              <div className="relative p-3 border border-border/80 bg-white rounded-2xl flex flex-col items-center">
                {/* Real Dynamic QR Image */}
                <div className="w-[200px] h-[200px] bg-white flex items-center justify-center rounded-xl relative border overflow-hidden p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDetails.qrUrl} alt="VietQR PayOS" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
                    Đang đợi thanh toán...
                  </span>
                </div>

                <div className="w-full mt-3 pt-3 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateDevDeposit}
                    disabled={loading}
                    className="w-full text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-bold"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "⚡ Giả lập nạp tiền tự động (Dev Test)"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground text-center border border-dashed rounded-xl w-full">
                <QrCode className="h-16 w-16 stroke-1 mb-2" />
                <span className="text-xs">Chưa tạo yêu cầu thanh toán.</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-2 border-t pt-4 w-full">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p>
                  <strong>QUAN TRỌNG:</strong> Chuyển khoản đúng nội dung và số tiền
                  hệ thống cung cấp.
                </p>
              </div>
              <p>* Số dư được cập nhật tự động sau 1-3 phút khi ngân hàng nhận tiền.</p>
              <p>* Liên hệ hỗ trợ nếu quá 15 phút chưa được cộng tiền vào tài khoản.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
