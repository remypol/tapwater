import Link from "next/link";

// Every section of the site has one link here, so it has one link from every page.
// /postcode in particular: without a site-wide link the index would itself have no
// incoming links, and the districts it exists to reach would stay orphaned.
const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Your water",
    links: [
      { label: "All postcodes", href: "/postcode" },
      { label: "Water hardness", href: "/hardness" },
      { label: "Compare areas", href: "/compare" },
      { label: "Rankings", href: "/rankings" },
      { label: "Water companies", href: "/supplier" },
    ],
  },
  {
    title: "Around you",
    links: [
      { label: "River health", href: "/rivers" },
      { label: "PFAS tracker", href: "/pfas" },
      { label: "Contaminants", href: "/contaminant" },
      { label: "News and incidents", href: "/news" },
    ],
  },
  {
    title: "Fixing it",
    links: [
      { label: "Water filters", href: "/filters" },
      { label: "Guides", href: "/guides" },
      { label: "Water softeners", href: "/guides/best-water-softener-uk" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/about/methodology" },
      { label: "Data Sources", href: "/about/data-sources" },
      { label: "Press", href: "/press" },
      { label: "Embed our widget", href: "/widget" },
      { label: "Data for business", href: "/for-business" },
    ],
  },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function Footer() {
  return (
    <footer className="tc-footer">
      <div className="tc-footer-in">
        <div className="tc-footer-top">
          <div>
            <Link href="/" className="tc-mark">
              tap<span>water</span>
            </Link>
            <p className="tc-footer-about">
              Independent water quality research. We bring together UK water company and government data so you can see what is in your water, and decide what to do about it.
            </p>
          </div>
          <div className="tc-cols">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2>{col.title}</h2>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="tc-footer-bottom">
          {/* "Updated daily" ran on every page, including reports whose own banner
              said the sample was over 26 years old. Each report carries its real
              sample date, so point there instead of making a blanket claim. */}
          <p>
            Data sourced from UK water companies, the Environment Agency and the Drinking Water Inspectorate. Each report shows when its sample was taken. This site
            provides educational information only and does not constitute medical advice.
          </p>
          <p className="tc-legal">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
            <span>&copy; 2026</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
