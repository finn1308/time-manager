import { prisma } from "../prisma";
import { decryptApiKey } from "../crypto";

const ULTRA_LEARNING_PROMPT = `Bạn là Chuyên gia Học tập Nâng cao (Master Ultra Learning Coach). 
Nhiệm vụ của bạn là phân tích một Kỹ năng và thiết kế Bản đồ Kiến thức (Knowledge Map) cùng Lộ trình Học tập siêu tốc dựa trên nguyên lý Ultra Learning.

Hãy trả về CHỈ MỘT JSON hợp lệ có cấu trúc sau:
{
  "knowledgeMap": {
    "domains": ["Tên lĩnh vực lớn 1", "Tên lĩnh vực lớn 2"],
    "coreConcepts": ["Khái niệm 1", "Khái niệm 2"],
    "commonMistakes": ["Lỗi 1", "Lỗi 2"]
  },
  "learningStrategy": {
    "metalearning": "Chiến lược học cách học...",
    "focus": "Cách duy trì sự tập trung...",
    "directness": "Bài tập thực hành trực tiếp...",
    "drill": "Các bài tập lặp lại để khắc phục điểm yếu...",
    "retrieval": "Cách ứng dụng Active Recall..."
  },
  "phases": [
    {
      "name": "Tên Phase 1 (vd: Nền tảng)",
      "description": "Mô tả phase",
      "plannedHours": 10,
      "units": [
        {
          "name": "Tên Unit 1",
          "description": "Mô tả unit",
          "plannedMinutes": 120,
          "tasks": [
            {
              "name": "Bài tập 1",
              "description": "Thực hành...",
              "taskType": "THEORY",
              "plannedMinutes": 30
            },
            {
              "name": "Bài tập 2",
              "description": "Luyện tập ứng dụng...",
              "taskType": "PRACTICE",
              "plannedMinutes": 90
            }
          ]
        }
      ]
    }
  ]
}

Tuyệt đối không phản hồi gì khác ngoài chuỗi JSON này (không có markdown \`\`\`json).`;

export interface SkillRoadmapResult {
  knowledgeMap: {
    domains: string[];
    coreConcepts: string[];
    commonMistakes: string[];
  };
  learningStrategy: {
    metalearning: string;
    focus: string;
    directness: string;
    drill: string;
    retrieval: string;
  };
  phases: Array<{
    name: string;
    description?: string;
    plannedHours?: number;
    units: Array<{
      name: string;
      description?: string;
      plannedMinutes?: number;
      tasks: Array<{
        name: string;
        description?: string;
        taskType?: string;
        plannedMinutes?: number;
      }>;
    }>;
  }>;
}

/**
 * High-quality deterministic Ultra Learning heuristic fallback generator
 */
