import { prisma } from "../src/lib/prisma";

export const SAMPLE_HOUSEHOLD_CARDS = [
  {
    front: "table",
    back: "cái bàn, bàn",
    phonetic: "/ˈteɪ.bəl/",
    partOfSpeech: "noun",
    exampleSentence: "I put my laptop on the table.",
    exampleMeaning: "Tôi đặt máy tính xách tay của mình trên bàn.",
    hint: "Đồ nội thất có mặt phẳng dùng để đặt đồ vật hoặc làm việc.",
    topic: "Household Items",
  },
  {
    front: "chair",
    back: "cái ghế, ghế",
    phonetic: "/tʃeər/",
    partOfSpeech: "noun",
    exampleSentence: "He sat down on the chair next to the window.",
    exampleMeaning: "Anh ấy ngồi xuống chiếc ghế cạnh cửa sổ.",
    hint: "Đồ dùng để ngồi, thường có 4 chân và tựa lưng.",
    topic: "Household Items",
  },
  {
    front: "door",
    back: "cửa, cánh cửa",
    phonetic: "/dɔːr/",
    partOfSpeech: "noun",
    exampleSentence: "Please close the door when you leave the room.",
    exampleMeaning: "Làm ơn đóng cửa khi bạn rời khỏi phòng.",
    hint: "Cửa ra vào để đi vào hoặc ra khỏi một phòng.",
    topic: "Household Items",
  },
  {
    front: "window",
    back: "cửa sổ",
    phonetic: "/ˈwɪn.doʊ/",
    partOfSpeech: "noun",
    exampleSentence: "She opened the window to let fresh air in.",
    exampleMeaning: "Cô ấy mở cửa sổ để đón không khí trong lành.",
    hint: "Khung kính trên tường để lấy ánh sáng và không khí.",
    topic: "Household Items",
  },
  {
    front: "bed",
    back: "cái giường, giường",
    phonetic: "/bed/",
    partOfSpeech: "noun",
    exampleSentence: "After a long day, he fell asleep in his warm bed.",
    exampleMeaning: "Sau một ngày dài, anh ấy ngủ thiếp đi trên chiếc giường ấm áp.",
    hint: "Đồ nội thất dùng để nằm ngủ và nghỉ ngơi.",
    topic: "Household Items",
  },
  {
    front: "desk",
    back: "bàn làm việc, bàn học",
    phonetic: "/desk/",
    partOfSpeech: "noun",
    exampleSentence: "My study desk is equipped with a modern lamp.",
    exampleMeaning: "Bàn học của tôi được trang bị một chiếc đèn hiện đại.",
    hint: "Bàn thường có ngăn kéo, dùng để học tập hoặc làm việc.",
    topic: "Household Items",
  },
  {
    front: "lamp",
    back: "đèn bàn, đèn chiếu sáng",
    phonetic: "/læmp/",
    partOfSpeech: "noun",
    exampleSentence: "Turn on the reading lamp so your eyes don't get tired.",
    exampleMeaning: "Bật đèn đọc sách lên để mắt không bị mỏi.",
    hint: "Thiết bị phát ra ánh sáng nhân tạo.",
    topic: "Household Items",
  },
  {
    front: "sofa",
    back: "ghế sofa, ghế bành",
    phonetic: "/ˈsoʊ.fə/",
    partOfSpeech: "noun",
    exampleSentence: "The whole family sat on the comfortable sofa to watch TV.",
    exampleMeaning: "Cả gia đình ngồi trên chiếc ghế sofa êm ái để xem TV.",
    hint: "Ghế đệm dài êm ái cho nhiều người cùng ngồi.",
    topic: "Household Items",
  },
  {
    front: "clock",
    back: "đồng hồ, đồng hồ treo tường",
    phonetic: "/klɒk/",
    partOfSpeech: "noun",
    exampleSentence: "The wall clock shows that it is already eight o'clock.",
    exampleMeaning: "Đồng hồ treo tường chỉ rằng đã tám giờ rồi.",
    hint: "Thiết bị dùng để xem giờ giấc.",
    topic: "Household Items",
  },
  {
    front: "mirror",
    back: "gương soi, cái gương",
    phonetic: "/ˈmɪr.ər/",
    partOfSpeech: "noun",
    exampleSentence: "He looked at himself in the mirror before leaving.",
    exampleMeaning: "Anh ấy nhìn mình trong gương trước khi rời đi.",
    hint: "Bề mặt phản chiếu hình ảnh dùng để soi gương.",
    topic: "Household Items",
  },
];

async function seedHouseholdDeck() {
  console.log("🌱 Seeding Household Items Flashcard Deck (10 cards)...");

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }

  for (const user of users) {
    console.log(`Checking user: ${user.email} (${user.id})`);

    // Check if deck already exists
    let deck = await prisma.flashcardDeck.findFirst({
      where: {
        userId: user.id,
        title: "Household Items",
      },
      include: { flashcards: true },
    });

    if (!deck) {
      deck = await prisma.flashcardDeck.create({
        data: {
          userId: user.id,
          title: "Household Items",
          description: "Bộ 10 từ vựng đồ dùng gia đình cốt lõi (Bàn, ghế, cửa, cửa sổ, giường, đèn...) với đầy đủ ngữ cảnh và phát âm.",
          cardCount: SAMPLE_HOUSEHOLD_CARDS.length,
        },
        include: { flashcards: true },
      });
      console.log(`  ✓ Created deck "Household Items" with ID: ${deck.id}`);
    } else {
      console.log(`  ℹ Deck "Household Items" already exists (ID: ${deck.id})`);
    }

    // Ensure all 10 cards exist
    for (const item of SAMPLE_HOUSEHOLD_CARDS) {
      const existingCard = await prisma.flashcard.findFirst({
        where: {
          deckId: deck.id,
          front: item.front,
        },
      });

      if (!existingCard) {
        await prisma.flashcard.create({
          data: {
            deckId: deck.id,
            front: item.front,
            back: item.back,
            phonetic: item.phonetic,
            partOfSpeech: item.partOfSpeech,
            exampleSentence: item.exampleSentence,
            exampleMeaning: item.exampleMeaning,
            hint: item.hint,
            topic: item.topic,
            status: "NEW",
            masteryLevel: 0,
          },
        });
        console.log(`    + Added card: ${item.front} = ${item.back}`);
      } else {
        // Update metadata if missing
        await prisma.flashcard.update({
          where: { id: existingCard.id },
          data: {
            back: item.back,
            phonetic: item.phonetic,
            partOfSpeech: item.partOfSpeech,
            exampleSentence: item.exampleSentence,
            exampleMeaning: item.exampleMeaning,
            hint: item.hint,
            topic: item.topic,
          },
        });
      }
    }

    const count = await prisma.flashcard.count({ where: { deckId: deck.id } });
    await prisma.flashcardDeck.update({
      where: { id: deck.id },
      data: { cardCount: count },
    });
    console.log(`  ✓ Deck ${deck.title} now has ${count} cards.`);
  }

  console.log("✅ Seed completed successfully!");
}

if (require.main === module) {
  seedHouseholdDeck()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
