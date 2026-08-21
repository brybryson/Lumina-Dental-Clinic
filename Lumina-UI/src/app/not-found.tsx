import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-5">
          <AlertCircle size={28} />
        </div>
        <h1 className="display text-2xl font-extrabold text-[#0f172a]">
          404 - Page Not Found
        </h1>
        <p className="mt-3 text-sm text-[#64748b] leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="button-primary mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold w-full"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
