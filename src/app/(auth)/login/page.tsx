"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Sparkles, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f8f5] dark:bg-[#101c14] bg-pastel-grid">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#52b788] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md shadow-[#2d6a4f]/20">
            CM
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            ChronoMind
          </h1>
          <p className="text-xs font-medium text-[#526b5c] dark:text-[#a3bda9]">
            Hệ điều hành quản lý thời gian & lịch học cá nhân hóa
          </p>
        </div>

        <Card className="rounded-[32px] border border-[#dbe7dd] dark:border-[#263d2e] shadow-xl overflow-hidden bg-white dark:bg-[#17261c]">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle className="text-xl text-[#192e22] dark:text-[#f0f7f2]">
              Đăng nhập tài khoản
            </CardTitle>
            <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
              Quản lý mục tiêu, phân bổ lịch học thông minh và theo dõi thời gian thực với Picture-in-Picture Timer.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#f7ebeb] text-xs text-[#8a3c3c] border border-[#e8c6c6] font-medium">
                {errorMsg}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="pl-10"
                  />
                  <Mail className="w-4 h-4 text-[#73927d] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10"
                  />
                  <Lock className="w-4 h-4 text-[#73927d] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="w-full mt-2 font-semibold shadow-md bg-[#2d6a4f] hover:bg-[#1b4332] text-white h-11 rounded-2xl"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-[#dbe7dd] dark:border-[#263d2e] pt-5">
            <div className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#6b8574]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52b788]" />
              <span>Bảo mật AES-256-GCM & Timezone Asia/Ho_Chi_Minh</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
