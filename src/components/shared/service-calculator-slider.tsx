"use client";

import { useState } from "react";
import { Calculator, Sparkles, MapPin, Flame, Swords, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";

interface CalculatorOption {
  id: string;
  name: string;
  unit: string;
  basePricePerUnit: number;
  min: number;
  max: number;
  step: number;
  icon: React.ComponentType<{ className?: string }>;
}

const CALCULATOR_TYPES: CalculatorOption[] = [
  {
    id: "map-exploration",
    name: "Khám phá Map & Mở Rương (Natlan/Fontaine/Sumeru)",
    unit: "%",
    basePricePerUnit: 2500, // 1% = 2,500đ (100% = 250,000đ)
    min: 0,
    max: 100,
    step: 5,
    icon: MapPin,
  },
  {
    id: "oculus-farming",
    name: "Thu thập Thần Đồng (Hỏa/Thảo/Lôi/Nham/Phong)",
    unit: "Thần đồng",
    basePricePerUnit: 2000, // 1 Thần đồng = 2,000đ
    min: 10,
    max: 108,
    step: 1,
    icon: Flame,
  },
  {
    id: "relic-farming",
    name: "Farm Thánh Di Vật theo ngày (Tối ưu Resin)",
    unit: "ngày",
    basePricePerUnit: 12000, // 1 ngày = 12,000đ
    min: 1,
    max: 30,
    step: 1,
    icon: Swords,
  },
];

export function ServiceCalculatorSlider() {
  const [selectedType, setSelectedType] = useState<CalculatorOption>(CALCULATOR_TYPES[0]);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [targetValue, setTargetValue] = useState<number>(100);

  // Tính số lượng cần làm
  const neededUnits = Math.max(0, targetValue - currentValue);
  const totalPrice = neededUnits * selectedType.basePricePerUnit;

  const handleTypeChange = (type: CalculatorOption) => {
    setSelectedType(type);
    setCurrentValue(type.min);
    setTargetValue(type.max);
  };

  return (
    <Card className="border-amber-500/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-xl shadow-amber-500/5">
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-amber-900/20 border-b border-border/40 pb-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-amber-500/40 text-amber-500 gap-1.5 px-3 py-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Trình Tính Giá Động Tự Động
          </Badge>
          <Calculator className="w-6 h-6 text-amber-500" />
        </div>
        <CardTitle className="text-2xl font-extrabold mt-3">
          Ước Tính Chi Phí Dịch Vụ
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Kéo thanh slider để tính giá chính xác theo tiến độ hiện tại và mục tiêu mong muốn của bạn.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Selector cho loại dịch vụ */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
            1. Chọn loại dịch vụ cần tính giá:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CALCULATOR_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType.id === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 text-foreground font-bold shadow-md shadow-amber-500/10"
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? "text-amber-500" : ""}`} />
                  <span className="text-xs leading-snug">{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6 bg-muted/20 p-5 rounded-2xl border border-border/40">
          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-muted-foreground">
                Tiến độ hiện tại: <strong className="text-foreground">{currentValue} {selectedType.unit}</strong>
              </span>
              <span className="text-xs text-amber-500 font-mono">Min: {selectedType.min}</span>
            </div>
            <input
              type="range"
              min={selectedType.min}
              max={selectedType.max}
              step={selectedType.step}
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-muted-foreground">
                Mục tiêu mong muốn: <strong className="text-amber-500">{targetValue} {selectedType.unit}</strong>
              </span>
              <span className="text-xs text-amber-500 font-mono">Max: {selectedType.max}</span>
            </div>
            <input
              type="range"
              min={selectedType.min}
              max={selectedType.max}
              step={selectedType.step}
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Calculated Result Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Tổng khối lượng cần cày: <strong className="text-foreground">{neededUnits} {selectedType.unit}</strong>
            </span>
            <div className="text-3xl font-extrabold text-amber-500 mt-1">
              {formatCurrency(totalPrice)}
            </div>
          </div>

          <Link href="/services">
            <Button size="lg" className="font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20">
              Đặt Dịch Vụ Ngay
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
