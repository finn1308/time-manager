"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Key,
  ShieldCheck,
  Check,
  Trash2,
  Globe,
  Cpu,
  AlertCircle,
  RefreshCw,
  Zap,
  Sliders,
  Clock,
  Coffee,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  BatteryCharging,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

interface KeyRecord {
  id: string;
  provider: "GEMINI" | "OPENAI" | "ANTHROPIC";
  isActive: boolean;
  updatedAt: string;
}

interface StudyPreferences {
  maxSessionDurationMins: number;
  breakDurationMins: number;
  pomodoroDurationMins: number;
  pomodoroBreakMins: number;
  preferredStudyHours: string;
  unwantedStudyHours: string;
  maxDailyStudyHours: number;
  maxDailySessions: number;
  restDays: string;
  timePreference: string;
  scheduleFlexibility: string;
  minBreakBetweenSessions: number;
}

const DEFAULT_PREFS: StudyPreferences = {
  maxSessionDurationMins: 90,
  breakDurationMins: 15,
  pomodoroDurationMins: 25,
  pomodoroBreakMins: 5,
  preferredStudyHours: "08:00-11:30,14:00-17:30,19:30-22:30",
  unwantedStudyHours: "23:00-06:00,12:00-13:30",
  maxDailyStudyHours: 6.0,
  maxDailySessions: 4,
  restDays: "0",
  timePreference: "BALANCED",
  scheduleFlexibility: "MODERATE",
  minBreakBetweenSessions: 15,
};

