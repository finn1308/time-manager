"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-[#f7ebeb] dark:bg-[#2c1a1a] rounded-full flex items-center justify-center text-[#b87474]">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
        Đã xảy ra lỗi không mong muốn
      </h2>
      <p className="text-sm text-[#526b5c] dark:text-[#a3bda9] max-w-md">
        Chúng tôi xin lỗi vì sự bất tiện này. Có vẻ như hệ thống gặp một trục trặc nhỏ khi xử lý yêu cầu của bạn.
      </p>
      <Button
        onClick={() => reset()}
        className="mt-4 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold flex items-center space-x-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Thử lại</span>
      </Button>
    </div>
  );
}
