import Link from "next/link";
import { Code2 } from "lucide-react";

/**
 * Distribution surface for the embed widget (public/widget.js). The widget
 * itself has existed for months with exactly one internal link pointing at
 * /widget; every embed renders a followed, branded deep link back to the
 * district page, so putting this card where the data lives is the cheapest
 * link acquisition the site has.
 */
export function EmbedCta({ district }: { district: string }) {
  const snippet = `<div data-tapwater-postcode="${district}"></div>\n<script src="https://www.tapwater.uk/widget.js" async></script>`;

  return (
    <div className="card p-5 mt-8">
      <div className="flex items-center gap-2 mb-2">
        <Code2 className="w-4 h-4 text-accent shrink-0" />
        <h2 className="font-display text-xl text-ink italic">
          Embed this score on your site
        </h2>
      </div>
      <p className="text-sm text-body leading-relaxed mb-3">
        Free live water quality widget for {district}: paste these two lines
        anywhere on your page. It stays up to date by itself and credits
        TapWater.uk automatically.
      </p>
      <pre className="bg-wash border border-rule rounded-lg p-3 overflow-x-auto">
        <code className="font-data text-xs text-body">{snippet}</code>
      </pre>
      <Link
        href="/widget"
        className="inline-flex items-center gap-1.5 mt-3 text-sm text-accent font-medium hover:underline underline-offset-2"
      >
        Widget docs, themes and more examples
      </Link>
    </div>
  );
}
