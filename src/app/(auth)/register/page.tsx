"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 py-8 bg-[#f4f8f5] dark:bg-[#101c14] bg-pastel-grid pt-safe pb-safe">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#52b788] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md shadow-[#2d6a4f]/20">
            CM
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            ChronoMind
          </h1>
          <p className="text-xs font-medium text-[#526b5c] dark:text-[#a3bda9]">
            Tạo tài khoản để cá nhân hóa hệ điều hành học tập của bạn
          </p>
        </div>

        <Card className="rounded-[32px] border border-[#dbe7dd] dark:border-[#263d2e] shadow-xl overflow-hidden bg-white dark:bg-[#17261c]">
          <CardHeader className="space-y-1.5 pb-4 text-center">
            <CardTitle className="text-xl text-[#192e22] dark:text-[#f0f7f2]">
              Đăng ký tài khoản
            </CardTitle>
            <CardDescription className="text-[#526b5c] dark:text-[#a3bda9]">
              Thiết lập mục tiêu môn học và trải nghiệm phân bổ lịch học thông minh.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#f7ebeb] text-xs text-[#8a3c3c] border border-[#e8c6c6] font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="pl-10"
                  />
                  <User className="w-4 h-4 text-[#73927d] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

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
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
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
                {loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#dbe7dd] dark:border-[#263d2e]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#17261c] px-2 text-[#526b5c]">
                  Hoặc
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
              className="w-full font-semibold border-[#dbe7dd] dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] h-11 rounded-2xl bg-white dark:bg-[#17261c] hover:bg-[#f4f8f5] dark:hover:bg-[#1b3426] flex items-center justify-center space-x-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Đăng ký với Google</span>
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-[#dbe7dd] dark:border-[#263d2e] pt-5">
            <div className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline">
                Đăng nhập ngay
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#6b8574]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52b788]" />
              <span>Dữ liệu lưu trữ bảo mật & Phân vùng riêng theo User ID</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
