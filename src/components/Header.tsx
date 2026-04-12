"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();

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
            <button
              onClick={() => signIn("google")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-indigo-700"
            >
              Googleでログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
