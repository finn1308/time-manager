/**
 * Centralized, resilient Google Gemini API integration for ChronoMind.
 *
 * Resolves models dynamically to prevent 404 errors caused by model deprecations,
 * account tier variations, or regional differences in the Google Generative Language API.
 */

interface GeminiModelItem {
  name: string; // e.g. "models/gemini-1.5-flash-latest"
  supportedGenerationMethods?: string[];
  displayName?: string;
}

// In-memory cache for resolved models to prevent redundant GET /models calls
const modelCache = new Map<string, { model: string; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const PREFERRED_MODEL_ORDER = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-pro",
];

/**
 * Normalizes a model identifier by removing leading "models/" prefix
 */
export function cleanModelName(name: string): string {
  return name.replace(/^models\//, "");
}

/**
 * Fetches the list of active models directly supported by the provided API key
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) {
      return [];
    }

    const usableModels = (data.models as GeminiModelItem[])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => cleanModelName(m.name));

    return usableModels;
  } catch (err) {
    console.warn("Could not query Gemini models list, using fallback priority list:", err);
    return [];
  }
}

/**
 * Dynamically resolves the best active Gemini model for the key
 */
export async function getBestGeminiModel(apiKey: string): Promise<string> {
  const cached = modelCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.model;
  }

  const available = await fetchAvailableGeminiModels(apiKey);

  let chosen = "gemini-1.5-flash-latest";

  if (available.length > 0) {
    // Check if any of our preferred models are present in the key's available list
    for (const pref of PREFERRED_MODEL_ORDER) {
      if (available.some((m) => m.toLowerCase().includes(pref.toLowerCase()))) {
        const match = available.find((m) => m.toLowerCase().includes(pref.toLowerCase()));
        if (match) {
          chosen = match;
          break;
        }
      }
    }

    // If none of our preferred names match, use the first model supporting generateContent
    if (!chosen && available.length > 0) {
      chosen = available[0];
    }
  }

  modelCache.set(apiKey, { model: chosen, timestamp: Date.now() });
  return chosen;
}

export interface GeminiGenerateOptions {
  apiKey: string;
  contents: Array<{
    role?: string;
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
  systemInstruction?: string;
}

/**
 * Resilient Gemini Content Generation with automated multi-model fallback cascade.
 * Tries the best discovered model first, then cascades through known alternatives if 404 occurs.
 */
export async function callGeminiGenerate(
  options: GeminiGenerateOptions
): Promise<{ text: string; modelUsed: string }> {
  const { apiKey, contents, generationConfig, systemInstruction } = options;

  const bestModel = await getBestGeminiModel(apiKey);

  // Build candidate cascade list, deduplicating models
  const candidateModels = Array.from(
    new Set([
      bestModel,
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ])
  );

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    // Try v1beta first, then v1 if 404
    const apiVersions = ["v1beta", "v1"];

    for (const apiVersion of apiVersions) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

        const requestBody: any = { contents };

        if (generationConfig) {
          requestBody.generationConfig = generationConfig;
        }

        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 404) {
          // Model not found on this version/endpoint, try next
          console.warn(`[Gemini API] Model ${model} returned 404 on ${apiVersion}, trying next candidate...`);
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          let parsedMsg = errText;
          try {
            const errJson = JSON.parse(errText);
            parsedMsg = errJson.error?.message || errText;
          } catch {
            // keep raw
          }
          throw new Error(`Google Gemini Error (${res.status}): ${parsedMsg}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (typeof text !== "string") {
          throw new Error("Phản hồi từ Google Gemini không chứa nội dung hợp lệ.");
        }

        // Cache the successful model for future calls
        modelCache.set(apiKey, { model, timestamp: Date.now() });

        return { text, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        // If it was a network abort or non-404 error, we check if it is worth retrying or failing
        if (err.message && !err.message.includes("404")) {
          // Only break out if it's an explicit authentication/permission error
          if (err.message.includes("API key not valid") || err.message.includes("PERMISSION_DENIED")) {
            throw err;
          }
        }
      }
    }
  }

  throw lastError || new Error("Không thể kết nối đến bất kỳ mô hình Google Gemini nào (404 Not Found). Vui lòng kiểm tra lại API key của bạn.");
}

/**
 * Dedicated test connection handler for Google Gemini.
 * Verifies key validity and ensures generateContent capability.
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message?: string; model?: string; error?: string }> {
  try {
    // Step 1: Query the models endpoint to test authentication without relying on a specific model name
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!modelsRes.ok) {
      const errText = await modelsRes.text();
      let cleanMessage = "API Key không hợp lệ hoặc đã bị khóa.";
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          cleanMessage = errJson.error.message;
        }
      } catch {
        // fallback
      }
      return {
        success: false,
        error: `Xác thực Google Gemini thất bại: ${cleanMessage}`,
      };
    }

    const modelsData = await modelsRes.json();
    const available = (modelsData.models as GeminiModelItem[] || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => cleanModelName(m.name));

    if (available.length === 0) {
      return {
        success: false,
        error: "API Key hợp lệ nhưng tài khoản chưa được cấp quyền truy cập mô hình tạo nội dung (generateContent).",
      };
    }

    // Step 2: Pick the best available model and send a quick test prompt to verify generation quota
    let chosenModel = available[0];
    for (const pref of PREFERRED_MODEL_ORDER) {
      const match = available.find((m) => m.toLowerCase().includes(pref.toLowerCase()));
      if (match) {
        chosenModel = match;
        break;
      }
    }

    const testRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
        }),
      }
    );

    if (!testRes.ok) {
      // If chosen model failed, try any other available model
      let succeededModel: string | null = null;
      for (const altModel of available) {
        if (altModel === chosenModel) continue;
        const altRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${altModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "ping" }] }],
            }),
          }
        );
        if (altRes.ok) {
          succeededModel = altModel;
          break;
        }
      }

      if (succeededModel) {
        modelCache.set(apiKey, { model: succeededModel, timestamp: Date.now() });
        return {
          success: true,
          model: succeededModel,
          message: `Kết nối Google Gemini thành công! (Mô hình khả dụng: ${succeededModel})`,
        };
      }

      const errText = await testRes.text();
      return {
        success: false,
        error: `Không thể tạo nội dung với mô hình ${chosenModel}: ${errText.slice(0, 150)}`,
      };
    }

    modelCache.set(apiKey, { model: chosenModel, timestamp: Date.now() });

    return {
      success: true,
      model: chosenModel,
      message: `Kết nối Google Gemini thành công! (Mô hình khả dụng: ${chosenModel})`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Lỗi kết nối đến Google Gemini API.",
    };
  }
}
