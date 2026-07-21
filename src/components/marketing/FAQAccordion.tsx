"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GradientText } from "@/components/animations/GradientText";
import { Reveal } from "@/components/animations/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface FaqItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  heading: string;
  subheading?: string;
  items: FaqItem[];
  defaultOpen?: number;
  className?: string;
}

export function FAQAccordion({
  heading,
  subheading,
  items,
  defaultOpen,
  className,
}: FAQAccordionProps) {
  const initialValue = useMemo<string | undefined>(() => {
    if (defaultOpen === undefined || defaultOpen < 0) return undefined;
    return `faq-${defaultOpen}`;
  }, [defaultOpen]);

  const [open, setOpen] = useState<string | undefined>(initialValue);

  return (
    <section
      className={cn(
        "relative w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            <GradientText>{heading}</GradientText>
          </h2>
          {subheading ? (
            <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
              {subheading}
            </p>
          ) : null}
        </Reveal>

        <motion.div
          className="mt-10 space-y-3"
          variants={staggerContainer}
          initial="hidden"
          viewport={{ once: true, margin: "-10% 0px" }}
          whileInView="visible"
        >
          {items.map((item, idx) => {
            const value = `faq-${idx}`;
            const isOpen = open === value;

            return (
              <motion.div
                key={value}
                variants={staggerItem}
                className={cn(
                  "group rounded-xl border bg-card/40 px-5 backdrop-blur-sm transition-all duration-300 sm:px-6",
                  isOpen
                    ? "border-brand-blue/40 bg-card/70 shadow-lg dark:border-brand-amber/40"
                    : "border-border/60 hover:border-brand-blue/30 hover:bg-card/60 dark:hover:border-brand-amber/30"
                )}
              >
                <Accordion
                  value={open ? [open] : []}
                  onValueChange={(next) => {
                    const first = Array.isArray(next) ? next[0] : next;
                    setOpen(typeof first === "string" ? first : undefined);
                  }}
                >
                  <AccordionItem value={value} className="border-0">
                    <AccordionTrigger className="gap-3 py-5 text-left text-base font-semibold text-foreground hover:no-underline sm:text-lg">
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all",
                            isOpen
                              ? "border-brand-blue bg-brand-blue/10 text-brand-blue dark:border-brand-amber dark:bg-brand-amber/15 dark:text-brand-amber"
                              : "border-border text-muted-foreground group-hover:border-brand-blue group-hover:text-brand-blue dark:group-hover:border-brand-amber dark:group-hover:text-brand-amber"
                          )}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">{item.question}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 pl-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default FAQAccordion;
