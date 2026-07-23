import type { Metadata } from "next";
import Link from "next/link";
import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema } from "@/components/json-ld";
import { getPostcodeIndex, type PostcodeIndexEntry } from "@/lib/data";

export const revalidate = 86400; // Matches the postcode pages this links into.

const TITLE = "UK Water Quality by Postcode";
const DESCRIPTION =
  "Browse water quality reports for every UK postcode district. Hardness, PFAS, lead and nitrate results, grouped by postcode area.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://www.tapwater.uk/postcode" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.tapwater.uk/postcode",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

interface PostcodeArea {
  code: string;
  label: string;
  districts: PostcodeIndexEntry[];
}

/** Most common city in a group, used to label the area in plain English. */
function dominantCity(entries: PostcodeIndexEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!e.city) continue;
    counts.set(e.city, (counts.get(e.city) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [city, count] of counts) {
    if (count > bestCount) {
      best = city;
      bestCount = count;
    }
  }
  return best;
}

/** Group districts by their letter prefix: B11 and B1 both belong to area B. */
function groupByArea(entries: PostcodeIndexEntry[]): PostcodeArea[] {
  const groups = new Map<string, PostcodeIndexEntry[]>();
  for (const entry of entries) {
    const code = /^[A-Z]+/.exec(entry.district)?.[0];
    if (!code) continue;
    const bucket = groups.get(code);
    if (bucket) bucket.push(entry);
    else groups.set(code, [entry]);
  }

  return Array.from(groups.entries())
    .map(([code, districts]) => ({
      code,
      label: dominantCity(districts),
      districts,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export default async function PostcodeIndexPage() {
  const entries = await getPostcodeIndex();
  const areas = groupByArea(entries);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Postcodes", url: "https://www.tapwater.uk/postcode" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl text-ink italic tracking-tight">
          UK water quality by postcode
        </h1>
        <p className="text-body mt-3 max-w-2xl text-lg">
          Every postcode district we hold test results for, grouped by postcode
          area. Each report covers hardness, PFAS, lead, nitrate and more.
        </p>

        <div className="mt-6 max-w-md">
          <PostcodeSearch />
        </div>

        <p className="text-sm text-faint mt-4">
          {entries.length.toLocaleString("en-GB")} districts across{" "}
          {areas.length} postcode areas.
        </p>

        <div className="mt-12 space-y-8">
          {areas.map((area) => (
            <section key={area.code} aria-labelledby={`area-${area.code}`}>
              <h2
                id={`area-${area.code}`}
                className="font-display text-xl italic text-ink scroll-mt-24"
              >
                {area.code}
                {area.label ? (
                  <span className="text-body not-italic font-normal text-base">
                    {" "}
                    &mdash; {area.label}
                  </span>
                ) : null}
                <span className="text-faint not-italic font-normal text-sm">
                  {" "}
                  ({area.districts.length})
                </span>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {area.districts.map((d) => (
                  <Link
                    key={d.district}
                    href={`/postcode/${d.district}`}
                    title={`${d.district} — ${d.areaName}`}
                    className="rounded-lg border border-rule px-2.5 py-1 text-sm text-body hover:border-accent/40 hover:text-ink transition-colors"
                  >
                    {d.district}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
