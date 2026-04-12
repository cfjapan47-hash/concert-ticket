"use client";

import { useEffect, useState } from "react";

export default function LineRedirect() {
  const [isLine, setIsLine] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("line/")) {
      setIsLine(true);
      setCurrentUrl(window.location.href);

      // 自動的に外部ブラウザで開く試行
      const url = window.location.href;
      // Android: intent スキームで Chrome を起動
      if (ua.includes("android")) {
        window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }
  }, []);

  if (!isLine) return null;

  const openExternal = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      // Android: intent スキームで外部ブラウザ起動
      window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // iOS: openURL で Safari を起動
      window.location.href = `https://line.me/R/browse?url=${encodeURIComponent(currentUrl)}`;
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ブラウザで開いてください
        </h1>
        <p className="text-gray-500 mb-6 text-lg leading-relaxed">
          LINEアプリ内ではGoogleログインが使えません。<br />
          以下の方法でブラウザで開いてください。
        </p>

        <button
          onClick={openExternal}
          className="block w-full bg-indigo-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700 mb-3"
        >
          ブラウザで開く
        </button>

        <button
          onClick={copyUrl}
          className="block w-full bg-gray-200 text-gray-700 px-6 py-4 rounded-xl text-lg font-bold hover:bg-gray-300 mb-3"
        >
          {copied ? "✅ コピーしました！" : "URLをコピーして貼り付ける"}
        </button>

        {copied && (
          <p className="text-green-600 font-bold mb-3">
            SafariやChromeを開いてアドレスバーに貼り付けてください
          </p>
        )}

        <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left">
          <p className="text-sm font-bold text-gray-700 mb-2">
            その他の方法：
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            画面右下の「⋮」メニュー → 「他のブラウザで開く」をタップ
          </p>
        </div>
      </div>
    </div>
  );
}