const DAY_LABELS = [
  { day: "1", label: "T2" },
  { day: "2", label: "T3" },
  { day: "3", label: "T4" },
  { day: "4", label: "T5" },
  { day: "5", label: "T6" },
  { day: "6", label: "T7" },
  { day: "0", label: "CN" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"AI_KEYS" | "STUDY_PREFS" | "SYSTEM" | "BACKUP">("AI_KEYS");

  // AI Key State
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [provider, setProvider] = useState<"GEMINI" | "OPENAI" | "ANTHROPIC">("GEMINI");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [keyStatusMap, setKeyStatusMap] = useState<Record<string, "CONNECTED" | "INVALID" | "NOT_CONFIGURED">>({
    GEMINI: "NOT_CONFIGURED",
    OPENAI: "NOT_CONFIGURED",
    ANTHROPIC: "NOT_CONFIGURED",
  });

  // User Settings & Study Budget
  const [budgetInput, setBudgetInput] = useState("20");
  const [examMode, setExamMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoDayClosure, setAutoDayClosure] = useState(false);
  const [autoRollover, setAutoRollover] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  // Study Preferences State
  const [studyPrefs, setStudyPrefs] = useState<StudyPreferences>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Backup & Restore State
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
        const map: Record<string, "CONNECTED" | "INVALID" | "NOT_CONFIGURED"> = {
          GEMINI: "NOT_CONFIGURED",
          OPENAI: "NOT_CONFIGURED",
          ANTHROPIC: "NOT_CONFIGURED",
        };
        data.keys.forEach((k: KeyRecord) => {
          map[k.provider] = k.isActive ? "CONNECTED" : "NOT_CONFIGURED";
        });
        setKeyStatusMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const res = await fetch("/api/settings/user");
      const data = await res.json();
      if (data.settings) {
        if (data.settings.weeklyStudyBudgetHours) {
          setBudgetInput(data.settings.weeklyStudyBudgetHours.toString());
        }
        setExamMode(Boolean(data.settings.examMode));
        setNotifications(Boolean(data.settings.notificationsEnabled));
        setAutoDayClosure(Boolean(data.settings.autoDayClosureEnabled));
        setAutoRollover(Boolean(data.settings.autoRolloverTasksEnabled));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudyPreferences = async () => {
    try {
      const res = await fetch("/api/settings/study-preferences");
      const data = await res.json();
      if (data.preferences) {
        setStudyPrefs(data.preferences);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchUserSettings();
    fetchStudyPreferences();
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu API key");

      setApiKeyInput("");
      setMessage({ type: "success", text: `Đã mã hóa AES-256-GCM và kích hoạt API Key ${provider} an toàn!` });
      await fetchKeys();
      // Auto-test newly added key
      handleTestConnection(provider);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi lưu key" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (prov: string) => {
    setTesting(prov);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: prov }),
      });

      const data = await res.json();
      if (!res.ok) {
        setKeyStatusMap((prev) => ({ ...prev, [prov]: "INVALID" }));
        throw new Error(data.error || "Kiểm tra kết nối thất bại");
      }

      setKeyStatusMap((prev) => ({ ...prev, [prov]: "CONNECTED" }));
      setMessage({ type: "success", text: data.message || `Kết nối đến ${prov} hoạt động tốt!` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kiểm tra kết nối" });
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = async (prov: string) => {
    if (!confirm(`Xóa cấu hình API Key của ${prov}?`)) return;
    try {
      await fetch(`/api/settings/api-keys?provider=${prov}`, { method: "DELETE" });
      await fetchKeys();
      setKeyStatusMap((prev) => ({ ...prev, [prov]: "NOT_CONFIGURED" }));
      setMessage({ type: "success", text: `Đã xóa cấu hình ${prov}.` });
    } catch (e) {
      toast.error("Không thể xóa key");
    }
  };

  const handleSaveStudyPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/study-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studyPrefs),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu sở thích học tập");
      setMessage({ type: "success", text: "Đã cập nhật Sở thích học tập (Study Preferences) thành công! AI Scheduler sẽ sử dụng các thông số này để xếp lịch." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi cập nhật sở thích" });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveUserSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyStudyBudgetHours: parseFloat(budgetInput),
          examMode,
          notificationsEnabled: notifications,
          autoDayClosureEnabled: autoDayClosure,
          autoRolloverTasksEnabled: autoRollover,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu cấu hình");
      setMessage({ type: "success", text: "Đã cập nhật Ngân sách tuần và Tùy chọn hệ thống thành công!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi cập nhật" });
    } finally {
      setSavingBudget(false);
    }
  };

  const toggleRestDay = (day: string) => {
    const currentDays = studyPrefs.restDays.split(",").filter(Boolean);
    let newDays: string[];
    if (currentDays.includes(day)) {
      newDays = currentDays.filter((d) => d !== day);
    } else {
      newDays = [...currentDays, day];
    }
    setStudyPrefs({ ...studyPrefs, restDays: newDays.join(",") });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoring(true);
      setRestoreMessage(null);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khôi phục dữ liệu");

      setRestoreMessage({
        type: "success",
        text: `Khôi phục thành công: ${data.imported.subjects} môn học, ${data.imported.tasks} nhiệm vụ, ${data.imported.events} lịch học, ${data.imported.notes} ghi chú, ${data.imported.habits} thói quen!`,
      });
    } catch (err: any) {
      setRestoreMessage({
        type: "error",
        text: err.message || "File sao lưu không hợp lệ hoặc bị lỗi",
      });
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <Sliders className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Cài đặt hệ thống & Tùy chọn cá nhân</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          Quản lý khóa AI BYOK, giới hạn và sở thích học tập cá nhân, ngân sách tuần và múi giờ.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs font-bold shadow-2xs overflow-x-auto max-w-full pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("AI_KEYS")}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === "AI_KEYS"
              ? "bg-[#2d6a4f] text-white shadow-2xs"
              : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
          }`}
        >
          <Key className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">AI API Keys (BYOK)</span>
          <span className="sm:hidden">AI Keys</span>
        </button>

        <button
          onClick={() => setActiveTab("STUDY_PREFS")}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === "STUDY_PREFS"
              ? "bg-[#2d6a4f] text-white shadow-2xs"
              : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Sở thích & Giới hạn</span>
          <span className="sm:hidden">Sở thích</span>
        </button>

        <button
          onClick={() => setActiveTab("SYSTEM")}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === "SYSTEM"
              ? "bg-[#2d6a4f] text-white shadow-2xs"
              : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
          }`}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Hệ thống & Ngân sách</span>
          <span className="sm:hidden">Hệ thống</span>
        </button>

        <button
          onClick={() => setActiveTab("BACKUP")}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === "BACKUP"
              ? "bg-[#2d6a4f] text-white shadow-2xs"
              : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Sao lưu & Xuất</span>
          <span className="sm:hidden">Sao lưu</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 font-medium transition-all ${
            message.type === "success"
              ? "bg-[#d8ebe0] text-[#1b4332] border border-[#b7d8c3]"
              : "bg-[#f7ebeb] text-[#8a3c3c] border border-[#e8c6c6]"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4 text-[#2d6a4f] shrink-0" /> : <AlertCircle className="w-4 h-4 text-[#b87474] shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AI API KEYS (BYOK) (Phần 3) */}
      {/* ========================================================================= */}
      {activeTab === "AI_KEYS" && (
        <div className="space-y-6">
          <div className="p-4 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-[#eef5f0] dark:bg-[#1d3024] text-xs text-[#192e22] dark:text-[#d8ebe0] flex items-start space-x-3.5">
            <ShieldCheck className="w-5 h-5 text-[#2d6a4f] dark:text-[#52b788] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">Kiến trúc Bring-Your-Own-Key (BYOK):</p>
              <p className="text-[#526b5c] dark:text-[#a3bda9] leading-relaxed">
                Khóa API được mã hóa AES-256-GCM với IV và AuthTag bảo mật trước khi lưu database. Khóa không bao giờ bị trả về trình duyệt hoặc lộ trong console.
              </p>
            </div>
          </div>

          {/* Key Form */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Key className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Nhập API Key cá nhân</span>
              </CardTitle>
              <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
                Chọn AI provider bạn muốn sử dụng (Google Gemini, OpenAI, Anthropic).
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveKey} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["GEMINI", "OPENAI", "ANTHROPIC"] as const).map((prov) => {
                    const isSelected = provider === prov;
                    const st = keyStatusMap[prov];

                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setProvider(prov)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#2d6a4f] bg-[#d8ebe0]/30 dark:bg-[#1d3827]/40 shadow-2xs"
                            : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">
                            {prov === "GEMINI" ? "Google Gemini" : prov === "OPENAI" ? "OpenAI" : "Anthropic Claude"}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              st === "CONNECTED"
                                ? "bg-emerald-500 ring-2 ring-emerald-200"
                                : st === "INVALID"
                                ? "bg-rose-500"
                                : "bg-gray-300"
                            }`}
                            title={st}
                          />
                        </div>
                        <div className="mt-2 flex items-center space-x-1.5">
                          <Badge
                            variant={st === "CONNECTED" ? "green" : st === "INVALID" ? "red" : "outline"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {st === "CONNECTED" ? "Connected" : st === "INVALID" ? "Invalid" : "Not configured"}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Nhập {provider} API Key:
                  </label>
                  <Input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      provider === "GEMINI" ? "AIzaSy..." : provider === "OPENAI" ? "sk-proj-..." : "sk-ant-..."
                    }
                    required
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  disabled={loading}
                  className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs space-x-1.5 rounded-2xl h-10 px-5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{loading ? "Đang mã hóa & lưu..." : `Mã hóa & Lưu ${provider} Key`}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Keys List */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Cpu className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Trạng thái kết nối các nhà cung cấp AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-2.5">
              {(["GEMINI", "OPENAI", "ANTHROPIC"] as const).map((prov) => {
                const isConfigured = keys.some((k) => k.provider === prov);
                const st = keyStatusMap[prov];

                return (
                  <div
                    key={prov}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          st === "CONNECTED"
                            ? "bg-emerald-500"
                            : st === "INVALID"
                            ? "bg-rose-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <div>
                        <div className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                          {prov === "GEMINI" ? "Google Gemini" : prov === "OPENAI" ? "OpenAI" : "Anthropic Claude"}
                        </div>
                        <div className="text-[10px] text-[#73927d]">
                          {isConfigured ? "Mã hóa AES-256-GCM trong Database" : "Chưa cấu hình khóa"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isConfigured && (
                        <>
                          <Button
                            size="sm"
                            variant="pill"
                            onClick={() => handleTestConnection(prov)}
                            disabled={testing === prov}
                            className="text-xs space-x-1.5 h-8 px-3"
                          >
                            <Zap className="w-3 h-3 text-[#2d6a4f]" />
                            <span>{testing === prov ? "Đang thử..." : "Kiểm tra kết nối"}</span>
                          </Button>

                          <button
                            onClick={() => handleDeleteKey(prov)}
                            className="p-2 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
                            title="Xóa khóa này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER STUDY PREFERENCES (Phần 4) */}
      {/* ========================================================================= */}
      {activeTab === "STUDY_PREFS" && (
        <form onSubmit={handleSaveStudyPreferences} className="space-y-6">
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Clock className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Thời lượng học & Giờ nghỉ (Session & Breaks)</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                AI Scheduler đọc các thông số này để phân bổ độ dài buổi học và thời gian nghỉ đệm.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-6 pt-0 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Thời gian học tối đa mỗi phiên (phút)
                  </label>
                  <Input
                    type="number"
                    min="30"
                    max="240"
                    step="15"
                    value={studyPrefs.maxSessionDurationMins}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, maxSessionDurationMins: parseInt(e.target.value, 10) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#73927d] mt-1">Khuyên dùng 60 - 90 phút để duy trì tập trung.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Thời gian nghỉ tối thiểu giữa 2 phiên (phút)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={studyPrefs.minBreakBetweenSessions}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, minBreakBetweenSessions: parseInt(e.target.value, 10) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#73927d] mt-1">AI không xếp 2 buổi học cách nhau dưới khoảng này.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Thời lượng Pomodoro chuẩn (phút)
                  </label>
                  <Input
                    type="number"
                    min="15"
                    max="60"
                    step="5"
                    value={studyPrefs.pomodoroDurationMins}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, pomodoroDurationMins: parseInt(e.target.value, 10) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Thời lượng nghỉ ngắn Pomodoro (phút)
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="30"
                    step="1"
                    value={studyPrefs.pomodoroBreakMins}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, pomodoroBreakMins: parseInt(e.target.value, 10) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Limits & Rest Days */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <BatteryCharging className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Giới hạn ngày & Ngày nghỉ (Daily Limits & Rest Days)</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6 pt-0 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Số giờ học tối đa / ngày (giờ)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={studyPrefs.maxDailyStudyHours}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, maxDailyStudyHours: parseFloat(e.target.value) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#73927d] mt-1">Tránh tình trạng kiệt sức và nhồi nhét quá tải.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Số phiên học tối đa / ngày
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={studyPrefs.maxDailySessions}
                    onChange={(e) =>
                      setStudyPrefs({ ...studyPrefs, maxDailySessions: parseInt(e.target.value, 10) })
                    }
                    className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Rest days selector */}
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                  Ngày nghỉ trong tuần (AI không tự động xếp lịch vào các ngày này):
                </label>
                <div className="flex items-center space-x-2">
                  {DAY_LABELS.map((item) => {
                    const isRest = studyPrefs.restDays.split(",").includes(item.day);
                    return (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => toggleRestDay(item.day)}
                        className={`w-10 h-10 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          isRest
                            ? "bg-[#2d6a4f] text-white shadow-2xs"
                            : "bg-[#f8fbf8] dark:bg-[#142318] text-[#526b5c] border border-[#dbe7dd] dark:border-[#263d2e]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time of day preference */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                  Ưu tiên khung thời gian học:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "MORNING", label: "Buổi sáng 🌅", desc: "05:00 - 11:59" },
                    { id: "AFTERNOON", label: "Buổi chiều 🌤️", desc: "14:00 - 17:59" },
                    { id: "EVENING", label: "Buổi tối 🌙", desc: "18:00 - 23:59" },
                    { id: "BALANCED", label: "Cân bằng ⚖️", desc: "Phân bổ đều 4 buổi" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setStudyPrefs({ ...studyPrefs, timePreference: p.id })}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        studyPrefs.timePreference === p.id
                          ? "border-[#2d6a4f] bg-[#d8ebe0]/30 text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                          : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#526b5c]"
                      }`}
                    >
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className="text-[10px] text-[#73927d] mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flexibility */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                  Mức độ linh hoạt của lịch (Schedule Flexibility):
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "STRICT", label: "Nghiêm ngặt", desc: "Cố định giờ, ít xê dịch" },
                    { id: "MODERATE", label: "Vừa phải", desc: "Tự động bù nếu trễ" },
                    { id: "FLEXIBLE", label: "Linh hoạt", desc: "Ưu tiên theo khoảng rảnh" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStudyPrefs({ ...studyPrefs, scheduleFlexibility: f.id })}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        studyPrefs.scheduleFlexibility === f.id
                          ? "border-[#2d6a4f] bg-[#d8ebe0]/30 text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                          : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#526b5c]"
                      }`}
                    >
                      <div className="font-bold text-xs">{f.label}</div>
                      <div className="text-[10px] text-[#73927d] mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={savingPrefs}
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs rounded-2xl h-10 px-6 shadow-sm"
          >
            {savingPrefs ? "Đang lưu..." : "Lưu Sở thích & Giới hạn học tập"}
          </Button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SYSTEM, BUDGET & TIMEZONE */}
      {/* ========================================================================= */}
      {activeTab === "SYSTEM" && (
        <div className="space-y-6">
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Zap className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Ngân sách học tập hàng tuần & Chế độ ôn thi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs p-6 pt-0">
              <form onSubmit={handleSaveUserSettings} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Ngân sách học tập hàng tuần (Giờ / tuần)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="max-w-xs rounded-2xl border-[#dbe7dd] text-xs h-10"
                    required
                  />
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="checkbox"
                    id="examMode"
                    checked={examMode}
                    onChange={(e) => setExamMode(e.target.checked)}
                    className="rounded border-[#dbe7dd] text-[#2d6a4f] focus:ring-[#2d6a4f] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="examMode" className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] cursor-pointer">
                    Kích hoạt chế độ ôn thi (Exam Mode) - Tối đa hóa ôn tập và ưu tiên các môn gần deadline
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="rounded border-[#dbe7dd] text-[#2d6a4f] focus:ring-[#2d6a4f] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="notifications" className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] cursor-pointer">
                    Bật nhắc nhở trước giờ học 15 phút (Browser Notifications)
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={savingBudget}
                  className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs rounded-2xl h-10 px-5 mt-2"
                >
                  {savingBudget ? "Đang lưu..." : "Lưu tùy chọn hệ thống"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Timezone Information Card */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Globe className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Múi giờ & Ngôn ngữ hệ thống</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs p-6 pt-0">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318]">
                <div>
                  <p className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Múi giờ chuẩn</p>
                  <p className="text-[#526b5c] dark:text-[#a3bda9]">Asia/Ho_Chi_Minh (UTC+07:00 - Giờ Việt Nam)</p>
                </div>
                <Badge variant="green">Chuẩn hệ thống</Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318]">
                <div>
                  <p className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Ngôn ngữ giao diện</p>
                  <p className="text-[#526b5c] dark:text-[#a3bda9]">Tiếng Việt (vi-VN)</p>
                </div>
                <Badge variant="outline">Mặc định</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: SAO LƯU & XUẤT DỮ LIỆU (DATA & BACKUP) */}
      {activeTab === "BACKUP" && (
        <div className="space-y-6">
          {restoreMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 font-medium transition-all ${
                restoreMessage.type === "success"
                  ? "bg-[#d8ebe0] text-[#1b4332] border border-[#b7d8c3]"
                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {restoreMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{restoreMessage.text}</span>
            </div>
          )}

          {/* Full JSON Export Card */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Database className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>Sao lưu toàn bộ dữ liệu (Full JSON Backup)</span>
              </CardTitle>
              <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
                Tải về toàn bộ Môn học, Mục tiêu, Nhiệm vụ, Lịch học, Phiên học, Ghi chú và Thói quen thành một tệp JSON duy nhất.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">
                    Bản sao lưu chuẩn ChronoMind (.json)
                  </p>
                  <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                    Phù hợp để lưu trữ ngoại tuyến, chuyển đổi máy tính hoặc khôi phục khi cần.
                  </p>
                </div>

                <a href="/api/export?format=json" download>
                  <Button className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold space-x-1.5 shadow-2xs shrink-0 cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải bản sao lưu JSON</span>
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* CSV Export Card */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Xuất dữ liệu bảng tính (Excel / Google Sheets CSV)</span>
              </CardTitle>
              <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
                Xuất từng phần dữ liệu độc lập sang định dạng CSV để phân tích dữ liệu bằng Excel hoặc Google Sheets.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Events CSV */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">Lịch học (Calendar)</p>
                    <p className="text-[10px] text-[#73927d]">Tiêu đề, Bắt đầu, Kết thúc, Môn</p>
                  </div>
                  <a href="/api/export?format=csv&entity=events" download>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs space-x-1 cursor-pointer">
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </Button>
                  </a>
                </div>

                {/* Sessions CSV */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">Phiên học (Sessions)</p>
                    <p className="text-[10px] text-[#73927d]">Môn, Thời lượng, Điểm năng suất</p>
                  </div>
                  <a href="/api/export?format=csv&entity=sessions" download>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs space-x-1 cursor-pointer">
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </Button>
                  </a>
                </div>

                {/* Tasks CSV */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">Nhiệm vụ (Tasks)</p>
                    <p className="text-[10px] text-[#73927d]">Trạng thái, Ưu tiên, Hạn chót</p>
                  </div>
                  <a href="/api/export?format=csv&entity=tasks" download>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs space-x-1 cursor-pointer">
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </Button>
                  </a>
                </div>

                {/* Notes CSV */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">Ghi chú (Notes)</p>
                    <p className="text-[10px] text-[#73927d]">Tiêu đề, Môn học, Ngày tạo</p>
                  </div>
                  <a href="/api/export?format=csv&entity=notes" download>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs space-x-1 cursor-pointer">
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restore / Import Card */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Khôi phục dữ liệu từ bản sao lưu JSON</span>
              </CardTitle>
              <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
                Tải lên tệp sao lưu `.json` đã xuất trước đó để khôi phục lại các môn học, nhiệm vụ, lịch và thói quen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="p-6 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border-2 border-dashed border-[#dbe7dd] dark:border-[#263d2e] text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Chọn file sao lưu ChronoMind (.json)
                  </p>
                  <p className="text-[11px] text-[#73927d] mt-0.5">
                    Hệ thống sẽ tự động ghép nối và nhập dữ liệu vào tài khoản của bạn.
                  </p>
                </div>

                <div className="flex justify-center pt-1">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{restoring ? "Đang khôi phục..." : "Chọn file và Khôi phục ngay"}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      disabled={restoring}
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
