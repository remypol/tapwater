import Link from "next/link";
import { PostcodeSearch } from "@/components/postcode-search";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
      <p className="text-xs uppercase tracking-[0.15em] text-accent font-semibold mb-4">
        404
      </p>
      <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">
        Page not found
      </h1>
      <p className="text-muted mt-4 text-base leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-10">
        <p className="text-sm text-muted mb-3">
          Try searching for your postcode instead
        </p>
        <PostcodeSearch size="sm" />
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm font-medium text-accent hover:underline underline-offset-2 transition-colors"
        >
          &larr; Back to homepage
        </Link>
      </div>
    </div>
  );
}
