"use client";

import { useEffect, useState, useRef } from "react";

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
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch stats
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          total: data.paidTickets + data.checkedInTickets,
          checkedIn: data.checkedInTickets,
        });
      });
  }, [logs]);

  const handleCheckin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ticketCode.trim() || processing) return;

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: ticketCode.trim() }),
      });

      const data: CheckinResult = await res.json();
      setResult(data);

      setLogs((prev) => [
        {
          time: new Date().toLocaleTimeString("ja-JP"),
          ticketCode: data.ticket?.ticketCode || ticketCode,
          buyerName: data.ticket?.buyerName || "-",
          eventName: data.ticket?.event?.name || "-",
          success: data.success,
          message: data.success
            ? "入場OK"
            : data.error || "エラー",
        },
        ...prev,
      ]);

      setTicketCode("");
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

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

      {/* Scan Input */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <form onSubmit={handleCheckin} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            placeholder="チケットコードを入力 or QRスキャン"
            className="flex-1 border-2 rounded-xl px-6 py-4 text-xl focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={processing}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
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
