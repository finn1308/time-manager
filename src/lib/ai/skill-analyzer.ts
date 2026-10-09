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

export async function generateSkillRoadmap(skillId: string, userId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new Error("Skill not found");

  const activeKey = await prisma.userApiKey.findFirst({
    where: { userId, isActive: true, provider: "GEMINI" },
  });

  if (!activeKey) {
    throw new Error("No active Gemini API key found for this user.");
  }

  const plainApiKey = decryptApiKey(activeKey.encryptedKey, activeKey.iv, activeKey.authTag);

  const userPrompt = `Hãy thiết kế lộ trình học kỹ năng: ${skill.name}
Trình độ hiện tại: ${skill.level}
Mục tiêu: ${skill.targetLevel || "Thành thạo"}
Mô tả/Chi tiết: ${skill.specificGoal || "Không có"}
Thời gian dự kiến mỗi tuần: ${skill.weeklyHoursCommitment || 5} giờ.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${plainApiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: ULTRA_LEARNING_PROMPT }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Invalid response from Gemini API");
  }

  const parsed = JSON.parse(text);
  return parsed;
}
