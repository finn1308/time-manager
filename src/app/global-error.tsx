"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#d9534f" }}>Lỗi hệ thống nghiêm trọng</h2>
          <p>Rất tiếc, đã xảy ra lỗi không thể phục hồi.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              marginTop: "20px",
              background: "#2d6a4f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Tải lại trang
          </button>
        </div>
      </body>
    </html>
  );
}
