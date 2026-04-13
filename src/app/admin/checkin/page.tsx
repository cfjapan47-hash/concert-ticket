"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface CheckinResult {
  success: boolean;
  message?: string;
  error?: string;
  ticket?: {
    ticketCode: string;
    buyerName: string;
    status: string;
    checkedInAt: string | null;
    event: { name: string; date: string; venue: string };
    seatType: { name: string; price: number };
  };
}

interface CheckinLog {
  time: string;
  ticketCode: string;
  buyerName: string;
  eventName: string;
  success: boolean;
  message: string;
}

export default function CheckinPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [onetimeCode, setOnetimeCode] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          total: data.paidTickets + data.checkedInTickets,
          checkedIn: data.checkedInTickets,
        });
      });
  }, [logs]);

  const doCheckin = useCallback(
    async (code: string) => {
      if (!code.trim() || processing) return;

      setProcessing(true);
      setResult(null);

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketCode: code.trim() }),
        });

        const data: CheckinResult = await res.json();
        setResult(data);

        setLogs((prev) => [
          {
            time: new Date().toLocaleTimeString("ja-JP"),
            ticketCode: data.ticket?.ticketCode || code,
            buyerName: data.ticket?.buyerName || "-",
            eventName: data.ticket?.event?.name || "-",
            success: data.success,
            message: data.success ? "入場OK" : data.error || "エラー",
          },
          ...prev,
        ]);

        setTicketCode("");
      } finally {
        setProcessing(false);
        inputRef.current?.focus();
      }
    },
    [processing]
  );

  const handleCheckin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await doCheckin(ticketCode);
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // ignore
        }
      }

      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Stop scanner after successful scan
          try {
            await scanner.stop();
          } catch {
            // ignore
          }
          setScanning(false);

          // Extract ticket code from URL or use as-is
          let code = decodedText;
          if (decodedText.includes("/ticket/")) {
            code = decodedText.split("/ticket/").pop() || decodedText;
          }

          setTicketCode(code);
          await doCheckin(code);
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      alert(
        "カメラを起動できませんでした。カメラへのアクセスを許可してください。"
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore
      }
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const checkinRate =
    stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        当日チェックイン
      </h2>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">入場率</span>
          <span className="font-bold text-lg">
            {stats.checkedIn}/{stats.total}人 ({checkinRate.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className="bg-green-500 h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-bold"
            style={{ width: `${Math.min(checkinRate, 100)}%` }}
          >
            {checkinRate > 10 && `${checkinRate.toFixed(0)}%`}
          </div>
        </div>
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">QRスキャン</h3>
          {!scanning ? (
            <button
              onClick={startScanner}
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-green-700"
            >
              📷 カメラを起動
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-red-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-red-700"
            >
              ■ カメラを停止
            </button>
          )}
        </div>
        <div
          id="qr-reader"
          ref={scannerRef}
          className={`${scanning ? "" : "hidden"} rounded-xl overflow-hidden`}
          style={{ maxWidth: "500px", margin: "0 auto" }}
        />
        {scanning && (
          <p className="text-center text-gray-500 mt-2">
            チケットのQRコードをカメラにかざしてください
          </p>
        )}
      </div>

      {/* One-time Code Input */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">🔑 入場コードで受付</h3>
        <p className="text-sm text-gray-500 mb-3">来場者のスマホに表示された6桁のコードを入力</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!onetimeCode.trim() || processing) return;
            setProcessing(true);
            setResult(null);
            try {
              const res = await fetch("/api/checkin-code/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: onetimeCode.trim() }),
              });
              const data = await res.json();
              setResult(data);
              setLogs((prev) => [
                {
                  time: new Date().toLocaleTimeString("ja-JP"),
                  ticketCode: data.ticket?.ticketCode || onetimeCode,
                  buyerName: data.ticket?.buyerName || "-",
                  eventName: data.ticket?.event?.name || "-",
                  success: data.success,
                  message: data.success ? "入場OK" : data.error || "エラー",
                },
                ...prev,
              ]);
              setOnetimeCode("");
            } finally {
              setProcessing(false);
            }
          }}
          className="space-y-3"
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={onetimeCode}
            onChange={(e) => setOnetimeCode(e.target.value)}
            placeholder="6桁の入場コード"
            className="w-full border-2 rounded-xl px-6 py-4 text-3xl text-center tracking-widest focus:border-green-500 focus:outline-none font-mono"
            maxLength={6}
          />
          <button
            type="submit"
            disabled={processing || onetimeCode.length !== 6}
            className="w-full bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? "処理中..." : "入場を確認"}
          </button>
        </form>
      </div>

      {/* Manual Ticket Code Input */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">チケットコードで受付</h3>
        <form onSubmit={handleCheckin} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            placeholder="チケットコードを入力（例: TK-xxxxxxxx）"
            className="w-full border-2 rounded-xl px-6 py-4 text-xl focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={processing}
            className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {processing ? "処理中..." : "チェックイン"}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-xl shadow p-6 mb-6 ${
            result.success
              ? "bg-green-50 border-2 border-green-500"
              : "bg-red-50 border-2 border-red-500"
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-3">
              {result.success ? "✅" : "❌"}
            </div>
            <p
              className={`text-2xl font-bold ${
                result.success ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.success ? result.message : result.error}
            </p>
            {result.ticket && (
              <div className="mt-4 text-lg">
                <p className="font-bold">{result.ticket.buyerName}</p>
                <p className="text-gray-600">
                  {result.ticket.event.name} | {result.ticket.seatType.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            チェックイン履歴
          </h3>
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  log.success ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <span className="text-xl">
                  {log.success ? "✅" : "❌"}
                </span>
                <span className="text-sm text-gray-500">{log.time}</span>
                <span className="font-mono text-sm">{log.ticketCode}</span>
                <span className="font-medium">{log.buyerName}</span>
                <span className="text-gray-500 text-sm">{log.eventName}</span>
                <span
                  className={`ml-auto text-sm ${
                    log.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
