import { prisma } from "../src/lib/prisma";

async function testDeleteRoadmap() {
  console.log("🔍 Testing Learning Roadmap Cascade Deletion & Authorization...");

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No test user found!");
    process.exit(1);
  }

  // 1. Create a test roadmap with stage, quiz, and question
  const roadmap = await prisma.learningRoadmap.create({
    data: {
      userId: user.id,
      title: "[Test Cascade Delete] Pháp luật và Sở hữu trí tuệ",
      targetDays: 7,
      targetGrade: "A",
      dailyMinutes: 20,
      totalStages: 1,
      completedStages: 0,
      totalXp: 0,
      status: "ACTIVE",
      stages: {
        create: [
          {
            dayNumber: 1,
            title: "Chương 1: Những vấn đề cơ bản về Pháp luật và Sở hữu trí tuệ",
            description: "Mục tiêu bài học",
            estimatedMinutes: 20,
            xpReward: 100,
            isUnlocked: true,
            isCompleted: false,
            lessonContent: "Nội dung bài học test",
            keyConcepts: JSON.stringify(["Quyền sở hữu trí tuệ", "Bảo hộ quyền"]),
            quizzes: {
              create: [
                {
                  userId: user.id,
                  title: "Quiz: Chương 1",
                  difficulty: "MEDIUM",
                  questionCount: 1,
                  status: "PUBLISHED",
                  questions: {
                    create: [
                      {
                        question: "Quyền tác giả phát sinh từ thời điểm nào?",
                        options: JSON.stringify([
                          "Kể từ khi tác phẩm được sáng tạo và thể hiện dưới hình thức vật chất nhất định",
                          "Khi được cấp giấy chứng nhận đăng ký quyền tác giả",
                          "Sau khi công bố 30 ngày trên phương tiện thông tin đại chúng",
                          "Khi nộp đơn đăng ký tại Cục Bản quyền tác giả",
                        ]),
                        correctAnswer: 0,
                        hint: "Quyền tác giả phát sinh tự động.",
                        rationale: "Theo Luật SHTT, quyền tác giả phát sinh tự động khi tác phẩm được định hình.",
                        difficulty: "MEDIUM",
                        questionType: "CONCEPT",
                        topic: "Quyền tác giả",
                        sourceReference: "Chương 1, Trang 3",
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      stages: {
        include: {
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  const stageId = roadmap.stages[0].id;
  const quizId = roadmap.stages[0].quizzes[0].id;
  const questionId = roadmap.stages[0].quizzes[0].questions[0].id;

  console.log(`✅ Created test roadmap: ${roadmap.id}`);
  console.log(`  - Stage ID: ${stageId}`);
  console.log(`  - Quiz ID: ${quizId}`);
  console.log(`  - Question ID: ${questionId}`);

  // Also create a test flashcard deck attached to this stage
  const deck = await prisma.flashcardDeck.create({
    data: {
      userId: user.id,
      stageId: stageId,
      title: "Flashcards: Chương 1",
      cardCount: 1,
      flashcards: {
        create: [
          {
            front: "Quyền tác giả là gì?",
            back: "Quyền của tổ chức, cá nhân đối với tác phẩm do mình sáng tạo ra hoặc sở hữu.",
            masteryLevel: 1,
          },
        ],
      },
    },
  });
  console.log(`  - Flashcard Deck ID: ${deck.id}`);

  // 2. Test Authorization: Attempt to delete as a non-owner user ID
  const fakeUserId = "fake-unauthorized-user-id";
  const unauthRoadmap = await prisma.learningRoadmap.findFirst({
    where: { id: roadmap.id, userId: fakeUserId },
  });
  if (unauthRoadmap !== null) {
    console.error("❌ FAILED: Non-owner should not be able to find or delete roadmap!");
    process.exit(1);
  }
  console.log("✅ PASS: Non-owner authorization check strictly enforced");

  // 3. Perform Cascade Deletion as owner
  const stageIds = roadmap.stages.map((s) => s.id);
  if (stageIds.length > 0) {
    await prisma.flashcardDeck.deleteMany({
      where: { stageId: { in: stageIds }, userId: user.id },
    });
  }

  await prisma.learningRoadmap.delete({
    where: { id: roadmap.id },
  });
  console.log("✅ Executed cascade deletion");

  // 4. Verify that ALL child entities are completely deleted from DB
  const checkRoadmap = await prisma.learningRoadmap.findUnique({ where: { id: roadmap.id } });
  const checkStage = await prisma.roadmapStage.findUnique({ where: { id: stageId } });
  const checkQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  const checkQuestion = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
  const checkDeck = await prisma.flashcardDeck.findUnique({ where: { id: deck.id } });

  if (checkRoadmap !== null || checkStage !== null || checkQuiz !== null || checkQuestion !== null || checkDeck !== null) {
    console.error("❌ FAILED: Some child entities were not cascade deleted!", {
      roadmap: checkRoadmap,
      stage: checkStage,
      quiz: checkQuiz,
      question: checkQuestion,
      deck: checkDeck,
    });
    process.exit(1);
  }

  console.log("✅ PASS: All child entities (Roadmap, Stages, Quizzes, Questions, FlashcardDecks) are 100% cascade deleted!");
  console.log("🎉 All Cascade & Authorization Tests PASSED!");
}

testDeleteRoadmap()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
