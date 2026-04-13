"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/Header";

export default function CreateEventPage() {
  const { data: session, status: authStatus } = useSession();
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    description: "",
  });
  const [seatTypes, setSeatTypes] = useState([
    { name: "一般席", price: "3000", capacity: "100" },
  ]);
  const [flyerUrl, setFlyerUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              イベントを作成するにはログインが必要です
            </h1>
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

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.venue) {
      alert("イベント名、日時、会場は必須です");
      return;
    }
    if (seatTypes.some((st) => !st.name || !st.price || !st.capacity)) {
      alert("席種の情報をすべて入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          flyerUrl: flyerUrl || null,
          status: "PENDING",
          creatorEmail: session.user?.email,
          seatTypes: seatTypes.map((st) => ({
            name: st.name,
            price: parseInt(st.price),
            capacity: parseInt(st.capacity),
          })),
        }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        alert("エラーが発生しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📨</div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              イベント申請を送信しました！
            </h1>
            <p className="text-lg text-gray-500 mb-6">
              管理者が内容を確認後、承認されると公開されます。
              承認されるまでしばらくお待ちください。
            </p>
            <a
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-indigo-700"
            >
              ホームに戻る
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white py-6 px-4">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">イベントを作成</h1>
            <p className="text-indigo-200 mt-1">
              申請後、管理者の承認を経て公開されます
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 mt-6">
          <div className="bg-white rounded-2xl shadow p-6 space-y-5">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                イベント名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
                placeholder="例: 春の音楽祭 2026"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                開催日時 *
              </label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                会場 *
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
                placeholder="例: 東京ドーム"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
                rows={3}
                placeholder="イベントの詳細を入力"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                チラシ画像 / PDF
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("eventId", "new");
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: fd,
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setFlyerUrl(data.url);
                    } else {
                      alert(data.error || "アップロードに失敗しました");
                    }
                  } finally {
                    setUploading(false);
                  }
                }}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg"
              />
              {uploading && (
                <p className="text-indigo-600 text-sm mt-1">
                  アップロード中...
                </p>
              )}
              {flyerUrl && !flyerUrl.endsWith(".pdf") && (
                <img
                  src={flyerUrl}
                  alt="プレビュー"
                  className="mt-2 max-h-40 rounded-lg"
                />
              )}
            </div>

            {/* Seat Types */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                席種 *
              </label>
              {seatTypes.map((st, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    value={st.name}
                    onChange={(e) => {
                      const u = [...seatTypes];
                      u[i].name = e.target.value;
                      setSeatTypes(u);
                    }}
                    className="border rounded-lg px-3 py-2 flex-1"
                    placeholder="名前"
                  />
                  <input
                    type="number"
                    value={st.price}
                    onChange={(e) => {
                      const u = [...seatTypes];
                      u[i].price = e.target.value;
                      setSeatTypes(u);
                    }}
                    className="border rounded-lg px-3 py-2 w-24"
                    placeholder="料金"
                  />
                  <input
                    type="number"
                    value={st.capacity}
                    onChange={(e) => {
                      const u = [...seatTypes];
                      u[i].capacity = e.target.value;
                      setSeatTypes(u);
                    }}
                    className="border rounded-lg px-3 py-2 w-20"
                    placeholder="定員"
                  />
                  {seatTypes.length > 1 && (
                    <button
                      onClick={() =>
                        setSeatTypes(seatTypes.filter((_, j) => j !== i))
                      }
                      className="text-red-500 text-xl px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() =>
                  setSeatTypes([
                    ...seatTypes,
                    { name: "", price: "3000", capacity: "50" },
                  ])
                }
                className="text-indigo-600 text-sm hover:underline"
              >
                ＋ 席種を追加
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "送信中..." : "イベントを申請する"}
            </button>

            <p className="text-sm text-gray-400 text-center">
              申請後、管理者が確認・承認します
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
