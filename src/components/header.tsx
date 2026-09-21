import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import "@/components/tank/chrome.css";

// Ordered by what visitors come for, not by how the database is laid out. Rankings,
// contaminants, suppliers and news keep a site-wide link in the footer.
const navLinks = [
  { label: "Postcodes", href: "/postcode" },
  { label: "Hardness", href: "/hardness" },
  { label: "Filters", href: "/filters" },
  { label: "Guides", href: "/guides" },
  { label: "About the data", href: "/about" },
];

export function Header() {
  return (
    <header className="tc-header">
      <div className="tc-header-in">
        <Link href="/" className="tc-mark" aria-label="TapWater.uk home">
          tap<span>water</span>
        </Link>
        {/* Desktop nav — hidden below sm, bottom bar handles mobile */}
        <NavLinks links={navLinks} />
      </div>
    </header>
  );
}
