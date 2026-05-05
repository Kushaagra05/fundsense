import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center py-24">
        <div className="text-6xl sm:text-8xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-600">404</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Page not found</h1>
        <p className="text-slate-400 mb-8">Lagta hai galat jagah aa gaye. Wapas chalo!</p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
