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
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const service = await db.service.findUnique({
    where: { id },
    include: {
      category: true,
      priceOptions: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!service || !service.isActive) {
    notFound();
  }

  return <ServiceDetailView service={service} />;
}