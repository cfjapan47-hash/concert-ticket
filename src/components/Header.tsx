"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          🎟 コンサートチケット
        </Link>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-gray-400 text-sm">...</span>
          ) : session?.user ? (
            <>
              <Link
                href="/mypage"
                className="text-indigo-600 hover:text-indigo-800 font-medium text-lg"
              >
                マイチケット
              </Link>
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border rounded-lg"
              >
                ログアウト
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-indigo-700"
              >
                ログイン
              </button>
              {showLoginMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLoginMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                    <button
                      onClick={() => { signIn("google"); setShowLoginMenu(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-base"
                    >
                      <span className="text-xl">G</span>
                      Googleでログイン
                    </button>
                    <button
                      onClick={() => { signIn("line"); setShowLoginMenu(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-base border-t"
                    >
                      <span className="text-xl text-green-500">💬</span>
                      LINEでログイン
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
