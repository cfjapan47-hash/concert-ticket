"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/Header";

interface SeatTypeSummary {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  paid: number;
  checkedIn: number;
  remaining: number;
  fillRate: number;
}

interface DashboardData {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
    status: string;
  };
  totalCapacity: number;
  totalSold: number;
  totalPaid: number;
  totalCheckedIn: number;
  totalReserved: number;
  revenue: number;
  fillRate: number;
  seatTypeSummaries: SeatTypeSummary[];
  checkinHistory: {
    ticketCode: string;
    buyerName: string;
    checkedInAt: string;
    seatType: { name: string };
  }[];
  attendees: {
    ticketCode: string;
    buyerName: string;
    buyerPhone: string | null;
    status: string;
    checkedInAt: string | null;
    seatType: { name: string };
  }[];
}

interface CheckinResult {
  success: boolean;
  message?: string;
  error?: string;
  ticket?: {
    ticketCode: string;
    buyerName: string;
    event: { name: string };
    seatType: { name: string };
  };
}

interface CheckinLog {
  time: string;
  ticketCode: string;
  buyerName: string;
  success: boolean;
  message: string;
}

export default function EventDashboardPage() {
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"dashboard" | "checkin" | "attendees">("dashboard");

  // Checkin state
  const [ticketCode, setTicketCode] = useState("");
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [checkinLogs, setCheckinLogs] = useState<CheckinLog[]>([]);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  const fetchData = useCallback(() => {
    if (authStatus !== "authenticated") return;
    fetch(`/api/event-dashboard/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          setError(err.error || "エラーが発生しました");
          return;
        }
        return r.json();
      })
      .then((d) => d && setData(d))
      .finally(() => setLoading(false));
  }, [params.id, authStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doCheckin = useCallback(
    async (code: string) => {
      if (!code.trim() || processing) return;
      setProcessing(true);
      setCheckinResult(null);

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketCode: code.trim() }),
        });
        const result: CheckinResult = await res.json();
        setCheckinResult(result);

        setCheckinLogs((prev) => [
          {
            time: new Date().toLocaleTimeString("ja-JP"),
            ticketCode: result.ticket?.ticketCode || code,
            buyerName: result.ticket?.buyerName || "-",
            success: result.success,
            message: result.success ? "入場OK" : result.error || "エラー",
          },
          ...prev,
        ]);

        setTicketCode("");
        // Refresh dashboard data
        fetchData();
      } finally {
        setProcessing(false);
        inputRef.current?.focus();
      }
    },
    [processing, fetchData]
  );

  const handleCheckin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await doCheckin(ticketCode);
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (html5QrCodeRef.current) {
        try { await html5QrCodeRef.current.stop(); } catch { /* ignore */ }
      }
      const scanner = new Html5Qrcode("qr-reader-event");
      html5QrCodeRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          try { await scanner.stop(); } catch { /* ignore */ }
          setScanning(false);
          let code = decodedText;
          if (decodedText.includes("/ticket/")) {
            code = decodedText.split("/ticket/").pop() || decodedText;
          }
          setTicketCode(code);
          await doCheckin(code);
        },
        () => {}
      );
    } catch {
      alert("カメラを起動できませんでした。カメラへのアクセスを許可してください。");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch { /* ignore */ }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  if (authStatus === "loading") {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl text-gray-500">読み込み中...</p>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              イベントダッシュボード
            </h1>
            <p className="text-gray-500 mb-6">ログインしてチケット状況を確認</p>
            <button
              onClick={() => signIn("google")}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700"
            >
              Googleでログイン
            </button>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⛔</div>
            <p className="text-xl text-red-600 font-bold">{error}</p>
            <p className="text-gray-500 mt-2">このイベントの閲覧権限がありません</p>
          </div>
        </div>
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl text-gray-500">読み込み中...</p>
        </div>
      </>
    );
  }

  const checkinRate = data.totalPaid + data.totalCheckedIn > 0
    ? (data.totalCheckedIn / (data.totalPaid + data.totalCheckedIn)) * 100
    : 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Event Header */}
        <div className="bg-indigo-600 text-white py-6 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold">{data.event.name}</h1>
            <p className="text-indigo-200 mt-1">
              📅{" "}
              {new Date(data.event.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
              {" "}📍 {data.event.venue}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="flex gap-2 bg-white rounded-xl shadow p-1">
            <button
              onClick={() => setTab("dashboard")}
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition-colors ${
                tab === "dashboard"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 ダッシュボード
            </button>
            <button
              onClick={() => setTab("checkin")}
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition-colors ${
                tab === "checkin"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              ✅ チェックイン
            </button>
            <button
              onClick={() => { setTab("attendees"); fetchData(); }}
              className={`flex-1 py-3 rounded-lg text-lg font-bold transition-colors ${
                tab === "attendees"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              👥 来場者
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 mt-4">
          {/* Dashboard Tab */}
          {tab === "dashboard" && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500">売上</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{data.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500">販売数</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.totalSold}/{data.totalCapacity}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500">入場済</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data.totalCheckedIn}人
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500">予約中</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {data.totalReserved}件
                  </p>
                </div>
              </div>

              {/* Overall Fill Rate */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">全体充足率</span>
                  <span className="text-gray-500">
                    {data.totalSold}/{data.totalCapacity}席 (
                    {data.fillRate.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5">
                  <div
                    className="bg-indigo-600 h-5 rounded-full transition-all"
                    style={{ width: `${Math.min(data.fillRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Seat Type Breakdown */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  席種別状況
                </h2>
                <div className="space-y-4">
                  {data.seatTypeSummaries.map((st) => (
                    <div key={st.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-bold text-gray-800">{st.name}</span>
                          <span className="text-indigo-600 ml-2">
                            ¥{st.price.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          残り {st.remaining}席
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full ${
                            st.fillRate > 80 ? "bg-green-500" : st.fillRate > 50 ? "bg-yellow-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(st.fillRate, 100)}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>販売: {st.sold}枚</span>
                        <span>決済済: {st.paid}枚</span>
                        <span>入場済: {st.checkedIn}人</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Checkin Tab */}
          {tab === "checkin" && (
            <>
              {/* Checkin Stats */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">入場率</span>
                  <span className="font-bold text-lg">
                    {data.totalCheckedIn}/{data.totalPaid + data.totalCheckedIn}人 ({checkinRate.toFixed(0)}%)
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
                  id="qr-reader-event"
                  className={`${scanning ? "" : "hidden"} rounded-xl overflow-hidden`}
                  style={{ maxWidth: "500px", margin: "0 auto" }}
                />
                {scanning && (
                  <p className="text-center text-gray-500 mt-2">
                    チケットのQRコードをカメラにかざしてください
                  </p>
                )}
              </div>

              {/* Manual Input */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">手動入力</h3>
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
              {checkinResult && (
                <div
                  className={`rounded-xl shadow p-6 mb-6 ${
                    checkinResult.success
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-red-50 border-2 border-red-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-3">
                      {checkinResult.success ? "✅" : "❌"}
                    </div>
                    <p className={`text-2xl font-bold ${
                      checkinResult.success ? "text-green-700" : "text-red-700"
                    }`}>
                      {checkinResult.success ? checkinResult.message : checkinResult.error}
                    </p>
                    {checkinResult.ticket && (
                      <div className="mt-4 text-lg">
                        <p className="font-bold">{checkinResult.ticket.buyerName}</p>
                        <p className="text-gray-600">
                          {checkinResult.ticket.event.name} | {checkinResult.ticket.seatType.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Local Log */}
              {checkinLogs.length > 0 && (
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    今回のチェックイン
                  </h3>
                  <div className="space-y-2">
                    {checkinLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          log.success ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <span className="text-xl">{log.success ? "✅" : "❌"}</span>
                        <span className="text-sm text-gray-500">{log.time}</span>
                        <span className="font-mono text-sm">{log.ticketCode}</span>
                        <span className="font-medium">{log.buyerName}</span>
                        <span className={`ml-auto text-sm ${
                          log.success ? "text-green-600" : "text-red-600"
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Checkin History */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    入場済み一覧（全管理者共有）
                  </h3>
                  <button
                    onClick={fetchData}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    🔄 更新
                  </button>
                </div>
                {data.checkinHistory.length === 0 ? (
                  <p className="text-gray-500">まだ入場者はいません</p>
                ) : (
                  <div className="space-y-2">
                    {data.checkinHistory.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-50"
                      >
                        <span className="text-xl">✅</span>
                        <span className="text-sm text-gray-500">
                          {new Date(h.checkedInAt).toLocaleTimeString("ja-JP")}
                        </span>
                        <span className="font-mono text-sm">{h.ticketCode}</span>
                        <span className="font-medium">{h.buyerName}</span>
                        <span className="text-gray-500 text-sm ml-auto">{h.seatType.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Attendees Tab */}
          {tab === "attendees" && (
            <>
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">入場率</span>
                  <span className="font-bold text-lg">
                    {data.attendees.filter((a) => a.status === "CHECKED_IN").length}/
                    {data.attendees.length}人
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-green-500 h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      width: `${data.attendees.length > 0
                        ? (data.attendees.filter((a) => a.status === "CHECKED_IN").length / data.attendees.length) * 100
                        : 0}%`,
                    }}
                  >
                    {data.attendees.length > 0 &&
                      `${Math.round(
                        (data.attendees.filter((a) => a.status === "CHECKED_IN").length / data.attendees.length) * 100
                      )}%`}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    来場者一覧（{data.attendees.length}名）
                  </h3>
                  <button
                    onClick={fetchData}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    🔄 更新
                  </button>
                </div>

                {data.attendees.length === 0 ? (
                  <p className="text-gray-500">チケット購入者がいません</p>
                ) : (
                  <div className="space-y-2">
                    {data.attendees.map((a, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          a.status === "CHECKED_IN" ? "bg-green-50" : "bg-gray-50"
                        }`}
                      >
                        <span className="text-xl">
                          {a.status === "CHECKED_IN" ? "✅" : "⬜"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800">{a.buyerName}</p>
                          <p className="text-sm text-gray-500">
                            {a.seatType.name}
                            {a.buyerPhone && ` | ${a.buyerPhone}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {a.status === "CHECKED_IN" ? (
                            <span className="text-green-600 text-sm font-bold">
                              入場済
                              <br />
                              <span className="text-xs font-normal text-gray-500">
                                {a.checkedInAt &&
                                  new Date(a.checkedInAt).toLocaleTimeString("ja-JP", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </span>
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-sm font-bold">
                              未入場
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
