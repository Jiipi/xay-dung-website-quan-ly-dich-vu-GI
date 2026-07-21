"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Landmark, KeyRound, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("1023456789");
  const [accountName, setAccountName] = useState("Genshin77 ADMIN");

  const [payosClientId, setPayosClientId] = useState("sandbox_client_id_123456");
  const [payosApiKey, setPayosApiKey] = useState("sandbox_api_key_789012");
  const [payosChecksum, setPayosChecksum] = useState("sandbox_checksum_345678");

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Đã cập nhật thông tin ngân hàng nạp tiền VietQR!");
  };

  const handleSavePayos = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Đã cập nhật API Keys payOS Sandbox!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-slate-400 text-sm">
          Cấu hình cổng thanh toán payOS, ngân hàng thụ hưởng VietQR và cài đặt bảo mật.
        </p>
      </div>

      <Tabs defaultValue="bank" className="w-full">
        <TabsList className="bg-slate-950 border border-slate-800 grid grid-cols-2 max-w-xs mb-6">
          <TabsTrigger value="bank" className="data-[state=active]:bg-slate-900 text-xs">
            <Landmark className="h-4 w-4 mr-1.5" /> Ngân hàng
          </TabsTrigger>
          <TabsTrigger value="payos" className="data-[state=active]:bg-slate-900 text-xs">
            <KeyRound className="h-4 w-4 mr-1.5" /> payOS Keys
          </TabsTrigger>
        </TabsList>

        {/* Bank settings tab */}
        <TabsContent value="bank">
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-base text-slate-200">Cổng thanh toán thụ hưởng</CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Cài đặt tài khoản ngân hàng để tạo mã QR Code động cho khách nạp tiền
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="set-bank-name" className="text-slate-300">Tên ngân hàng</Label>
                  <Input
                    id="set-bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="set-bank-acc" className="text-slate-300">Số tài khoản</Label>
                    <Input
                      id="set-bank-acc"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="set-bank-user" className="text-slate-300">Tên chủ tài khoản (Không dấu)</Label>
                    <Input
                      id="set-bank-user"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
                  <Save className="h-4 w-4" /> Lưu cấu hình ngân hàng
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* payOS settings tab */}
        <TabsContent value="payos">
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-base text-slate-200">payOS Integration API Credentials</CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Thiết lập các chuỗi khóa bảo mật đồng bộ từ tài khoản payOS của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePayos} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="set-payos-client" className="text-slate-300">payOS Client ID</Label>
                  <Input
                    id="set-payos-client"
                    value={payosClientId}
                    onChange={(e) => setPayosClientId(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="set-payos-key" className="text-slate-300">payOS API Key</Label>
                  <Input
                    id="set-payos-key"
                    type="password"
                    value={payosApiKey}
                    onChange={(e) => setPayosApiKey(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="set-payos-checksum" className="text-slate-300">payOS Checksum Key</Label>
                  <Input
                    id="set-payos-checksum"
                    type="password"
                    value={payosChecksum}
                    onChange={(e) => setPayosChecksum(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
                  <Save className="h-4 w-4" /> Lưu thông tin API keys
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
