"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/events", label: "イベント管理", icon: "🎵" },
  { href: "/admin/tickets", label: "チケット一覧", icon: "🎫" },
  { href: "/admin/tickets/new", label: "チケット発行", icon: "➕" },
  { href: "/admin/checkin", label: "チェックイン", icon: "✅" },
  { href: "/admin/reports", label: "レポート", icon: "📈" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">管理者ログイン</h1>
          <p className="text-gray-500 mb-6">管理画面にアクセスするにはログインが必要です</p>
          <button
            onClick={() => signIn("google")}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-700"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = (session as Record<string, unknown>).isAdmin;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-500 mb-2">このアカウントは管理者として登録されていません</p>
          <p className="text-gray-400 text-sm">{session.user?.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold">🎟 チケット管理</h1>
          <p className="text-indigo-300 text-sm mt-1">コンサート管理システム</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-lg transition-colors ${
                  isActive
                    ? "bg-indigo-700 text-white border-r-4 border-white"
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-indigo-900 text-white z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">🎟 チケット管理</h1>
        </div>
        <div className="flex overflow-x-auto pb-2 px-2 gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-200 hover:bg-indigo-800"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:p-8 p-4 pt-28 md:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
