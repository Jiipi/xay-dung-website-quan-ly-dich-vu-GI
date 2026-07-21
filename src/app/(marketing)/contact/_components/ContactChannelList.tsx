"use client";

import { Mail, MessageSquare, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { staggerContainer, staggerItem } from "@/lib/motion";

export type ContactChannelKey = "mail" | "zalo" | "discord";

export interface ContactChannel {
  iconName: ContactChannelKey;
  title: string;
  value: string;
  desc: string;
  href: string;
  color: string;
  bg: string;
}

const ICON_MAP: Record<ContactChannelKey, LucideIcon> = {
  mail: Mail,
  zalo: MessageSquare,
  discord: MessageSquare,
};

export function ContactChannelList({ channels }: { channels: ContactChannel[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView="visible"
      className="space-y-4"
    >
      {channels.map((ch) => {
        const Icon = ICON_MAP[ch.iconName] ?? Mail;
        return (
          <motion.a
            key={ch.title}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            variants={staggerItem}
          >
            <Card className="hover-lift border-border/50 h-full transition-all hover:border-primary/40">
              <CardContent className="p-5 flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl ${ch.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${ch.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold mb-0.5">{ch.title}</h3>
                  <p className="text-sm font-medium text-foreground truncate">
                    {ch.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ch.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.a>
        );
      })}
    </motion.div>
  );
}