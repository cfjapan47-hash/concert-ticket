import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="text-6xl mb-6">🎟</div>
        <h1 className="text-4xl font-bold mb-4">
          コンサートチケット
        </h1>
        <p className="text-xl text-indigo-200 mb-8">
          オンラインでチケットを購入できます
        </p>
        <Link
          href="/events"
          className="inline-block bg-white text-indigo-700 px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
        >
          チケットを購入する
        </Link>
      </div>
    </div>
  );
}