export function generateHeuristicSkillRoadmap(skill: {
  name: string;
  level?: string | null;
  targetLevel?: string | null;
  specificGoal?: string | null;
  weeklyHoursCommitment?: number | null;
  category?: string | null;
}): SkillRoadmapResult {
  const skillName = skill.name || "Kỹ năng";
  const target = skill.targetLevel || "Thành thạo";
  const weeklyHours = skill.weeklyHoursCommitment || 6;
  const goal = skill.specificGoal || `Đạt mức độ ${target} trong thời gian ngắn nhất.`;

  return {
    knowledgeMap: {
      domains: [
        `Cơ sở lý thuyết & Nguyên lý cốt lõi của ${skillName}`,
        `Kỹ thuật thực hành ứng dụng & Xây dựng phản xạ`,
        `Tối ưu hóa, Giải quyết tình huống thực tế & Đánh giá năng lực`,
      ],
      coreConcepts: [
        `Khung tư duy chuyên môn & Thuật ngữ trọng tâm ${skillName}`,
        `Quy trình thực thi chuẩn (Standard Operating Procedure)`,
        `Phương pháp phân tích bài toán & Khắc phục lỗi sai thường gặp`,
      ],
      commonMistakes: [
        "Học thụ động (chỉ đọc hoặc xem hướng dẫn mà không tự thực hành độc lập)",
        "Thiếu các bài tập Drilling lặp lại có chủ đích vào điểm yếu nhất",
        "Không kiểm tra phản xạ bằng Active Recall định kỳ",
      ],
    },
    learningStrategy: {
      metalearning: `Phân rã kỹ năng ${skillName} theo nguyên tắc Pareto 80/20: Tập trung làm chủ 20% khái niệm nền tảng tạo ra 80% kết quả thực tiễn. Mục tiêu: ${goal}`,
      focus: `Duy trì các khối học sâu (Deep Work) từ 45 - 90 phút/buổi, cam kết tối thiểu ${weeklyHours} giờ/tuần. Loại bỏ toàn bộ thông báo và xao nhãng.`,
      directness: `Học qua hành động trực tiếp (Direct Practice): Áp dụng ngay kiến thức vào bài tập cụ thể hoặc dự án thực tế ngay từ ngày đầu.`,
      drill: `Xác định các mắt xích yếu nhất trong quá trình thực hành để tách riêng ra và luyện tập lặp đi lặp lại với cường độ cao.`,
      retrieval: `Ứng dụng kỹ thuật Feynman và Active Recall: Tự giải thích lại bản chất bài học không nhìn tài liệu sau mỗi phiên học.`,
    },
    phases: [
      {
        name: `Giai đoạn 1: Nền tảng cốt lõi & Metalearning (${skillName})`,
        description: `Giải mã cấu trúc kỹ năng, nắm vững các khái niệm và nguyên lý hoạt động căn bản nhất.`,
        plannedHours: Math.max(4, Math.round(weeklyHours * 1.5)),
        units: [
          {
            name: `Khởi động & Giải mã kiến thức nền tảng`,
            description: `Tìm hiểu các khái niệm mấu chốt và thuật ngữ không thể bỏ qua của ${skillName}.`,
            plannedMinutes: 120,
            tasks: [
              {
                name: `Nghiên cứu nguyên lý & thuật ngữ cốt lõi`,
                description: `Đọc và ghi chú có cấu trúc các khái niệm căn bản của ${skillName}.`,
                taskType: "THEORY",
                plannedMinutes: 45,
              },
              {
                name: `Thực hành bài tập cơ sở đầu tiên`,
                description: `Làm bài tập ứng dụng trực tiếp các khái niệm vừa học.`,
                taskType: "PRACTICE",
                plannedMinutes: 45,
              },
              {
                name: `Active Recall: Tự tóm tắt không nhìn tài liệu`,
                description: `Tự viết ra các ý chính và giải thích lại bằng ngôn ngữ của bản thân.`,
                taskType: "RETRIEVAL",
                plannedMinutes: 30,
              },
            ],
          },
          {
            name: `Thiết lập môi trường & Phương pháp thực hành`,
            description: `Chuẩn bị đầy đủ công cụ và quy trình luyện tập hiệu quả.`,
            plannedMinutes: 90,
            tasks: [
              {
                name: `Thiết lập không gian & tài liệu học tập chuẩn`,
                description: `Tối ưu tài liệu tham khảo và công cụ thực hành chuyên sâu.`,
                taskType: "THEORY",
                plannedMinutes: 30,
              },
              {
                name: `Bài tập tình huống cơ bản có hướng dẫn`,
                description: `Giải quyết tình huống mẫu theo các bước chuẩn mực.`,
                taskType: "PRACTICE",
                plannedMinutes: 60,
              },
            ],
          },
        ],
      },
      {
        name: `Giai đoạn 2: Thực hành trực tiếp & Ứng dụng thực tiễn`,
        description: `Tăng cường độ luyện tập thông qua các tình huống thực tế và bài tập độc lập.`,
        plannedHours: Math.max(6, Math.round(weeklyHours * 2)),
        units: [
          {
            name: `Ứng dụng độc lập không nhìn tài liệu`,
            description: `Thực hành giải quyết bài toán thực tế để kiểm tra độ hiểu sâu.`,
            plannedMinutes: 150,
            tasks: [
              {
                name: `Thực hành bài toán tình huống thực tế`,
                description: `Vận dụng toàn bộ kiến thức đã học vào tình huống thực tế hoàn chỉnh.`,
                taskType: "PRACTICE",
                plannedMinutes: 60,
              },
              {
                name: `Drill: Luyện tập khắc phục lỗi sai điển hình`,
                description: `Tập trung khoan sâu vào những phần hay nhầm lẫn nhất.`,
                taskType: "DRILL",
                plannedMinutes: 45,
              },
              {
                name: `Đánh giá phản xạ & Rút kinh nghiệm`,
                description: `Ghi nhận thời gian hoàn thành và so sánh với chuẩn mực.`,
                taskType: "RETRIEVAL",
                plannedMinutes: 45,
              },
            ],
          },
        ],
      },
      {
        name: `Giai đoạn 3: Khoan sâu điểm yếu & Phản xạ nâng cao`,
        description: `Tách nhỏ các kỹ năng thành phần để luyện tập lặp lại cường độ cao.`,
        plannedHours: Math.max(5, Math.round(weeklyHours * 1.5)),
        units: [
          {
            name: `Khoan sâu điểm yếu (Drilling Sessions)`,
            description: `Luyện tập phản xạ nhanh và xử lý các ca ngoại lệ hoặc độ khó cao.`,
            plannedMinutes: 120,
            tasks: [
              {
                name: `Drill nâng cao: Tình huống độ khó cao`,
                description: `Thử thách bản thân với các yêu cầu phức tạp và giới hạn thời gian.`,
                taskType: "DRILL",
                plannedMinutes: 60,
              },
              {
                name: `Tự kiểm tra toàn diện (Mock Test)`,
                description: `Thực hiện bài kiểm tra mô phỏng điều kiện thực tế.`,
                taskType: "RETRIEVAL",
                plannedMinutes: 60,
              },
            ],
          },
        ],
      },
      {
        name: `Giai đoạn 4: Dự án tổng hợp & Thành thạo (${target})`,
        description: `Hoàn thiện dự án hoặc kỳ thi đánh giá năng lực cuối cùng để đạt mức độ ${target}.`,
        plannedHours: Math.max(4, Math.round(weeklyHours * 1)),
        units: [
          {
            name: `Dự án tổng hợp Capstone & Đánh giá năng lực`,
            description: `Chứng minh năng lực thành thạo thông qua sản phẩm hoặc bài thi thực tế.`,
            plannedMinutes: 150,
            tasks: [
              {
                name: `Thực hiện dự án/bài thi mô phỏng hoàn chỉnh`,
                description: `Tạo ra sản phẩm thực tế hoặc hoàn thành bài thi mô phỏng đầy đủ.`,
                taskType: "PROJECT",
                plannedMinutes: 90,
              },
              {
                name: `Tổng kết, đo lường năng lực & Lập kế hoạch duy trì`,
                description: `Phân tích kết quả đạt được so với mục tiêu ban đầu và định hướng duy trì.`,
                taskType: "RETRIEVAL",
                plannedMinutes: 60,
              },
            ],
          },
        ],
      },
    ],
  };
}

