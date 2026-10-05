import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_WORDS = [
  {
    front: "Ubiquitous\n/juːˈbɪk.wɪ.təs/ (adj)",
    back: "Có mặt ở khắp mọi nơi; phổ biến biến khắp chốn cùng một lúc.\n\nVí dụ: Smartphones have become ubiquitous in daily university life.",
    hint: "Gợi ý: Xuất hiện khắp nơi (everywhere, omnipresent)",
    topic: "Academic Adjectives",
    sourceReference: "IELTS Academic Core Vocabulary",
  },
  {
    front: "Pragmatic\n/præɡˈmæt.ɪk/ (adj)",
    back: "Thực dụng, thực tế; giải quyết vấn đề dựa trên điều kiện thực tế thay vì lý thuyết giáo điều.\n\nVí dụ: We need a pragmatic approach to manage our study deadlines.",
    hint: "Gợi ý: Practical, down-to-earth",
    topic: "Academic Adjectives",
    sourceReference: "IELTS Academic Core Vocabulary",
  },
  {
    front: "Substantiate\n/səbˈstæn.ʃi.eɪt/ (verb)",
    back: "Chứng minh, xác minh bằng bằng chứng hoặc dữ liệu cụ thể.\n\nVí dụ: The researcher failed to substantiate his hypothesis with empirical evidence.",
    hint: "Gợi ý: Cung cấp bằng chứng chứng minh (prove, verify)",
    topic: "Academic Verbs",
    sourceReference: "Research Methodology",
  },
  {
    front: "Mitigate\n/ˈmɪt.ɪ.ɡeɪt/ (verb)",
    back: "Làm dịu bớt, giảm nhẹ mức độ nghiêm trọng hoặc tác hại của điều gì đó.\n\nVí dụ: Good time management helps mitigate exam stress.",
    hint: "Gợi ý: Làm giảm nhẹ, xoa dịu (alleviate, lessen)",
    topic: "Academic Verbs",
    sourceReference: "University Life & Health",
  },
  {
    front: "Paradigm\n/ˈpær.ə.daɪm/ (noun)",
    back: "Mô hình, khuôn mẫu, hệ biến hóa chuẩn mực được cộng đồng khoa học chấp nhận.\n\nVí dụ: Quantum mechanics represented a fundamental paradigm shift in modern physics.",
    hint: "Gợi ý: Khuôn mẫu, hệ tư duy mẫu (model, pattern)",
    topic: "Academic Nouns",
    sourceReference: "Philosophy of Science",
  },
  {
    front: "Discrepancy\n/dɪˈskrep.ən.si/ (noun)",
    back: "Sự không nhất quán, sự sai lệch hoặc khác biệt giữa hai hay nhiều nguồn dữ liệu.\n\nVí dụ: There is a significant discrepancy between the planned budget and actual costs.",
    hint: "Gợi ý: Sự sai lệch, chênh lệch (inconsistency, difference)",
    topic: "Academic Nouns",
    sourceReference: "Statistics & Accounting",
  },
  {
    front: "Juxtapose\n/ˌdʒʌk.stəˈpəʊz/ (verb)",
    back: "Đặt hai sự vật cạnh nhau để làm nổi bật sự so sánh hoặc tương phản.\n\nVí dụ: The essay juxtaposes traditional teaching methods with modern AI tutoring.",
    hint: "Gợi ý: Đặt cạnh nhau đối chiếu (place side by side for contrast)",
    topic: "Academic Verbs",
    sourceReference: "Academic Writing",
  },
  {
    front: "Ambiguous\n/æmˈbɪɡ.ju.əs/ (adj)",
    back: "Mơ hồ, nhập nhằng, có thể được hiểu theo nhiều nghĩa khác nhau.\n\nVí dụ: The instructions on the assignment prompt were ambiguous and confusing.",
    hint: "Gợi ý: Không rõ ràng, đa nghĩa (unclear, equivocal)",
    topic: "Academic Adjectives",
    sourceReference: "Linguistics & Logic",
  },
  {
    front: "Empirical\n/ɪmˈpɪr.ɪ.kəl/ (adj)",
    back: "Dựa trên thực nghiệm, kinh nghiệm quan sát thực tế chứ không phải lý thuyết thuần túy.\n\nVí dụ: Science relies on empirical observations rather than ungrounded intuition.",
    hint: "Gợi ý: Mang tính thực nghiệm (evidence-based, observed)",
    topic: "Scientific Methodology",
    sourceReference: "Research & Analytics",
  },
  {
    front: "Synthesize\n/ˈsɪn.θə.saɪz/ (verb)",
    back: "Tổng hợp các thông tin, ý tưởng từ nhiều nguồn khác nhau thành một chỉnh thể hoàn chỉnh.\n\nVí dụ: Students must synthesize key concepts from their lecture notes and textbook.",
    hint: "Gợi ý: Tổng hợp, phối hợp các phần tử (combine, integrate)",
    topic: "Academic Verbs",
    sourceReference: "Higher-Order Cognitive Skills",
  },
];

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to populate sample flashcards.`);

  for (const user of users) {
    // Find IELTS or create general subject
    const subject = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        OR: [
          { code: "IELTS" },
          { name: { contains: "IELTS" } },
          { name: { contains: "Anh" } },
        ],
      },
    });

    // Check if deck already exists
    let deck = await prisma.flashcardDeck.findFirst({
      where: {
        userId: user.id,
        title: "10 Từ Vựng Học Thuật Cốt Lõi (Academic Vocabulary)",
      },
    });

    if (!deck) {
      deck = await prisma.flashcardDeck.create({
        data: {
          userId: user.id,
          subjectId: subject?.id || null,
          title: "10 Từ Vựng Học Thuật Cốt Lõi (Academic Vocabulary)",
          description:
            "Bộ 10 thẻ ghi nhớ từ vựng học thuật tiếng Anh cốt lõi dành cho sinh viên đại học (IELTS / Nghiên cứu khoa học) kèm phiên âm, ngữ cảnh và gợi ý gợi nhớ.",
          cardCount: SAMPLE_WORDS.length,
        },
      });
      console.log(`Created FlashcardDeck ${deck.id} for user ${user.name || user.email}`);
    } else {
      console.log(`FlashcardDeck ${deck.id} already exists for user ${user.name || user.email}`);
      // Remove old cards if any to re-populate cleanly
      await prisma.flashcard.deleteMany({ where: { deckId: deck.id } });
    }

    // Insert 10 cards
    const now = new Date();
    for (let i = 0; i < SAMPLE_WORDS.length; i++) {
      const item = SAMPLE_WORDS[i];
      await prisma.flashcard.create({
        data: {
          deckId: deck.id,
          front: item.front,
          back: item.back,
          hint: item.hint,
          topic: item.topic,
          sourceReference: item.sourceReference,
          masteryLevel: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          repetitionCount: 0,
          status: "NEW",
          nextReview: now,
        },
      });
    }

    // Update card count
    await prisma.flashcardDeck.update({
      where: { id: deck.id },
      data: { cardCount: SAMPLE_WORDS.length },
    });

    console.log(`Successfully populated 10 flashcards into deck: "${deck.title}"`);
  }
}

main()
  .catch((err) => {
    console.error("Error creating sample flashcards:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
