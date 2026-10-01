"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/notion/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, ShieldCheck, Check, Trash2, Globe, Cpu, AlertCircle } from "lucide-react";

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
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
      setMessage({ type: "success", text: `Đã mã hóa AES-256-GCM và kích hoạt API Key ${provider} thành công!` });
      fetchKeys();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi lưu key" });
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        icon="⚙️"
        title="Cài đặt AI & Bảo mật hệ thống"
        description="Quản lý API Key AI cá nhân (Gemini, OpenAI, Anthropic). Mọi khóa đều được mã hóa chuẩn quân sự AES-256-GCM tại máy chủ và không bao giờ lộ ra trình duyệt."
      />

      {/* Security Architecture Callout */}
      <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Kiến trúc bảo mật Zero-Client-Exposure:</p>
          <p>
            API Key cá nhân của bạn được mã hóa một chiều bằng khóa bí mật 32-byte (AES-GCM) trước khi ghi vào Database. Khi AI Scheduler thực thi, key chỉ được giải mã tạm thời trong RAM của máy chủ để gửi request đến AI Provider rồi giải phóng ngay lập tức. Client không bao giờ nhận lại chuỗi key gốc.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form: Add or Update Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Thêm hoặc Cập nhật AI API Key</span>
          </CardTitle>
          <CardDescription>
            Chọn nhà cung cấp AI và nhập API Key cá nhân để sử dụng tính năng AI Study Scheduler.
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
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs"
                        : "border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#171717] dark:text-white">
                        {prov === "GEMINI"
                          ? "Google Gemini"
                          : prov === "OPENAI"
                          ? "OpenAI (GPT-4o)"
                          : "Anthropic Claude"}
                      </span>
                      {isConfigured && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã cấu hình" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#787774] mt-1">
                      {isConfigured ? "Đang hoạt động" : "Chưa cấu hình"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#787774] mb-1">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? "Đang mã hóa & lưu..." : `Mã hóa & Lưu ${provider} Key`}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Configured Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Các khóa AI đang hoạt động trong tài khoản của bạn</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020] text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <span className="font-semibold text-sm text-[#171717] dark:text-white">
                      {k.provider}
                    </span>
                    <span className="font-mono text-[11px] text-[#787774] ml-2">
                      (Đã mã hóa AES-256-GCM ••••••••)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="green">Đang hoạt động</Badge>
                  <button
                    onClick={() => handleDeleteKey(k.provider)}
                    className="p-1 rounded text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Xóa khóa này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {keys.length === 0 && (
              <div className="p-4 rounded-lg bg-[#f7f6f3] dark:bg-[#222] border border-[#e9e9e7] dark:border-[#2e2e2e] text-xs text-[#787774] space-y-1">
                <p className="font-semibold text-[#37352f] dark:text-[#e0e0e0]">
                  Ghi chú về chế độ hoạt động:
                </p>
                <p>
                  Bạn chưa nhập API Key nào. Hệ thống ChronoMind vẫn hoạt động 100% bằng **Thuật toán Tối ưu hóa Ràng buộc Nội bộ (Local Constraint Satisfaction Engine)** để tự động xếp lịch và né mọi khung giờ bận! Khi bạn thêm Gemini hoặc OpenAI key, thuật toán sẽ tự động nâng cấp dùng LLM để phân bổ ngữ cảnh thông minh hơn.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timezone & Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Múi giờ & Định vị khu vực (Timezone)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#202020]">
            <div>
              <p className="font-semibold text-[#171717] dark:text-white">Múi giờ hệ thống</p>
              <p className="text-[#787774]">Asia/Ho_Chi_Minh (UTC+07:00 - Giờ Việt Nam)</p>
            </div>
            <Badge variant="blue">Mặc định chuẩn</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
