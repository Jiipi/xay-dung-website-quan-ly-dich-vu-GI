"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FaqCategory {
  id: string;
  name: string;
  items: FaqItem[];
}

export interface FaqCategoriesProps {
  categories: FaqCategory[];
}

export function FaqCategories({ categories }: FaqCategoriesProps) {
  if (categories.length === 0) {
    return (
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 mt-12"
        variants={staggerContainer}
        initial="hidden"
        viewport={{ once: true, margin: "-10% 0px" }}
        whileInView="visible"
      >
        <motion.div variants={staggerItem}>
          <EmptyState
            icon={HelpCircle}
            title="Chưa có câu hỏi nào"
            description="Chúng tôi đang cập nhật các câu hỏi thường gặp. Vui lòng liên hệ để được hỗ trợ nhanh chóng."
            action={
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  Liên hệ hỗ trợ
                </Button>
              </Link>
            }
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.section
      className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 space-y-12"
      variants={staggerContainer}
      initial="hidden"
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView="visible"
    >
      {categories.map((category, catIdx) => (
        <motion.div
          key={category.id}
          id={category.id}
          variants={staggerItem}
        >
          <div className="flex items-center gap-3 mb-5">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 font-semibold"
            >
              Chủ đề {String(catIdx + 1).padStart(2, "0")}
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight">
              {category.name}
            </h2>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover-lift">
            <CardContent className="p-0">
              <Accordion className="w-full">
                {category.items.map((item) => {
                  const value = `${category.id}-${item.id}`;
                  return (
                    <AccordionItem
                      key={item.id}
                      value={value}
                      className="px-6 border-border/50 last:border-b-0 data-[state=open]:bg-muted/20 transition-colors"
                    >
                      <AccordionTrigger className="text-left font-medium py-5 hover:no-underline text-base">
                        <span className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {item.order}
                          </span>
                          <span>{item.question}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed pl-9">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.section>
  );
}