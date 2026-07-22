"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Layout, Loader2 } from "lucide-react";

export default function AdminPagesContentPage() {
  const [selectedPage, setSelectedPage] = useState("terms");
  const [pageContent, setPageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPageContent = useCallback(async (pageName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages?pageName=${pageName}`);
      const data = await res.json();
      if (data.success) {
        setPageContent(data.content || "");
      }
    } catch {
      toast.error("Lỗi khi tải nội dung trang");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageContent(selectedPage);
  }, [selectedPage, fetchPageContent]);

  const handlePageChange = (val: string | null) => {
    if (!val) return;
    setSelectedPage(val);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageName: selectedPage, content: pageContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Cập nhật nội dung trang ${selectedPage} thành công!`);
      } else {
        toast.error(data.error || "Không thể lưu nội dung trang");
      }
    } catch {
      toast.error("Lỗi mạng khi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý nội dung tĩnh</h1>
        <p className="text-slate-400 text-sm">
          Thay đổi nội dung văn bản Markdown các trang Điều khoản, FAQ, Chính sách hoàn tiền.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Layout className="h-5 w-5 text-amber-500" /> Biên tập trang tĩnh
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Hỗ trợ viết mã định dạng bằng cú pháp Markdown chuẩn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveContent} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Chọn trang cần chỉnh sửa</Label>
              <Select value={selectedPage} onValueChange={handlePageChange}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="terms">Trang điều khoản dịch vụ (Terms)</SelectItem>
                  <SelectItem value="privacy">Trang chính sách bảo mật (Privacy)</SelectItem>
                  <SelectItem value="refund">Trang chính sách hoàn tiền (Refund)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-content-area" className="text-slate-300">Biên tập nội dung (Markdown)</Label>
              <Textarea
                id="page-content-area"
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                rows={12}
                className="bg-slate-900 border-slate-800 text-slate-100 font-mono text-xs leading-relaxed"
              />
            </div>

            <Button type="submit" disabled={saving || loading} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Save className="h-4 w-4" />}
              Lưu và cập nhật trang
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
