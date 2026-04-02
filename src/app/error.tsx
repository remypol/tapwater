"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center">
      <h1 className="font-display text-3xl text-ink italic">
        Something went wrong
      </h1>
      <p className="text-body mt-4 leading-relaxed">
        We hit an unexpected error loading this page. This has been logged
        and we&apos;ll look into it.
      </p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <button
          onClick={reset}
          className="bg-ink text-white rounded-lg py-2.5 px-5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm text-accent hover:underline underline-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
