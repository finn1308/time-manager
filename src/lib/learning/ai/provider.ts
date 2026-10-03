import { prisma } from "../../prisma";
import { decryptApiKey } from "../../crypto";
import { AiLearningAnalysisResponse, AiLearningAnalysisSchema } from "../types";

export interface AIProviderCallParams {
  systemPrompt: string;
  userPrompt: string;
  userId?: string;
}

export interface AIProviderResult {
  data: AiLearningAnalysisResponse;
  providerUsed: string;
}

/**
 * Multi-Provider AI Abstraction Interface
 */
export interface AIProvider {
  name: string;
  analyzeLearningData(params: AIProviderCallParams): Promise<AIProviderResult>;
}

/**
 * Deterministic Local Heuristic Fallback Engine
 * Analyzes patterns without external API calls if AI keys are not configured or offline.
 */
export function generateLocalHeuristicAnalysis(
  userStats: {
    totalWords: number;
    masteredWords: number;
    weakWords: number;
    averageAccuracy: number;
    averageResponseTime: number;
    topWeakWords: Array<{ term: string; meaning: string; consecutiveIncorrect: number; forgettingRisk: number }>;
    topFastWords: Array<{ term: string; meaning: string; knowledgeScore: number }>;
    crossSkillAverages: { recognition: number; recall: number; spelling: number; listening: number; usage: number };
  }
): AiLearningAnalysisResponse {
  // Determine strongest and weakest skills
  const skills = [
    { name: "Nhận diện nghĩa (Recognition)", score: userStats.crossSkillAverages.recognition },
    { name: "Truy xuất chủ động (Active Recall)", score: userStats.crossSkillAverages.recall },
    { name: "Chính tả từ vựng (Spelling & Typing)", score: userStats.crossSkillAverages.spelling },
    { name: "Nghe hiểu phát âm (Listening)", score: userStats.crossSkillAverages.listening },
    { name: "Ngữ cảnh & Đặt câu (Contextual Usage)", score: userStats.crossSkillAverages.usage },
  ];
  skills.sort((a, b) => b.score - a.score);

  const strongestArea = `${skills[0].name} (Độ thành thạo ~${Math.round(skills[0].score * 100)}%)`;
  const weakestArea = `${skills[skills.length - 1].name} (Độ thành thạo ~${Math.round(skills[skills.length - 1].score * 100)}%)`;

  const wordsNeedingAttention = userStats.topWeakWords.slice(0, 5).map((w) => ({
    term: w.term,
    meaning: w.meaning,
    reason:
      w.consecutiveIncorrect > 1
        ? `Thất bại liên tiếp ${w.consecutiveIncorrect} lần khi ôn tập`
        : `Nguy cơ quên lãng đạt ${Math.round(w.forgettingRisk * 100)}% do đã lâu chưa ôn`,
    forgettingRisk: Math.round(w.forgettingRisk * 100) / 100,
  }));

  const wordsImprovingRapidly = userStats.topFastWords.slice(0, 5).map((w) => ({
    term: w.term,
    masteryScore: Math.round(w.knowledgeScore * 100) / 100,
    notes: `Phản xạ nhanh, chuỗi nhớ tốt, điểm thành thạo đạt ${Math.round(w.knowledgeScore * 100)}%`,
  }));

  const recommendedFocus =
    userStats.weakWords > 0
      ? `Tập trung 15 phút mỗi ngày vào ${userStats.weakWords} từ thuộc nhóm yếu và các từ có nguy cơ quên lãng cao. Chuyển dần từ câu hỏi nhận diện sang gõ chính tả (Spelling).`
      : `Duy trì tần suất ôn tập ngắt quãng (Spaced Repetition) cho các từ đã học để duy trì đường cong trí nhớ trên 90%.`;

  const cognitiveInsights = `Học viên có độ chính xác trung bình ${Math.round(userStats.averageAccuracy * 100)}% với thời gian phản hồi ${userStats.averageResponseTime}s. ${
    userStats.averageResponseTime < 2.5
      ? "Tốc độ xử lý tự tin, phản xạ từ vựng tốt."
      : "Thời gian phản hồi tương đối chậm, cho thấy học viên còn phải dịch thầm trong đầu trước khi chọn đáp án."
  }`;

  let estimatedMasteryGrade: "A+" | "A" | "B" | "C" | "D" | "F" = "C";
  if (userStats.averageAccuracy >= 0.90) estimatedMasteryGrade = "A+";
  else if (userStats.averageAccuracy >= 0.80) estimatedMasteryGrade = "A";
  else if (userStats.averageAccuracy >= 0.70) estimatedMasteryGrade = "B";
  else if (userStats.averageAccuracy >= 0.50) estimatedMasteryGrade = "C";
  else if (userStats.averageAccuracy >= 0.35) estimatedMasteryGrade = "D";
  else estimatedMasteryGrade = "F";

  return {
    strongestArea,
    weakestArea,
    wordsNeedingAttention,
    wordsImprovingRapidly,
    recommendedFocus,
    cognitiveInsights,
    estimatedMasteryGrade,
  };
}

