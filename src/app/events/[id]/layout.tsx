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
    select: { name: true, date: true, venue: true, description: true, flyerUrl: true },
  });

  if (!event) {
    return { title: "イベントが見つかりません" };
  }

  const dateStr = new Date(event.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title = event.name;
  const description = `${dateStr} / ${event.venue}${event.description ? ` - ${event.description}` : ""}`;

  const images = event.flyerUrl && !event.flyerUrl.endsWith(".pdf")
    ? [{ url: event.flyerUrl }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
