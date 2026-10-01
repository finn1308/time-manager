"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, ShieldCheck, Check, Trash2, Globe, Cpu, AlertCircle, RefreshCw, Zap } from "lucide-react";

interface KeyRecord {
  id: string;
  provider: "OPENAI" | "GEMINI" | "ANTHROPIC";
  isActive: boolean;
  updatedAt: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [provider, setProvider] = useState<"GEMINI" | "OPENAI" | "ANTHROPIC">("GEMINI");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [budgetInput, setBudgetInput] = useState("20");
  const [examMode, setExamMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchUserSettings();
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
      fetchKeys();
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
        throw new Error(data.error || "Kiểm tra kết nối thất bại");
      }

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
      fetchKeys();
      setMessage({ type: "success", text: `Đã xóa cấu hình ${prov}.` });
    } catch (e) {
      alert("Không thể xóa key");
    }
  };

  const handleSaveUserSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const res = await fetch("/api/settings/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyStudyBudgetHours: parseFloat(budgetInput),
          examMode,
          notificationsEnabled: notifications,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu cấu hình");
      setMessage({ type: "success", text: "Đã cập nhật Ngân sách tuần và Tùy chọn học tập thành công!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi cập nhật" });
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <Key className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Cài đặt AI & Bảo mật hệ thống</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          Quản lý API Key AI cá nhân (Gemini, OpenAI, Anthropic). Mọi khóa đều được mã hóa AES-256-GCM ở máy chủ và không bao giờ trả về client.
        </p>
      </div>

      {/* Security Architecture Callout */}
      <div className="p-4 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-[#eef5f0] dark:bg-[#1d3024] text-xs text-[#192e22] dark:text-[#d8ebe0] flex items-start space-x-3.5">
        <ShieldCheck className="w-5 h-5 text-[#2d6a4f] dark:text-[#52b788] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">Kiến trúc bảo mật Zero-Client-Exposure:</p>
          <p className="text-[#526b5c] dark:text-[#a3bda9] leading-relaxed">
            API Key của bạn được mã hóa AES-256-GCM với IV và AuthTag riêng trước khi lưu database. Khi thực thi lập lịch AI, key được giải mã tạm thời trên server-side trong quá trình gọi API và không bao giờ gửi về trình duyệt JavaScript.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 font-medium ${
            message.type === "success"
              ? "bg-[#d8ebe0] text-[#1b4332] border border-[#b7d8c3]"
              : "bg-[#f7ebeb] text-[#8a3c3c] border border-[#e8c6c6]"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4 text-[#2d6a4f]" /> : <AlertCircle className="w-4 h-4 text-[#b87474]" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form: Add or Update Key */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
            <Key className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Thêm hoặc Cập nhật AI API Key</span>
          </CardTitle>
          <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
            Chọn nhà cung cấp AI và nhập API Key cá nhân để sử dụng tính năng AI Scheduler.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveKey} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["GEMINI", "OPENAI", "ANTHROPIC"] as const).map((prov) => {
                const isSelected = provider === prov;
                const isConfigured = keys.some((k) => k.provider === prov);

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
                        {prov === "GEMINI"
                          ? "Google Gemini"
                          : prov === "OPENAI"
                          ? "OpenAI (GPT-4o)"
                          : "Anthropic Claude"}
                      </span>
                      {isConfigured && (
                        <span className="w-2 h-2 rounded-full bg-[#52b788]" title="Đã cấu hình" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#73927d] mt-1">
                      {isConfigured ? "Đang hoạt động" : "Chưa cấu hình"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Nhập {provider} API Key cá nhân:
              </label>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  provider === "GEMINI"
                    ? "AIzaSy..."
                    : provider === "OPENAI"
                    ? "sk-proj-..."
                    : "sk-ant-..."
                }
                required
              />
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs space-x-1.5 rounded-2xl"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? "Đang mã hóa & lưu..." : `Mã hóa & Lưu ${provider} Key (Save)`}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Configured Keys List with Test Connection & Delete */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
            <Cpu className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Các khóa AI đang hoạt động trong tài khoản</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-2.5">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#52b788]" />
                  <div>
                    <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      {k.provider}
                    </span>
                    <span className="font-mono text-[11px] text-[#73927d] ml-2">
                      (AES-256-GCM ••••••••••••••••)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="pill"
                    onClick={() => handleTestConnection(k.provider)}
                    disabled={testing === k.provider}
                    className="text-xs space-x-1"
                  >
                    <Zap className="w-3 h-3 text-[#2d6a4f]" />
                    <span>{testing === k.provider ? "Đang thử..." : "Test connection"}</span>
                  </Button>

                  <button
                    onClick={() => handleDeleteKey(k.provider)}
                    className="p-2 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
                    title="Xóa khóa này (Delete key)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {keys.length === 0 && (
              <div className="p-4 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] border border-[#dbe7dd] dark:border-[#263d2e] text-xs text-[#526b5c] dark:text-[#a3bda9] space-y-1">
                <p className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Chế độ hoạt động độc lập (Offline Fallback):
                </p>
                <p>
                  Bạn chưa nhập API Key nào. Hệ thống ChronoMind vẫn hoạt động đầy đủ bằng Thuật toán tối ưu hóa ràng buộc nội bộ (Local Constraint Satisfaction Engine) để tự động xếp lịch và né mọi khung giờ bận!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Study Budget & Preferences */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
            <Zap className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Ngân sách học tập tuần & Tùy chọn (Study Budget)</span>
          </CardTitle>
          <CardDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Đặt chỉ tiêu tổng số giờ muốn học mỗi tuần để AI kiểm soát và tính toán nợ học tập (Study Debt).
          </CardDescription>
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
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs rounded-2xl h-9 px-4 mt-2"
            >
              {savingBudget ? "Đang lưu..." : "Lưu tùy chọn học tập"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Timezone Settings */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
            <Globe className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Múi giờ & Định dạng chuẩn (Timezone)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs p-6 pt-0">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318]">
            <div>
              <p className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Múi giờ hệ thống</p>
              <p className="text-[#526b5c] dark:text-[#a3bda9]">Asia/Ho_Chi_Minh (UTC+07:00 - Giờ chuẩn Việt Nam)</p>
            </div>
            <Badge variant="green">Đã thiết lập</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