/**
 * Universal AI Dispatcher supporting Gemini, OpenAI, Anthropic & Fallback
 */
export async function executeAiLearningAnalysis(
  userId: string,
  userStats: any
): Promise<AIProviderResult> {
  const systemPrompt = `You are a Senior Cognitive Psychologist and Adaptive Learning AI specialist for the LUYENTU vocabulary platform.
Analyze the user's historical vocabulary learning behavior, error patterns, response speeds, forgetting curves, and cross-skill performance.
Return a STRICT JSON object conforming to this schema:
{
  "strongestArea": "string",
  "weakestArea": "string",
  "wordsNeedingAttention": [
    { "term": "string", "meaning": "string", "reason": "string", "forgettingRisk": number between 0 and 1 }
  ],
  "wordsImprovingRapidly": [
    { "term": "string", "masteryScore": number between 0 and 1, "notes": "string" }
  ],
  "recommendedFocus": "string",
  "cognitiveInsights": "string",
  "estimatedMasteryGrade": "A+" | "A" | "B" | "C" | "D" | "F"
}
Ensure the response is valid JSON without any markdown formatting or commentary. Vietnamese language for descriptions.`;

  const userPrompt = `Here is the user's vocabulary learning data:
- Total words tracked: ${userStats.totalWords}
- Mastered words: ${userStats.masteredWords}
- Weak words: ${userStats.weakWords}
- Average accuracy: ${(userStats.averageAccuracy * 100).toFixed(1)}%
- Average response time: ${userStats.averageResponseTime} seconds
- Cross-skill mastery:
  * Recognition: ${(userStats.crossSkillAverages.recognition * 100).toFixed(1)}%
  * Active Recall: ${(userStats.crossSkillAverages.recall * 100).toFixed(1)}%
  * Spelling/Typing: ${(userStats.crossSkillAverages.spelling * 100).toFixed(1)}%
  * Listening: ${(userStats.crossSkillAverages.listening * 100).toFixed(1)}%
  * Contextual Usage: ${(userStats.crossSkillAverages.usage * 100).toFixed(1)}%
- Top struggling words: ${JSON.stringify(userStats.topWeakWords)}
- Top strong words: ${JSON.stringify(userStats.topFastWords)}

Provide deep cognitive diagnostic analysis and actionable guidance.`;

  // 1. Try User API Key from Database
  const activeKey = await prisma.userApiKey.findFirst({
    where: { userId, isActive: true },
  });

  if (activeKey) {
    try {
      const apiKey = decryptApiKey(activeKey.encryptedKey, activeKey.iv, activeKey.authTag);

      if (activeKey.provider === "GEMINI") {
        return await callGeminiAnalysis(apiKey, systemPrompt, userPrompt);
      } else if (activeKey.provider === "OPENAI") {
        return await callOpenAiAnalysis(apiKey, systemPrompt, userPrompt);
      } else if (activeKey.provider === "ANTHROPIC") {
        return await callAnthropicAnalysis(apiKey, systemPrompt, userPrompt);
      }
    } catch (err) {
      console.warn("User AI Key execution failed, checking env or fallback:", err);
    }
  }

  // 2. Try System Environment Keys (GEMINI_API_KEY, OPENAI_API_KEY)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiAnalysis(process.env.GEMINI_API_KEY, systemPrompt, userPrompt);
    } catch (e) {
      console.warn("System GEMINI_API_KEY failed:", e);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await callOpenAiAnalysis(process.env.OPENAI_API_KEY, systemPrompt, userPrompt);
    } catch (e) {
      console.warn("System OPENAI_API_KEY failed:", e);
    }
  }

  // 3. Fallback: Intelligent Local Cognitive Heuristic Engine
  const localAnalysis = generateLocalHeuristicAnalysis(userStats);
  return {
    data: localAnalysis,
    providerUsed: "LUYENTU Cognitive Heuristic Engine (Local Fallback)",
  };
}

async function callGeminiAnalysis(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIProviderResult> {
  const { callGeminiGenerate } = await import("../../ai/gemini");
  const { text: rawText, modelUsed } = await callGeminiGenerate({
    apiKey,
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt }, { text: userPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const parsed = parseAndValidateAiJson(rawText);
  return {
    data: parsed,
    providerUsed: `Google Gemini (${modelUsed})`,
  };
}

async function callOpenAiAnalysis(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIProviderResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const rawText = json.choices[0].message.content;
  const parsed = parseAndValidateAiJson(rawText);
  return {
    data: parsed,
    providerUsed: "OpenAI GPT-4o-mini",
  };
}

async function callAnthropicAnalysis(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIProviderResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const rawText = json.content[0].text;
  const parsed = parseAndValidateAiJson(rawText);
  return {
    data: parsed,
    providerUsed: "Anthropic Claude 3.5 Sonnet",
  };
}

function parseAndValidateAiJson(rawText: string): AiLearningAnalysisResponse {
  let cleanText = rawText.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }

  const parsed = JSON.parse(cleanText);
  // Strict schema validation using Zod
  return AiLearningAnalysisSchema.parse(parsed);
}
