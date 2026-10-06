"use client";

/**
 * Clean text for Text-to-Speech:
 * Removes phonetics, brackets, and extra punctuation before speaking.
 */
export function sanitizeTextForTTS(text: string): string {
  if (!text) return "";
  return text
    .split("\n")[0]
    .replace(/\/.*?\/|\(.*?\)|\[.*?\]/g, "")
    .replace(/[^a-zA-Z0-9\s'-]/g, "")
    .trim();
}

/**
 * Speaks an English word or sentence using Web Speech API.
 * Rate: 1.0 (normal) or 0.75 (slow).
 */
export function speakWord(text: string, rate: number = 1.0, lang: string = "en-US"): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("SpeechSynthesis is not supported in this browser.");
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance

      const cleanText = sanitizeTextForTTS(text);
      if (!cleanText) {
        resolve(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = Math.max(0.5, Math.min(1.5, rate));
      utterance.pitch = 1.0;
      utterance.lang = lang;

      // Find an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang.startsWith("en-US") || v.lang.startsWith("en_US")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.warn("TTS error:", e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS invocation error:", err);
      resolve(false);
    }
  });
}
