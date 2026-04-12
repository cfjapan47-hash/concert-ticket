"use client";

import { useEffect, useState } from "react";

export default function LineRedirect() {
  const [isLine, setIsLine] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("line/")) {
      setIsLine(true);
    }
  }, []);

  if (!isLine) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ブラウザで開いてください
        </h1>
        <p className="text-gray-500 mb-6 text-lg">
          LINEアプリ内ではGoogleログインが使えません。
          下のボタンからブラウザで開いてください。
        </p>

        {/* iOS: Safari で開く */}
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-indigo-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 mb-3"
        >
          ブラウザで開く
        </a>

        {/* URLコピーボタン */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(currentUrl);
            alert("URLをコピーしました。ブラウザに貼り付けて開いてください。");
          }}
          className="block w-full bg-gray-200 text-gray-700 px-6 py-4 rounded-xl text-lg font-bold hover:bg-gray-300"
        >
          URLをコピー
        </button>

        <p className="text-sm text-gray-400 mt-4">
          右上の「⋮」メニュー →「ブラウザで開く」でも開けます
        </p>
      </div>
    </div>
  );
}
