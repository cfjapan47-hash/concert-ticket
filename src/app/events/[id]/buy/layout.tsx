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
    select: {
      name: true,
      date: true,
      venue: true,
      description: true,
      flyerUrl: true,
    },
  });

  if (!event) {
    return { title: "イベントが見つかりません" };
  }

  const dateStr = new Date(event.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title = `${event.name} - チケット購入`;
  const description = `${dateStr} / ${event.venue}${event.description ? ` - ${event.description}` : ""}`;

  const images =
    event.flyerUrl && !event.flyerUrl.endsWith(".pdf")
      ? [{ url: event.flyerUrl, width: 1200, height: 630 }]
      : [];

  return {
    title,
    description,
    openGraph: {
      title: event.name,
      description,
      images,
      type: "website",
      siteName: "コンサートチケット",
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: event.name,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
