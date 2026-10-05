import { prisma } from "../src/lib/prisma";

export async function seedVocabData() {
  console.log("🌱 Cleaning old demo vocabulary and seeding Integration Test - 10 Words...");

  // 1. Find target user and IELTS subject
  let user = await prisma.user.findFirst({
    where: { email: "huyvan19900@gmail.com" },
  });

  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (!user) {
    console.log("⚠️ No user found to link vocabulary seed.");
    return;
  }

  let ieltsSubject = await prisma.subject.findFirst({
    where: {
      userId: user.id,
      OR: [
        { code: "IELTS" },
        { name: { contains: "IELTS", mode: "insensitive" } },
      ],
    },
  });

  if (!ieltsSubject) {
    ieltsSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: "IELTS Academic",
        code: "IELTS",
        color: "#2d6a4f",
        description: "Luyện thi IELTS Academic & Ôn tập từ vựng trọng tâm",
        targetHours: 25.0,
        completedHours: 0.0,
        priority: 5,
      },
    });
  }

  // 2. Remove old demo vocabulary & progress
  await prisma.userWordProgress.deleteMany();
  await prisma.userWordSetProgress.deleteMany();
  await prisma.userCourseEnrollment.deleteMany();
  await prisma.userVocabularyMastery.deleteMany();
  await prisma.vocabWord.deleteMany();
  await prisma.wordSet.deleteMany();
  await prisma.vocabCourse.deleteMany();

  console.log("🧹 Cleaned old demo vocabulary data completely.");

  // 3. Create authoritative Course linked to IELTS subject
  const ieltsCourse = await prisma.vocabCourse.create({
    data: {
      slug: "ielts-vocabulary",
      title: "IELTS Academic Vocabulary",
      subtitle: "Từ vựng học thuật trọng tâm cho kỳ thi IELTS Band 6.5 - 8.0",
      description: "Hệ thống từ vựng học thuật cốt lõi tích hợp trực tiếp vào Practice Hub và Spaced Repetition.",
      icon: "🎯",
      coverColor: "#2d6a4f",
      level: "INTERMEDIATE",
      isPublished: true,
      isPro: false,
      order: 1,
      subjectId: ieltsSubject.id,
    },
  });

  // 4. Create authoritative WordSet: "Integration Test - 10 Words"
  const wordSet = await prisma.wordSet.create({
    data: {
      courseId: ieltsCourse.id,
      subjectId: ieltsSubject.id,
      orderNumber: 1,
      title: "Integration Test - 10 Words",
      description: "Bộ 10 từ vựng học thuật chuẩn hóa để kiểm tra đồng bộ toàn diện giữa Luyentu, Practice, Subject, StudyRecord và Dashboard.",
      icon: "⚡",
      isPro: false,
    },
  });

  // 5. Create 10 Full-Featured Words
  const wordsData = [
    {
      term: "abandon",
      meaning: "Từ bỏ, ruồng bỏ, ngừng thực hiện giữa chừng",
      phonetic: "/əˈbændən/",
      partOfSpeech: "verb",
      exampleSentence: "The research team had to abandon the experiment due to severe funding cuts.",
      exampleMeaning: "Nhóm nghiên cứu đã phải từ bỏ thí nghiệm do bị cắt giảm kinh phí nghiêm trọng.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/abandon--_gb_1.mp3",
      difficulty: "B1",
      topic: "Academic General",
      status: "NEW",
      repetition: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewDate: null,
      order: 1,
    },
    {
      term: "accommodate",
      meaning: "Đáp ứng, cung cấp chỗ ở, điều chỉnh cho phù hợp",
      phonetic: "/əˈkɒmədeɪt/",
      partOfSpeech: "verb",
      exampleSentence: "The new university dormitory can accommodate over five hundred students.",
      exampleMeaning: "Ký túc xá mới của trường đại học có thể đáp ứng chỗ ở cho hơn năm trăm sinh viên.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/accommodate--_gb_1.mp3",
      difficulty: "B2",
      topic: "Academic Life",
      status: "LEARNING",
      repetition: 1,
      intervalDays: 1,
      easeFactor: 2.4,
      nextReviewDate: new Date(), // Due for review
      order: 2,
    },
    {
      term: "accumulate",
      meaning: "Tích lũy, tích tụ, gom góp dần theo thời gian",
      phonetic: "/əˈkjuːmjəleɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Diligent students accumulate essential research skills throughout their university courses.",
      exampleMeaning: "Những sinh viên chăm chỉ tích lũy được các kỹ năng nghiên cứu thiết yếu trong suốt các khóa học đại học.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/accumulate--_gb_1.mp3",
      difficulty: "B2",
      topic: "Academic Skills",
      status: "LEARNING",
      repetition: 2,
      intervalDays: 2,
      easeFactor: 2.3,
      nextReviewDate: new Date(), // Due for review
      order: 3,
    },
    {
      term: "collaborate",
      meaning: "Hợp tác, cộng tác nghiên cứu",
      phonetic: "/kəˈlæbəreɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Two academic departments agreed to collaborate on the climate change project.",
      exampleMeaning: "Hai khoa học thuật đã đồng ý hợp tác trong dự án biến đổi khí hậu.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/collaborate--_gb_1.mp3",
      difficulty: "B2",
      topic: "Scientific Research",
      status: "MASTERED",
      repetition: 5,
      intervalDays: 14,
      easeFactor: 2.6,
      nextReviewDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      order: 4,
    },
    {
      term: "compensate",
      meaning: "Bù đắp, đền bù cho sự tổn thất hoặc thiếu hụt",
      phonetic: "/ˈkɒmpənseɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Nothing can completely compensate for the lost preparation time before exams.",
      exampleMeaning: "Không gì có thể bù đắp hoàn toàn cho thời gian chuẩn bị đã mất trước kỳ thi.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/compensate--_gb_1.mp3",
      difficulty: "B2",
      topic: "Formal Academic",
      status: "MASTERED",
      repetition: 4,
      intervalDays: 10,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      order: 5,
    },
    {
      term: "deteriorate",
      meaning: "Suy thoái, xấu đi, giảm sút chất lượng",
      phonetic: "/dɪˈtɪəriəreɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Memory retention tends to deteriorate quickly without active spaced repetition.",
      exampleMeaning: "Khả năng ghi nhớ có xu hướng suy giảm nhanh chóng nếu không ôn tập ngắt quãng chủ động.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/deteriorate--_gb_1.mp3",
      difficulty: "C1",
      topic: "Cognitive Science",
      status: "MASTERED",
      repetition: 6,
      intervalDays: 20,
      easeFactor: 2.7,
      nextReviewDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      order: 6,
    },
    {
      term: "facilitate",
      meaning: "Tạo điều kiện thuận lợi, làm cho quá trình dễ dàng hơn",
      phonetic: "/fəˈsɪlɪteɪt/",
      partOfSpeech: "verb",
      exampleSentence: "The digital platform was designed to facilitate efficient self-paced practice.",
      exampleMeaning: "Nền tảng kỹ thuật số được thiết kế để tạo điều kiện thuận lợi cho việc tự luyện tập hiệu quả.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/facilitate--_gb_1.mp3",
      difficulty: "C1",
      topic: "Educational Tech",
      status: "MASTERED",
      repetition: 5,
      intervalDays: 15,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      order: 7,
    },
    {
      term: "fluctuate",
      meaning: "Dao động, biến động liên tục",
      phonetic: "/ˈflʌktʃueɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Daily study hours often fluctuate depending on upcoming test deadlines.",
      exampleMeaning: "Số giờ học hàng ngày thường dao động tùy thuộc vào các hạn nộp bài kiểm tra sắp tới.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/fluctuate--_gb_1.mp3",
      difficulty: "B2",
      topic: "Data & Statistics",
      status: "MASTERED",
      repetition: 5,
      intervalDays: 12,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
      order: 8,
    },
    {
      term: "generate",
      meaning: "Tạo ra, phát ra, sản sinh",
      phonetic: "/ˈdʒenəreɪt/",
      partOfSpeech: "verb",
      exampleSentence: "Interactive study methods generate higher engagement and retention rates.",
      exampleMeaning: "Các phương pháp học tương tác tạo ra mức độ tương tác và tỷ lệ ghi nhớ cao hơn.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/generate--_gb_1.mp3",
      difficulty: "B1",
      topic: "Academic General",
      status: "MASTERED",
      repetition: 6,
      intervalDays: 18,
      easeFactor: 2.6,
      nextReviewDate: new Date(Date.now() + 18 * 24 * 3600 * 1000),
      order: 9,
    },
    {
      term: "jeopardize",
      meaning: "Gây nguy hiểm, làm liều, liều lĩnh gây hại",
      phonetic: "/ˈdʒepədaɪz/",
      partOfSpeech: "verb",
      exampleSentence: "Consistent procrastination will jeopardize your semester grade and academic progress.",
      exampleMeaning: "Sự trì hoãn liên tục sẽ gây tổn hại đến điểm số học kỳ và tiến độ học tập của bạn.",
      audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/jeopardize--_gb_1.mp3",
      difficulty: "C1",
      topic: "Academic Discipline",
      status: "MASTERED",
      repetition: 5,
      intervalDays: 16,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + 16 * 24 * 3600 * 1000),
      order: 10,
    },
  ];

  // 6. Insert Words & User Progress for all users in database
  const allUsers = await prisma.user.findMany({ select: { id: true } });

  for (const item of wordsData) {
    const word = await prisma.vocabWord.create({
      data: {
        wordSetId: wordSet.id,
        subjectId: ieltsSubject.id,
        term: item.term,
        meaning: item.meaning,
        phonetic: item.phonetic,
        partOfSpeech: item.partOfSpeech,
        exampleSentence: item.exampleSentence,
        exampleMeaning: item.exampleMeaning,
        audioUrl: item.audioUrl,
        difficulty: item.difficulty,
        topic: item.topic,
        order: item.order,
      },
    });

    for (const u of allUsers) {
      await prisma.userWordProgress.create({
        data: {
          userId: u.id,
          wordId: word.id,
          wordSetId: wordSet.id,
          status: item.status,
          repetition: item.repetition,
          intervalDays: item.intervalDays,
          easeFactor: item.easeFactor,
          nextReviewDate: item.nextReviewDate,
          lastReviewedAt: item.status !== "NEW" ? new Date() : null,
          timesStudied: item.status === "MASTERED" ? 5 : item.status === "LEARNING" ? 2 : 0,
          correctCount: item.status === "MASTERED" ? 5 : item.status === "LEARNING" ? 1 : 0,
          incorrectCount: item.status === "LEARNING" ? 1 : 0,
        },
      });
    }
  }

  // 7. Enroll all users and create set progress
  for (const u of allUsers) {
    await prisma.userCourseEnrollment.create({
      data: {
        userId: u.id,
        courseId: ieltsCourse.id,
        isPinned: true,
        isUnlocked: true,
      },
    });

    await prisma.userWordSetProgress.create({
      data: {
        userId: u.id,
        wordSetId: wordSet.id,
        isUnlocked: true,
        totalWords: 10,
        completedWords: 9, // 7 mastered + 2 learning
        isMastered: false,
      },
    });
  }

  console.log("✅ Successfully seeded 'Integration Test - 10 Words' with 10 academic words linked to IELTS!");
}

if (require.main === module) {
  seedVocabData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
