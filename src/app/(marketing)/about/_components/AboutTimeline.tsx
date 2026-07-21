"use client"

import { motion } from "framer-motion"

interface TimelineItem {
  year: string
  title: string
  desc: string
}

const TIMELINE: TimelineItem[] = [
  {
    year: "2024",
    title: "Genshin77 ra đời",
    desc: "Khởi đầu từ một nhóm booster nhỏ với mong muốn mang đến dịch vụ an toàn, minh bạch cho cộng đồng Genshin Impact Việt.",
  },
  {
    year: "2024 Q4",
    title: "Hoàn thiện nền tảng",
    desc: "Ra mắt hệ thống ví nội bộ, sổ cái bất biến, mã hóa AES-256 và 100 đơn hàng đầu tiên thành công.",
  },
  {
    year: "2025",
    title: "Mở rộng dịch vụ",
    desc: "Bổ sung Mở Map, Event, Roll hộ, Tùy chỉnh. Đạt mốc 500 khách hàng và 4.9★ đánh giá.",
  },
  {
    year: "2026",
    title: "Mốc 1000+ đơn hoàn thành",
    desc: "Trở thành nền tảng dịch vụ Genshin Impact uy tín #1 Việt Nam, mở rộng sang các phiên bản mới nhất.",
  },
]

export function AboutTimeline() {
  return (
    <div className="relative">
      <motion.span
        aria-hidden
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
        className="absolute left-[0.65rem] top-1 h-full w-[2px] bg-gradient-to-b from-amber-500 via-blue-500 to-amber-500 sm:left-[1.15rem]"
      />

      <ol className="space-y-10">
        {TIMELINE.map((item, idx) => (
          <motion.li
            key={item.year}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative pl-12 sm:pl-16"
          >
            <motion.span
              aria-hidden
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 240 }}
              className="absolute left-0 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-amber text-xs font-bold text-white shadow-lg ring-4 ring-background sm:left-2"
            >
              {idx + 1}
            </motion.span>
            <div className="mb-1 flex flex-wrap items-baseline gap-3">
              <span className="text-xl font-bold text-amber-500">{item.year}</span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
