"use client"

import { motion } from "framer-motion"
import { Award, Heart, Shield, Target, type LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { TiltCard } from "@/components/animations/TiltCard"
import { staggerContainer, staggerItem } from "@/lib/motion"

interface ValueItem {
  iconName: "award" | "shield" | "heart" | "target"
  title: string
  desc: string
  color: string
  bg: string
}

const VALUES: ValueItem[] = [
  {
    iconName: "award",
    title: "Chất lượng",
    desc: "Mỗi đơn hàng đều được xử lý bởi booster tuyển chọn, đảm bảo kết quả chuẩn xác theo meta hiện tại.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    iconName: "shield",
    title: "Tin cậy",
    desc: "Cam kết bảo mật AES-256, sổ cái ví bất biến và đội ngũ hỗ trợ 24/7 — minh bạch từng giao dịch.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    iconName: "heart",
    title: "Hỗ trợ",
    desc: "Đội ngũ CSKH thân thiện, phản hồi trong vài phút. Không để khách hàng chờ đợi.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    iconName: "target",
    title: "Minh bạch",
    desc: "Mọi chi phí, chính sách hoàn tiền và điều khoản đều công khai. Không có phí ẩn.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
]

const ICON_MAP: Record<ValueItem["iconName"], LucideIcon> = {
  award: Award,
  shield: Shield,
  heart: Heart,
  target: Target,
}

export function AboutValues() {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView="visible"
    >
      {VALUES.map((v) => {
        const Icon = ICON_MAP[v.iconName]
        return (
          <motion.div key={v.title} variants={staggerItem}>
            <TiltCard maxRotation={5} className="h-full">
              <Card className="tilt-card group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-brand transition-transform duration-500 group-hover:scale-x-100"
                />
                <CardContent className="p-6">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${v.color}`} aria-hidden />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
