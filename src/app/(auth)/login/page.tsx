"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đăng nhập demo");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbfbfa] dark:bg-[#121212]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#2383e2] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            CM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-white">
            ChronoMind
          </h1>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
            Notion-inspired Time & Study Operating System
          </p>
        </div>

        <Card className="border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Đăng nhập tài khoản</CardTitle>
            <CardDescription>
              Quản lý thời gian, lịch học thông minh và theo dõi tiến độ thực tế với PIP Timer.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-600 border border-rose-200">
                {errorMsg}
              </div>
            )}

            {/* 1-Click Demo Login */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dùng thử trải nghiệm ngay</span>
                </span>
                <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded font-mono">
                  1-Click
                </span>
              </div>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                Đăng nhập ngay với tài khoản mẫu có sẵn môn học, lịch bận và dữ liệu thực tế.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
              >
                {demoLoading ? "Đang khởi tạo phiên demo..." : "Vào ngay tài khoản Demo (demo@chronomind.app)"}
              </Button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#e9e9e7] dark:border-[#2e2e2e]"></div>
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-[#9b9a97]">
                hoặc đăng nhập
              </span>
              <div className="flex-grow border-t border-[#e9e9e7] dark:border-[#2e2e2e]"></div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#787774] mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#787774] mb-1">Mật khẩu</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="notion"
                disabled={loading}
                className="w-full mt-2 font-medium"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập với Mật khẩu"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-[#e9e9e7] dark:border-[#2e2e2e] pt-4">
            <div className="text-xs text-[#787774]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-1 text-[11px] text-[#9b9a97]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật AES-256-GCM & Timezone Asia/Ho_Chi_Minh</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
