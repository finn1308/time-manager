"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, ArrowRight, ShieldCheck, Flame } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f7f9fc] dark:bg-[#0f172a] bg-reference-grid">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-blue-500/20">
            CM
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            ChronoMind
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hệ điều hành quản lý thời gian & lịch học cá nhân hóa
          </p>
        </div>

        <Card className="rounded-[32px] border-2 border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle className="text-xl">Đăng nhập tài khoản</CardTitle>
            <CardDescription>
              Tự động phân bổ lịch học bằng AI và đo lường thời gian thực tế với Picture-in-Picture Timer.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 text-xs text-rose-600 border border-rose-200 font-medium">
                {errorMsg}
              </div>
            )}

            {/* 1-Click Demo Login Banner (Reference style) */}
            <div className="p-4 rounded-[22px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 text-white">
                  <Flame className="w-4 h-4 text-amber-200 fill-current animate-bounce" />
                  <span>Trải nghiệm ngay lập tức</span>
                </span>
                <span className="text-[10px] bg-white text-orange-600 px-2 py-0.5 rounded-full font-bold shadow-2xs">
                  1-CLICK
                </span>
              </div>
              <p className="text-[11px] text-orange-100 font-medium">
                Vào ngay tài khoản demo có sẵn 4 môn học, các khung giờ bị khóa và lịch học tuần này!
              </p>
              <Button
                type="button"
                variant="pill"
                size="default"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs shadow-md"
              >
                {demoLoading ? "Đang khởi tạo phiên demo..." : "Vào ngay tài khoản Demo (demo@chronomind.app)"}
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                hoặc điền thông tin
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
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
                variant="default"
                disabled={loading}
                className="w-full mt-2 font-bold shadow-md"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập với Mật khẩu"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="text-xs text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật AES-256-GCM & Timezone Asia/Ho_Chi_Minh</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
