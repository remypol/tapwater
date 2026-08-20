import Link from "next/link";
import { Droplets } from "lucide-react";

const navigateLinks = [
  { label: "Home", href: "/" },
  // Site-wide entry point into the postcode network. Without a link from every page
  // the index would itself have no incoming links, and the districts it exists to
  // reach would stay orphaned.
  { label: "All postcodes", href: "/postcode" },
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/about/methodology" },
  { label: "Data Sources", href: "/about/data-sources" },
  { label: "Press", href: "/press" },
  { label: "Embed our widget", href: "/widget" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function Footer() {
  return (
    <footer
      className="w-full bg-[#0c0f17]"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Main asymmetric layout */}
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between sm:gap-16">
          {/* Left: brand + description */}
          <div className="sm:max-w-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Droplets className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
              <span
                className="text-lg text-white tracking-tight"
                style={{ fontFamily: "var(--font-instrument-serif)" }}
              >
                tapwater<span className="text-accent">.uk</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Independent water quality research. We aggregate UK government data so you can make informed decisions about what you drink.
            </p>
          </div>

          {/* Right: two link groups */}
          <div className="flex gap-12 sm:gap-16 flex-shrink-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-4">
                Navigate
              </p>
              <ul className="space-y-2.5">
                {navigateLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-4">
                Legal
              </p>
              <ul className="space-y-2.5">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-xs italic text-gray-700 leading-relaxed">
          This site provides educational information only and does not constitute medical advice.
        </p>

        {/* Divider */}
        <div className="mt-6 border-t border-gray-800" />

        {/* Bottom bar */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600 leading-relaxed">
            {/* "Updated daily" ran on every page, including reports whose own banner
                said the sample was over 26 years old. Each report carries its real
                sample date, so point there instead of making a blanket claim. */}
            Data sourced from UK water companies, the Environment Agency and the
            Drinking Water Inspectorate. Each report shows when its sample was taken.
          </p>
          <p className="text-xs text-gray-600 flex-shrink-0">
            &copy; 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