export async function generateSkillRoadmap(skillId: string, userId: string): Promise<SkillRoadmapResult> {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new Error("Skill not found");

  const userPrompt = `Hãy thiết kế lộ trình học kỹ năng: ${skill.name}
Trình độ hiện tại: ${skill.level || "BEGINNER"}
Mục tiêu: ${skill.targetLevel || "Thành thạo"}
Mô tả/Chi tiết: ${skill.specificGoal || "Không có"}
Thời gian dự kiến mỗi tuần: ${skill.weeklyHoursCommitment || 5} giờ.`;

  // 1. Try with user's configured AI key or system environment key
  try {
    let apiKey: string | null = null;
    let provider = "GEMINI";

    const userGeminiKey = await prisma.userApiKey.findFirst({
      where: { userId, isActive: true, provider: "GEMINI" },
    });

    if (userGeminiKey) {
      apiKey = decryptApiKey(userGeminiKey.encryptedKey, userGeminiKey.iv, userGeminiKey.authTag);
      provider = "GEMINI";
    } else {
      const otherKey = await prisma.userApiKey.findFirst({
        where: { userId, isActive: true },
      });
      if (otherKey) {
        apiKey = decryptApiKey(otherKey.encryptedKey, otherKey.iv, otherKey.authTag);
        provider = otherKey.provider;
      } else if (process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
        provider = "GEMINI";
      }
    }

    if (apiKey && provider === "GEMINI") {
      const { callGeminiGenerate } = await import("./gemini");
      const { text } = await callGeminiGenerate({
        apiKey,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: ULTRA_LEARNING_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      if (text) {
        let cleanJson = text.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
        }
        const parsed = JSON.parse(cleanJson);
        if (parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          return parsed as SkillRoadmapResult;
        }
      }
    } else if (apiKey && provider === "OPENAI") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: ULTRA_LEARNING_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
            return parsed as SkillRoadmapResult;
          }
        }
      }
    }
  } catch (aiErr) {
    console.warn("[generateSkillRoadmap] AI provider error, using high-quality Ultra Learning fallback:", aiErr);
  }

  // 2. Safe and comprehensive heuristic fallback
  return generateHeuristicSkillRoadmap(skill);
}

