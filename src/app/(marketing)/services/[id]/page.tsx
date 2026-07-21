import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

import ServiceDetailView from "./_components/service-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const service = await db.service.findUnique({
      where: { id },
    });

    if (!service) {
      return { title: "Dịch vụ không tồn tại" };
    }

    return {
      title: `${service.name} | Genshin77`,
      description: service.description,
    };
  } catch {
    return { title: "Chi tiết dịch vụ | Genshin77" };
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  let service: any = null;
  try {
    service = await db.service.findUnique({
      where: { id },
      include: {
        category: true,
        priceOptions: {
          orderBy: { price: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("[ServiceDetailPage] DB error:", error);
  }

  if (!service || !service.isActive) {
    notFound();
  }

  return <ServiceDetailView service={service} />;
}