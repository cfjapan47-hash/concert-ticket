"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export default function CheckinCodeButton({
  ticketCode,
  ticketStatus,
}: {
  ticketCode: string;
  ticketStatus: string;
}) {
  const { data: session } = useSession();
  const [code, setCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateCode = useCallback(async () => {
    setLoading(true);
    setError("");
    setCode(null);
    setQrDataUrl(null);

    try {
      const res = await fetch("/api/checkin-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setCode(data.code);
      setTimeLeft(30);

      // Generate QR code client-side
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(`OTC:${data.code}`, {
        width: 280,
        margin: 2,
        color: { dark: "#166534", light: "#f0fdf4" },
      });
      setQrDataUrl(qr);
    } finally {
      setLoading(false);
    }
  }, [ticketCode]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (code) {
        setCode(null);
        setQrDataUrl(null);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, code]);

  if (ticketStatus !== "PAID") return null;
  if (!session) return null;

  return (
    <div className="mt-6 text-center">
      {!code ? (
        <>
          <button
            onClick={generateCode}
            disabled={loading}
            className="bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-green-700 disabled:opacity-50 w-full max-w-xs"
          >
            {loading ? "生成中..." : "🔑 入場QRコードを表示"}
          </button>
          <p className="text-sm text-gray-400 mt-2">
            受付スタッフの前でタップしてください（30秒有効）
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </>
      ) : (
        <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6">
          <p className="text-sm text-green-600 font-bold mb-2">
            入場用QRコード（残り {timeLeft} 秒）
          </p>

          {qrDataUrl && (
            <div className="flex justify-center my-3">
              <img src={qrDataUrl} alt="入場QR" className="w-56 h-56" />
            </div>
          )}

          <p className="text-3xl font-mono font-bold text-green-700 tracking-widest">
            {code}
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            受付でこのQRコードをスキャンしてもらってください
          </p>
        </div>
      )}
    </div>
  );
}
