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
          partOfSpeech: "THÁN TỪ",
          meaning: "Xin chào(hello)",
          explanation: "Lời chào phổ biến và thông dụng nhất trong tiếng Anh.",
          exampleSentence: "Hello, nice to meet you!",
          exampleMeaning: "Xin chào, rất vui được gặp bạn!",
        },
        {
          term: "Good morning",
          phonetic: "/ɡʊd ˈmɔːrnɪŋ/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Chào buổi sáng",
          explanation: "Lời chào lịch sự vào buổi sáng trước 12 giờ trưa.",
          exampleSentence: "Good morning, class! Please take your seats.",
          exampleMeaning: "Chào buổi sáng cả lớp! Mời các em ngồi vào chỗ.",
        },
        {
          term: "Hi",
          phonetic: "/haɪ/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Xin chào(Hi)",
          explanation: "Lời chào thân mật với bạn bè hoặc người quen.",
          exampleSentence: "Hi Tom, how have you been?",
          exampleMeaning: "Chào Tom, dạo này bạn thế nào?",
        },
        {
          term: "Hi there",
          phonetic: "/haɪ ðeə/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Xin chào(Hi, there)",
          explanation: "Lời chào thân thiện tự nhiên trong giao tiếp hằng ngày.",
          exampleSentence: "Hi there, what is your name?",
          exampleMeaning: "Xin chào bạn, tên bạn là gì?",
        },
        {
          term: "Welcome",
          phonetic: "/ˈwelkəm/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Xin mời vào, chào mừng",
          explanation: "Dùng để chào đón khách hoặc người mới đến.",
          exampleSentence: "Welcome to our home!",
          exampleMeaning: "Chào mừng bạn đến với ngôi nhà của chúng tôi!",
        },
        {
          term: "Hello there",
          phonetic: "/həˈləʊ ðeə/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Xin chào, chào",
          explanation: "Cách nói chào thân mật, tạo thiện cảm với người đối diện.",
          exampleSentence: "Hello there, good to see you!",
          exampleMeaning: "Chào bạn, rất vui được gặp lại bạn!",
        },
        {
          term: "Good evening",
          phonetic: "/ɡʊd ˈiːvnɪŋ/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Chào buổi tối",
          explanation: "Lời chào lịch sự vào buổi tối sau 6 giờ chiều.",
          exampleSentence: "Good evening, welcome to our restaurant.",
          exampleMeaning: "Chào buổi tối, chào mừng quý khách đến nhà hàng.",
        },
        {
          term: "Good afternoon",
          phonetic: "/ˌɡʊd ˌɑːf.təˈnuːn/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Chào buổi chiều",
          explanation: "Lời chào từ 12 giờ trưa đến khoảng 6 giờ chiều.",
          exampleSentence: "Good afternoon, lunch was delicious.",
          exampleMeaning: "Chào buổi chiều, bữa trưa thật ngon.",
        },
        {
          term: "Goodbye",
          phonetic: "/ɡʊdˈbaɪ/",
          partOfSpeech: "THÁN TỪ",
          meaning: "Tạm biệt",
          explanation: "Nói khi rời đi hoặc kết thúc cuộc trò chuyện.",
          exampleSentence: "Goodbye, have a safe trip home!",
          exampleMeaning: "Tạm biệt, chúc bạn đi đường an toàn!",
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

    // Sync words for this set: remove terms no longer in the set
    const validTerms = setData.words.map((w) => w.term);
    await prisma.vocabWord.deleteMany({
      where: {
        wordSetId: wordSet.id,
        term: { notIn: validTerms },
      },
    });

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
      } else {
        await prisma.vocabWord.update({
          where: { id: existing.id },
          data: {
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

  // Additional Roadmaps / Courses
  const additionalCourses = [
    {
      slug: "hsa-dgnl-2026",
      title: "Luyện thi HSA & ĐGNL",
      subtitle: "Từ vựng trọng tâm kỳ thi Đánh giá năng lực ĐHQG",
      description: "Bộ từ vựng bám sát cấu trúc bài thi HSA và V-SAT với các chủ đề khoa học, xã hội, tư duy ngôn ngữ.",
      icon: "🎯",
      coverColor: "#3b82f6",
      level: "INTERMEDIATE",
      order: 2,
      sets: [
        {
          orderNumber: 1,
          title: "Tư duy ngôn ngữ & Logic",
          description: "Các thuật ngữ thường gặp trong phần đọc hiểu và lập luận phản biện.",
          isPro: false,
          words: [
            { term: "Hypothesis", phonetic: "/haɪˈpɒθ.ə.sɪs/", partOfSpeech: "noun", meaning: "Giả thuyết", exampleSentence: "Scientists proposed a new hypothesis.", exampleMeaning: "Các nhà khoa học đã đề xuất một giả thuyết mới." },
            { term: "Phenomenon", phonetic: "/fəˈnɒm.ɪ.nən/", partOfSpeech: "noun", meaning: "Hiện tượng", exampleSentence: "Gravity is a natural phenomenon.", exampleMeaning: "Trọng lực là một hiện tượng tự nhiên." },
            { term: "Evidence", phonetic: "/ˈev.ɪ.dəns/", partOfSpeech: "noun", meaning: "Bằng chứng", exampleSentence: "There is clear evidence of climate change.", exampleMeaning: "Có bằng chứng rõ ràng về biến đổi khí hậu." },
            { term: "Analyze", phonetic: "/ˈæn.əl.aɪz/", partOfSpeech: "verb", meaning: "Phân tích", exampleSentence: "We must analyze the data carefully.", exampleMeaning: "Chúng ta cần phân tích dữ liệu một cách cẩn thận." },
            { term: "Evaluate", phonetic: "/ɪˈvæl.ju.eɪt/", partOfSpeech: "verb", meaning: "Đánh giá", exampleSentence: "Teachers evaluate students' performance.", exampleMeaning: "Giáo viên đánh giá kết quả của học sinh." },
          ],
        },
        {
          orderNumber: 2,
          title: "Khoa học tự nhiên & Môi trường",
          description: "Từ vựng chuyên đề sinh thái, môi trường và phát triển bền vững.",
          isPro: true,
          words: [
            { term: "Ecosystem", phonetic: "/ˈiː.kəʊˌsɪs.təm/", partOfSpeech: "noun", meaning: "Hệ sinh thái", exampleSentence: "Forests are delicate ecosystems.", exampleMeaning: "Rừng là những hệ sinh thái nhạy cảm." },
            { term: "Biodiversity", phonetic: "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", partOfSpeech: "noun", meaning: "Đa dạng sinh học", exampleSentence: "Protecting biodiversity is vital.", exampleMeaning: "Bảo vệ đa dạng sinh học là điều tối quan trọng." },
            { term: "Atmosphere", phonetic: "/ˈæt.məs.fɪər/", partOfSpeech: "noun", meaning: "Khí quyển", exampleSentence: "Pollution enters the atmosphere.", exampleMeaning: "Chất ô nhiễm đi vào bầu khí quyển." },
          ],
        },
      ],
    },
    {
      slug: "thpt-qg-2026",
      title: "THPT Quốc Gia 9+",
      subtitle: "Tuyển chọn từ vựng phân loại câu 8+ 9+ kỳ thi tốt nghiệp",
      description: "Từ vựng nâng cao, thành ngữ Idioms và Cụm động từ Phrasal Verbs hay bẫy trong đề thi chính thức.",
      icon: "🎓",
      coverColor: "#8b5cf6",
      level: "INTERMEDIATE",
      order: 3,
      sets: [
        {
          orderNumber: 1,
          title: "Phrasal Verbs then chốt",
          description: "Cụm động từ then chốt thường xuyên xuất hiện trong đề minh họa và đề thi thật.",
          isPro: false,
          words: [
            { term: "Bring about", phonetic: "/brɪŋ əˈbaʊt/", partOfSpeech: "verb", meaning: "Gây ra, mang lại", exampleSentence: "The reform will bring about major changes.", exampleMeaning: "Cải cách sẽ mang lại những thay đổi lớn." },
            { term: "Come across", phonetic: "/kʌm əˈkrɒs/", partOfSpeech: "verb", meaning: "Tình cờ gặp", exampleSentence: "I came across an old photo in the attic.", exampleMeaning: "Tôi tình cờ thấy một bức ảnh cũ trên gác xép." },
            { term: "Carry out", phonetic: "/ˈkær.i aʊt/", partOfSpeech: "verb", meaning: "Tiến hành, thực hiện", exampleSentence: "They decided to carry out the survey.", exampleMeaning: "Họ quyết định tiến hành cuộc khảo sát." },
            { term: "Make up for", phonetic: "/meɪk ʌp fɔːr/", partOfSpeech: "verb", meaning: "Bù đắp cho", exampleSentence: "Hard work can make up for a lack of talent.", exampleMeaning: "Chăm chỉ có thể bù đắp cho sự thiếu hụt tài năng." },
          ],
        },
      ],
    },
    {
      slug: "cambridge-in-use",
      title: "Cambridge In Use",
      subtitle: "Bộ giáo trình chuẩn Cambridge kinh điển cho mọi trình độ",
      description: "Bộ sách học từ vựng tiếng Anh theo ngữ cảnh thực tế hàng đầu thế giới.",
      icon: "📖",
      coverColor: "#059669",
      level: "ADVANCED",
      order: 4,
      sets: [
        {
          orderNumber: 1,
          title: "Work & Professional Life",
          description: "Từ vựng về công việc, đồng nghiệp, giờ làm việc và sự nghiệp.",
          isPro: false,
          words: [
            { term: "Commute", phonetic: "/kəˈmjuːt/", partOfSpeech: "verb", meaning: "Đi lại hàng ngày đi làm", exampleSentence: "He commutes by train every morning.", exampleMeaning: "Anh ấy đi tàu điện đi làm mỗi sáng." },
            { term: "Colleague", phonetic: "/ˈkɒl.iːɡ/", partOfSpeech: "noun", meaning: "Đồng nghiệp", exampleSentence: "She gets along well with all her colleagues.", exampleMeaning: "Cô ấy hòa đồng rất tốt với tất cả đồng nghiệp." },
            { term: "Deadline", phonetic: "/ˈded.laɪn/", partOfSpeech: "noun", meaning: "Hạn chót", exampleSentence: "We have to meet the project deadline.", exampleMeaning: "Chúng tôi phải kịp hạn chót dự án." },
          ],
        },
      ],
    },
    {
      slug: "toeic-600-essential",
      title: "TOEIC 600+ Cốt lõi",
      subtitle: "50 chủ đề từ vựng vàng trong đề thi TOEIC format mới",
      description: "Nắm chắc 600 từ vựng cốt lõi về hợp đồng, mua sắm, quảng cáo, hội nghị thương mại.",
      icon: "💼",
      coverColor: "#f59e0b",
      level: "INTERMEDIATE",
      order: 5,
      sets: [
        {
          orderNumber: 1,
          title: "Contracts & Agreements",
          description: "Hợp đồng, thỏa thuận và nghĩa vụ pháp lý trong kinh doanh.",
          isPro: false,
          words: [
            { term: "Agreement", phonetic: "/əˈɡriː.mənt/", partOfSpeech: "noun", meaning: "Sự thỏa thuận, hợp đồng", exampleSentence: "Both parties reached an agreement.", exampleMeaning: "Cả hai bên đã đạt được một sự thỏa thuận." },
            { term: "Obligation", phonetic: "/ˌɒb.lɪˈɡeɪ.ʃən/", partOfSpeech: "noun", meaning: "Nghĩa vụ, bổn phận", exampleSentence: "Employers have legal obligations.", exampleMeaning: "Người sử dụng lao động có các nghĩa vụ pháp lý." },
            { term: "Assurance", phonetic: "/əˈʃɔː.rəns/", partOfSpeech: "noun", meaning: "Sự đảm bảo, cam đoan", exampleSentence: "He gave us his assurance of quality.", exampleMeaning: "Anh ấy đã đưa ra lời đảm bảo về chất lượng." },
          ],
        },
      ],
    },
    {
      slug: "destination-b1-b2",
      title: "Destination B1-B2",
      subtitle: "Cẩm nang bứt phá ngữ pháp & từ vựng học thuật đỉnh cao",
      description: "Tổng hợp từ vựng học thuật, Collocations và Cụm từ chuyên sâu cho kỳ thi quốc tế.",
      icon: "🚀",
      coverColor: "#ec4899",
      level: "ADVANCED",
      order: 6,
      sets: [
        {
          orderNumber: 1,
          title: "Education & Learning",
          description: "Các thuật ngữ giáo dục, học phần, bằng cấp và thành tựu.",
          isPro: false,
          words: [
            { term: "Curriculum", phonetic: "/kəˈrɪk.jə.ləm/", partOfSpeech: "noun", meaning: "Chương trình giảng dạy", exampleSentence: "The school updated its science curriculum.", exampleMeaning: "Trường đã cập nhật chương trình giảng dạy khoa học." },
            { term: "Discipline", phonetic: "/ˈdɪs.ə.plɪn/", partOfSpeech: "noun", meaning: "Kỷ luật, rèn luyện", exampleSentence: "Self-discipline is essential for success.", exampleMeaning: "Tính tự kỷ luật là điều cần thiết để thành công." },
            { term: "Graduate", phonetic: "/ˈɡrædʒ.u.eɪt/", partOfSpeech: "verb", meaning: "Tốt nghiệp", exampleSentence: "She will graduate from university next month.", exampleMeaning: "Cô ấy sẽ tốt nghiệp đại học vào tháng tới." },
          ],
        },
      ],
    },
  ];

  for (const cData of additionalCourses) {
    const course = await prisma.vocabCourse.upsert({
      where: { slug: cData.slug },
      update: {
        title: cData.title,
        subtitle: cData.subtitle,
        description: cData.description,
        icon: cData.icon,
        coverColor: cData.coverColor,
        level: cData.level,
        order: cData.order,
      },
      create: {
        slug: cData.slug,
        title: cData.title,
        subtitle: cData.subtitle,
        description: cData.description,
        icon: cData.icon,
        coverColor: cData.coverColor,
        level: cData.level,
        isPublished: true,
        order: cData.order,
      },
    });

    for (const sData of cData.sets) {
      const set = await prisma.wordSet.upsert({
        where: {
          courseId_orderNumber: {
            courseId: course.id,
            orderNumber: sData.orderNumber,
          },
        },
        update: {
          title: sData.title,
          description: sData.description,
          isPro: sData.isPro,
        },
        create: {
          courseId: course.id,
          orderNumber: sData.orderNumber,
          title: sData.title,
          description: sData.description,
          isPro: sData.isPro,
        },
      });

      for (let i = 0; i < sData.words.length; i++) {
        const w = sData.words[i];
        const existing = await prisma.vocabWord.findFirst({
          where: { wordSetId: set.id, term: w.term },
        });

        if (!existing) {
          await prisma.vocabWord.create({
            data: {
              wordSetId: set.id,
              term: w.term,
              phonetic: w.phonetic,
              partOfSpeech: w.partOfSpeech,
              meaning: w.meaning,
              exampleSentence: w.exampleSentence || null,
              exampleMeaning: w.exampleMeaning || null,
              order: i + 1,
            },
          });
        }
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
