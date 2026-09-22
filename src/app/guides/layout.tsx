import "@/components/tank/tank.css";
import "@/components/tank/guide.css";

/**
 * Every guide renders inside the tank system. The guides keep their own bodies,
 * copy, schema and links; guide.css re-dresses the furniture they share (headings,
 * cards, pills, badges, the accent colour) so all 35 change together.
 */
export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <div className="wt wt-guide">{children}</div>;
}
