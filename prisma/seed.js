const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const achievements = [
    { key: "first_win", title: "İlk Zafer", description: "İlk oyununu kazan", icon: "🏆" },
    { key: "ten_wins", title: "Seri Galip", description: "10 oyun kazan", icon: "🔥" },
    { key: "all_games", title: "Kaşif", description: "Tüm oyunları en az bir kez oyna", icon: "🧭" },
    { key: "love_expert", title: "Aşk Uzmanı", description: "Beni Ne Kadar Tanıyorsun'da 40+ puan al", icon: "💕" }
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {},
      create: a
    });
  }

  console.log("Seed tamamlandı ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
