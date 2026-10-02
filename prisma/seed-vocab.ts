import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedVocabData() {
  console.log("🌱 Seeding LUYENTU Vocabulary Courses & Sets...");

  // 1. Course: A1 (0-3.0)
  const a1Course = await prisma.vocabCourse.upsert({
    where: { slug: "a1-0-3-0" },
    update: {},
    create: {
      slug: "a1-0-3-0",
      title: "A1 (0-3.0)",
      subtitle: "Dành cho người mới bắt đầu học tiếng anh",
      description: "Lộ trình học từ vựng căn bản A1 từ số 0, nắm vững 371 từ vựng giao tiếp cốt lõi hàng ngày.",
      icon: "📚",
      coverColor: "#10b981",
      level: "BEGINNER",
      isPublished: true,
      order: 1,
    },
  });

  // Word Sets for A1
  const wordSetsData = [
    {
      orderNumber: 1,
      title: "Lời chào hỏi",
      description: "Các mẫu câu và từ vựng chào hỏi, giới thiệu bản thân thông dụng.",
      isPro: false,
      words: [
        {
          term: "Hello",
          phonetic: "/həˈləʊ/",
          partOfSpeech: "interjection",
          meaning: "Xin chào",
          explanation: "Lời chào trang trọng hoặc thân mật khi gặp ai đó.",
          exampleSentence: "Hello, nice to meet you!",
          exampleMeaning: "Xin chào, rất vui được gặp bạn!",
        },
        {
          term: "Hi",
          phonetic: "/haɪ/",
          partOfSpeech: "interjection",
          meaning: "Chào (thân mật)",
          explanation: "Lời chào thân mật với bạn bè hoặc người quen.",
          exampleSentence: "Hi Tom, how have you been?",
          exampleMeaning: "Chào Tom, dạo này bạn thế nào?",
        },
        {
          term: "Good morning",
          phonetic: "/ɡʊd ˈmɔːnɪŋ/",
          partOfSpeech: "phrase",
          meaning: "Chào buổi sáng",
          explanation: "Lời chào trước 12 giờ trưa.",
          exampleSentence: "Good morning, class! Please take your seats.",
          exampleMeaning: "Chào buổi sáng cả lớp! Mời các em ngồi vào chỗ.",
        },
        {
          term: "Good afternoon",
          phonetic: "/ɡʊd ˌɑːftəˈnuːn/",
          partOfSpeech: "phrase",
          meaning: "Chào buổi chiều",
          explanation: "Lời chào từ 12 giờ trưa đến khoảng 6 giờ chiều.",
          exampleSentence: "Good afternoon, Dr. Smith.",
          exampleMeaning: "Chào buổi chiều, bác sĩ Smith.",
        },
        {
          term: "Good evening",
          phonetic: "/ɡʊd ˈiːvnɪŋ/",
          partOfSpeech: "phrase",
          meaning: "Chào buổi tối",
          explanation: "Lời chào lịch sự vào buổi tối.",
          exampleSentence: "Good evening, welcome to our restaurant.",
          exampleMeaning: "Chào buổi tối, chào mừng quý khách đến nhà hàng.",
        },
        {
          term: "Goodbye",
          phonetic: "/ɡʊdˈbaɪ/",
          partOfSpeech: "interjection",
          meaning: "Tạm biệt",
          explanation: "Nói khi rời đi hoặc kết thúc cuộc trò chuyện.",
          exampleSentence: "Goodbye, have a safe trip home!",
          exampleMeaning: "Tạm biệt, chúc bạn đi đường an toàn!",
        },
        {
          term: "See you later",
          phonetic: "/siː juː ˈleɪtə/",
          partOfSpeech: "phrase",
          meaning: "Hẹn gặp lại sau",
          explanation: "Lời tạm biệt thân thiện khi sẽ gặp lại nhau sớm.",
          exampleSentence: "I have to run now, see you later!",
          exampleMeaning: "Mình phải đi rồi, hẹn gặp lại bạn sau nhé!",
        },
        {
          term: "Nice to meet you",
          phonetic: "/naɪs tuː miːt juː/",
          partOfSpeech: "phrase",
          meaning: "Rất vui được gặp bạn",
          explanation: "Nói khi lần đầu tiên được giới thiệu với ai đó.",
          exampleSentence: "I am Linh. Nice to meet you!",
          exampleMeaning: "Tôi là Linh. Rất vui được gặp bạn!",
        },
        {
          term: "How are you?",
          phonetic: "/haʊ ɑː juː/",
          partOfSpeech: "phrase",
          meaning: "Bạn khỏe không?",
          explanation: "Hỏi thăm sức khỏe và tình hình hiện tại.",
          exampleSentence: "How are you today? - I am doing great, thank you!",
          exampleMeaning: "Hôm nay bạn thế nào? - Tôi rất khỏe, cảm ơn bạn!",
        },
      ],
    },
    {
      orderNumber: 2,
      title: "Số đếm",
      description: "Các số đếm từ cơ bản đến nâng cao trong tiếng Anh.",
      isPro: true,
      words: [
        { term: "One", phonetic: "/wʌn/", partOfSpeech: "number", meaning: "Số một", exampleSentence: "I have one apple.", exampleMeaning: "Tôi có một quả táo." },
        { term: "Two", phonetic: "/tuː/", partOfSpeech: "number", meaning: "Số hai", exampleSentence: "She has two brothers.", exampleMeaning: "Cô ấy có hai người anh trai." },
        { term: "Three", phonetic: "/θriː/", partOfSpeech: "number", meaning: "Số ba", exampleSentence: "There are three birds.", exampleMeaning: "Có ba con chim." },
        { term: "Four", phonetic: "/fɔː/", partOfSpeech: "number", meaning: "Số bốn", exampleSentence: "A table has four legs.", exampleMeaning: "Một chiếc bàn có bốn chân." },
        { term: "Five", phonetic: "/faɪv/", partOfSpeech: "number", meaning: "Số năm", exampleSentence: "Give me five minutes.", exampleMeaning: "Cho tôi năm phút." },
        { term: "Ten", phonetic: "/ten/", partOfSpeech: "number", meaning: "Số mười", exampleSentence: "He scored ten points.", exampleMeaning: "Anh ấy ghi được mười điểm." },
        { term: "Hundred", phonetic: "/ˈhʌndrəd/", partOfSpeech: "number", meaning: "Một trăm", exampleSentence: "Over one hundred people attended.", exampleMeaning: "Hơn một trăm người đã tham dự." },
      ],
    },
    {
      orderNumber: 3,
      title: "Màu sắc",
      description: "Tên các màu sắc phổ biến trong đời sống.",
      isPro: true,
      words: [
        { term: "Red", phonetic: "/red/", partOfSpeech: "adjective", meaning: "Màu đỏ", exampleSentence: "She wore a red dress.", exampleMeaning: "Cô ấy mặc chiếc váy màu đỏ." },
        { term: "Blue", phonetic: "/bluː/", partOfSpeech: "adjective", meaning: "Màu xanh da trời", exampleSentence: "The sky is clear and blue.", exampleMeaning: "Bầu trời quang đãng và xanh ngắt." },
        { term: "Green", phonetic: "/ɡriːn/", partOfSpeech: "adjective", meaning: "Màu xanh lá cây", exampleSentence: "The grass is always green here.", exampleMeaning: "Cỏ ở đây lúc nào cũng xanh tươi." },
        { term: "Yellow", phonetic: "/ˈjeləʊ/", partOfSpeech: "adjective", meaning: "Màu vàng", exampleSentence: "Sunflowers are bright yellow.", exampleMeaning: "Hoa hướng dương có màu vàng rực rỡ." },
        { term: "White", phonetic: "/waɪt/", partOfSpeech: "adjective", meaning: "Màu trắng", exampleSentence: "The doctor wore a white coat.", exampleMeaning: "Bác sĩ mặc áo blouse trắng." },
        { term: "Black", phonetic: "/blæk/", partOfSpeech: "adjective", meaning: "Màu đen", exampleSentence: "He drives a black car.", exampleMeaning: "Anh ấy lái chiếc xe màu đen." },
      ],
    },
    {
      orderNumber: 4,
      title: "Ngày trong tuần",
      description: "Từ vựng về 7 ngày trong tuần từ Thứ Hai đến Chủ Nhật.",
      isPro: true,
      words: [
        { term: "Monday", phonetic: "/ˈmʌndeɪ/", partOfSpeech: "noun", meaning: "Thứ Hai", exampleSentence: "School starts on Monday.", exampleMeaning: "Trường học bắt đầu vào thứ Hai." },
        { term: "Tuesday", phonetic: "/ˈtjuːzdeɪ/", partOfSpeech: "noun", meaning: "Thứ Ba", exampleSentence: "We have an English test on Tuesday.", exampleMeaning: "Chúng tôi có bài kiểm tra tiếng Anh vào thứ Ba." },
        { term: "Wednesday", phonetic: "/ˈwenzdeɪ/", partOfSpeech: "noun", meaning: "Thứ Tư", exampleSentence: "Wednesday is the middle of the work week.", exampleMeaning: "Thứ Tư là giữa tuần làm việc." },
        { term: "Thursday", phonetic: "/ˈθɜːzdeɪ/", partOfSpeech: "noun", meaning: "Thứ Năm", exampleSentence: "Can we meet on Thursday?", exampleMeaning: "Chúng ta gặp nhau vào thứ Năm được không?" },
        { term: "Friday", phonetic: "/ˈfraɪdeɪ/", partOfSpeech: "noun", meaning: "Thứ Sáu", exampleSentence: "TGIF: Thank God it's Friday!", exampleMeaning: "Ơn giời thứ Sáu đến rồi!" },
        { term: "Saturday", phonetic: "/ˈsætədeɪ/", partOfSpeech: "noun", meaning: "Thứ Bảy", exampleSentence: "I usually go hiking on Saturday.", exampleMeaning: "Tôi thường đi leo núi vào thứ Bảy." },
        { term: "Sunday", phonetic: "/ˈsʌndeɪ/", partOfSpeech: "noun", meaning: "Chủ Nhật", exampleSentence: "Sunday is a day of rest.", exampleMeaning: "Chủ Nhật là ngày nghỉ ngơi." },
      ],
    },
    {
      orderNumber: 5,
      title: "Tháng trong năm",
      description: "12 tháng trong năm và mùa màng.",
      isPro: true,
      words: [
        { term: "January", phonetic: "/ˈdʒænjuəri/", partOfSpeech: "noun", meaning: "Tháng Một", exampleSentence: "January is the first month of the year.", exampleMeaning: "Tháng Một là tháng đầu tiên của năm." },
        { term: "February", phonetic: "/ˈfebruəri/", partOfSpeech: "noun", meaning: "Tháng Hai", exampleSentence: "February is the shortest month.", exampleMeaning: "Tháng Hai là tháng ngắn nhất trong năm." },
        { term: "March", phonetic: "/mɑːtʃ/", partOfSpeech: "noun", meaning: "Tháng Ba", exampleSentence: "Spring arrives in March.", exampleMeaning: "Mùa xuân về vào tháng Ba." },
        { term: "April", phonetic: "/ˈeɪprəl/", partOfSpeech: "noun", meaning: "Tháng Tư", exampleSentence: "April showers bring May flowers.", exampleMeaning: "Mưa tháng Tư mang đến hoa tháng Năm." },
      ],
    },
    {
      orderNumber: 6,
      title: "Thời tiết",
      description: "Miêu tả thời tiết, nhiệt độ và khí hậu hàng ngày.",
      isPro: true,
      words: [
        { term: "Sunny", phonetic: "/ˈsʌni/", partOfSpeech: "adjective", meaning: "Nắng, có nhiều nắng", exampleSentence: "It is a beautiful sunny morning.", exampleMeaning: "Đó là một buổi sáng đẹp trời đầy nắng." },
        { term: "Rainy", phonetic: "/ˈreɪni/", partOfSpeech: "adjective", meaning: "Có mưa", exampleSentence: "Bring an umbrella on rainy days.", exampleMeaning: "Hãy mang theo ô vào những ngày mưa." },
        { term: "Windy", phonetic: "/ˈwɪndi/", partOfSpeech: "adjective", meaning: "Có nhiều gió", exampleSentence: "Hold on to your hat, it is windy!", exampleMeaning: "Giữ chặt mũ nhé, trời đang nhiều gió đấy!" },
        { term: "Cold", phonetic: "/kəʊld/", partOfSpeech: "adjective", meaning: "Lạnh", exampleSentence: "It gets very cold in winter.", exampleMeaning: "Trời trở nên rất lạnh vào mùa đông." },
        { term: "Hot", phonetic: "/hɒt/", partOfSpeech: "adjective", meaning: "Nóng bức", exampleSentence: "Summer in the city can be extremely hot.", exampleMeaning: "Mùa hè trong thành phố có thể cực kỳ nóng nực." },
      ],
    },
  ];

  for (const setData of wordSetsData) {
    const wordSet = await prisma.wordSet.upsert({
      where: {
        courseId_orderNumber: {
          courseId: a1Course.id,
          orderNumber: setData.orderNumber,
        },
      },
      update: {
        title: setData.title,
        description: setData.description,
        isPro: setData.isPro,
      },
      create: {
        courseId: a1Course.id,
        orderNumber: setData.orderNumber,
        title: setData.title,
        description: setData.description,
        isPro: setData.isPro,
      },
    });

    // Seed words for this set
    for (let i = 0; i < setData.words.length; i++) {
      const w = setData.words[i];
      const existing = await prisma.vocabWord.findFirst({
        where: {
          wordSetId: wordSet.id,
          term: w.term,
        },
      });

      if (!existing) {
        await prisma.vocabWord.create({
          data: {
            wordSetId: wordSet.id,
            term: w.term,
            phonetic: w.phonetic,
            partOfSpeech: w.partOfSpeech,
            meaning: w.meaning,
            explanation: (w as any).explanation || null,
            exampleSentence: w.exampleSentence || null,
            exampleMeaning: w.exampleMeaning || null,
            order: i + 1,
          },
        });
      }
    }
  }

  // 2. Seed Shop Items
  const shopItemsData = [
    {
      name: "Mở khóa gói PRO Trọn đời",
      description: "Truy cập không giới hạn toàn bộ 31 bộ từ vựng A1 và các khóa học nâng cao.",
      type: "PRO_UNLOCK",
      costCoins: 500,
      icon: "👑",
    },
    {
      name: "Đóng băng chuỗi ngày học (Streak Freeze)",
      description: "Bảo vệ chuỗi ngày học của bạn không bị đứt đoạn nếu bạn bận rộn 1 ngày.",
      type: "STREAK_FREEZE",
      costCoins: 50,
      icon: "❄️",
    },
    {
      name: "Huy hiệu Thần Tốc (Speed Master)",
      description: "Huy hiệu vinh danh người hoàn thành chế độ Typing và Listening dưới 15 giây.",
      type: "BADGE",
      costCoins: 100,
      icon: "⚡",
    },
    {
      name: "Giao diện Hoàng Gia (Royal Emerald)",
      description: "Giao diện cao cấp phối màu ngọc bích vàng ánh kim dành cho thành viên VIP.",
      type: "THEME",
      costCoins: 200,
      icon: "✨",
    },
  ];

  for (const item of shopItemsData) {
    const existing = await prisma.shopItem.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.shopItem.create({
        data: item,
      });
    }
  }

  console.log("✅ Vocab seed completed successfully!");
}

if (require.main === module) {
  seedVocabData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
