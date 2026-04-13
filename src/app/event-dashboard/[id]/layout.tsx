import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: { name: true, venue: true },
  });

  if (!event) {
    return { title: "イベントダッシュボード" };
  }

  const title = `${event.name} - 管理ダッシュボード`;
  const description = `${event.name}（${event.venue}）のチケット管理ダッシュボード`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function EventDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