export async function generateAdaptiveTasks(
  skillName: string,
  targetLevel: string,
  completedTasks: any[],
  sessions: any[]
) {
  const prompt = `Bạn là một chuyên gia về Ultra Learning. Học viên đang học kỹ năng "${skillName}" để đạt trình độ "${targetLevel}".
Dưới đây là danh sách các bài tập đã hoàn thành:
${JSON.stringify(completedTasks, null, 2)}
Dưới đây là lịch sử học tập (StudySessions) kèm theo ghi chú và điểm năng suất:
${JSON.stringify(sessions, null, 2)}

Dựa trên nguyên lý Ultra Learning (Đặc biệt là Drill và Retrieval), hãy phân tích những điểm yếu hoặc khó khăn (thông qua ghi chú hoặc thời gian học) và đề xuất 1 đến 3 bài tập (SkillTask) mới để khắc phục. 
CHỈ đề xuất những bài tập thực sự cần thiết. Trả về JSON theo cấu trúc:
{
  "tasks": [
    {
      "name": "Tên bài tập (VD: Luyện tập vòng lặp while)",
      "description": "Mô tả chi tiết và cách luyện tập",
      "taskType": "DRILL",
      "plannedMinutes": 30
    }
  ],
  "reasoning": "Giải thích ngắn gọn tại sao đề xuất các bài tập này"
}`;

  try {
    const { callGeminiGenerate } = await import("./gemini");
    const activeKey = await prisma.userApiKey.findFirst({
      where: { isActive: true, provider: "GEMINI" },
    });
    const keyToUse = activeKey
      ? decryptApiKey(activeKey.encryptedKey, activeKey.iv, activeKey.authTag)
      : process.env.GEMINI_API_KEY;

    if (keyToUse) {
      const { text } = await callGeminiGenerate({
        apiKey: keyToUse,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      });
      if (text) {
        let clean = text.trim();
        if (clean.startsWith("```json")) {
          clean = clean.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        } else if (clean.startsWith("```")) {
          clean = clean.replace(/^```\s*/, "").replace(/```$/, "").trim();
        }
        return JSON.parse(clean);
      }
    }
  } catch (err) {
    console.warn("generateAdaptiveTasks Gemini error, using fallback:", err);
  }

  return {
    tasks: [
      {
        name: `Luyện tập chuyên sâu: ${skillName}`,
        description: `Thực hành khắc phục điểm yếu và nâng cao độ thuần thục kỹ năng ${skillName}.`,
        taskType: "DRILL",
        plannedMinutes: 30,
      },
    ],
    reasoning: "Gợi ý tự động để củng cố kỹ năng dựa trên tiến độ học tập hiện tại.",
  };
}
