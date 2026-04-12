import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      name: "春の音楽祭 2026",
      date: new Date("2026-05-15T18:00:00"),
      venue: "東京国際フォーラム ホールA",
      description: "春を彩る豪華アーティストによる音楽祭。クラシックからポップスまで幅広いジャンルをお楽しみください。",
      status: "ON_SALE",
      seatTypes: {
        create: [
          { name: "S席", price: 15000, capacity: 200 },
          { name: "A席", price: 10000, capacity: 500 },
          { name: "B席", price: 5000, capacity: 300 },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: "サマーロックフェス 2026",
      date: new Date("2026-08-10T14:00:00"),
      venue: "幕張メッセ",
      description: "真夏の熱狂！国内外のロックバンドが一堂に集結するフェスティバル。",
      status: "ON_SALE",
      seatTypes: {
        create: [
          { name: "VIP席", price: 20000, capacity: 100 },
          { name: "一般スタンディング", price: 8000, capacity: 2000 },
        ],
      },
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: "秋のジャズナイト",
      date: new Date("2026-10-20T19:30:00"),
      venue: "ブルーノート東京",
      description: "秋の夜に贈る上質なジャズライブ。",
      status: "DRAFT",
      seatTypes: {
        create: [
          { name: "テーブル席", price: 12000, capacity: 50 },
          { name: "バーカウンター席", price: 8000, capacity: 20 },
        ],
      },
    },
  });

  console.log("Seed data created:");
  console.log(`  Event 1: ${event1.name} (id: ${event1.id})`);
  console.log(`  Event 2: ${event2.name} (id: ${event2.id})`);
  console.log(`  Event 3: ${event3.name} (id: ${event3.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
