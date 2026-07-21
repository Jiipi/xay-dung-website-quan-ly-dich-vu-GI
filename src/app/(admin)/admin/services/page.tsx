"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { formatCurrency, SERVICE_CATEGORIES } from "@/lib/constants";

interface PriceOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  isActive: boolean;
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  priceOptions: PriceOption[];
}

export default function AdminServicesCRUDPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("la-hoan");
  const [formPrice, setFormPrice] = useState<number | "">("");

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách dịch vụ admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch khi mount (pattern client hợp lệ; fix triệt để = Server Component, P2-8).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServices();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingService(null);
    setFormName("");
    setFormDesc("");
    setFormCat("la-hoan");
    setFormPrice("");
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (svc: ServiceData) => {
    setEditingService(svc);
    setFormName(svc.name);
    setFormDesc(svc.description || "");
    setFormCat(svc.category);
    setFormPrice(svc.priceOptions[0]?.price || 0);
    setDialogOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ");
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      toast.error("Vui lòng nhập giá dịch vụ hợp lệ");
      return;
    }

    setLoading(true);

    try {
      if (editingService) {
        // Tạm thời hiển thị edit tĩnh
        toast.info("Chức năng cập nhật dịch vụ đang nâng cấp!");
        setDialogOpen(false);
      } else {
        // Gọi API tạo mới
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            category: formCat,
            description: formDesc,
            priceOptions: [
              { name: "Gói cước cơ bản", price: Number(formPrice) }
            ]
          }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Tạo dịch vụ mới thành công!");
          setDialogOpen(false);
          fetchServices();
        } else {
          toast.error(data.error || "Không thể tạo dịch vụ");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý danh mục & giá</h1>
          <p className="text-slate-400 text-sm">
            Tạo thêm gói cày thuê La Hoàn, làm nhiệm vụ gacha, nâng cấp vũ khí cho khách.
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
          <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm dịch vụ theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List Table */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-0">
          {loading && services.length === 0 ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy dịch vụ nào.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="pl-6 text-slate-400">Dịch vụ cày thuê</TableHead>
                    <TableHead className="text-slate-400">Danh mục</TableHead>
                    <TableHead className="text-slate-400">Gói cước</TableHead>
                    <TableHead className="text-slate-400">Giá cơ bản</TableHead>
                    <TableHead className="text-slate-400">Trạng thái</TableHead>
                    <TableHead className="pr-6 text-right w-[150px] text-slate-400">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-900 border-slate-800">
                      <TableCell className="pl-6 font-semibold text-slate-200">
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {SERVICE_CATEGORIES.find(c => c.id === s.category)?.name || s.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {s.priceOptions.length} gói cước
                      </TableCell>
                      <TableCell className="font-bold text-xs text-amber-500">
                        {formatCurrency(s.priceOptions[0]?.price || 0)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          s.isActive ? "text-emerald-500" : "text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            s.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                          }`} />
                          {s.isActive ? "Hiển thị" : "Đã ẩn"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(s)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingService ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Thiết lập thông tin hiển thị và giá cước cho gói dịch vụ cày thuê.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveService} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Tên dịch vụ</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: La Hoàn Thâm Cảnh 36 Sao"
                required
                className="bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Danh mục</Label>
                <Select value={formCat} onValueChange={(val) => { if (val) setFormCat(val); }}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {SERVICE_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Giá cơ bản (đ)</Label>
                <Input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ví dụ: 150000"
                  required
                  className="bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Mô tả ngắn dịch vụ</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Chi tiết các yêu cầu, phần thưởng nhận được..."
                className="bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50 min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-800 text-slate-300">
                Hủy
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Lưu dịch vụ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
