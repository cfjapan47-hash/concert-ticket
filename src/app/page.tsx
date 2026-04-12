import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="text-6xl mb-6">🎟</div>
        <h1 className="text-4xl font-bold mb-4">
          コンサートチケット管理システム
        </h1>
        <p className="text-xl text-indigo-200 mb-8">
          チケットの発行・予約・販売・入場管理を一元化
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/events"
            className="inline-block bg-white text-indigo-700 px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            チケットを購入する
          </Link>
          <Link
            href="/admin"
            className="inline-block bg-indigo-700 text-white border-2 border-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-800 transition-colors shadow-lg"
          >
            管理画面へ
          </Link>
        </div>
      </div>
    </div>
  );
}
