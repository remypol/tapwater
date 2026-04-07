import { CITIES } from "@/lib/cities";

export function extractPostcodeDistricts(text: string): string[] {
  const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*\d?[A-Z]{0,2}\b/gi;
  const matches = text.matchAll(postcodeRegex);
  const districts = new Set<string>();

  for (const match of matches) {
    const district = match[1].toUpperCase();
    districts.add(district);
  }

  return [...districts];
}

export function mapPostcodesToCities(postcodes: string[]): string[] {
  const citySet = new Set<string>();
  const upperPostcodes = postcodes.map((p) => p.toUpperCase());

  for (const city of CITIES) {
    const cityPrefixes = CITY_POSTCODE_MAP[city.slug];
    if (!cityPrefixes) continue;

    for (const postcode of upperPostcodes) {
      if (cityPrefixes.some((prefix) => postcode.startsWith(prefix))) {
        citySet.add(city.slug);
      }
    }
  }

  return [...citySet];
}

const CITY_POSTCODE_MAP: Record<string, string[]> = {
  london: ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"],
  manchester: ["M"],
  birmingham: ["B"],
  leeds: ["LS"],
  glasgow: ["G"],
  edinburgh: ["EH"],
  bristol: ["BS"],
  liverpool: ["L"],
  sheffield: ["S"],
  newcastle: ["NE"],
  nottingham: ["NG"],
  cardiff: ["CF"],
  brighton: ["BN"],
  oxford: ["OX"],
  cambridge: ["CB"],
  bath: ["BA"],
  york: ["YO"],
  exeter: ["EX"],
  swansea: ["SA"],
  portsmouth: ["PO"],
  leicester: ["LE"],
  coventry: ["CV"],
  derby: ["DE"],
  "stoke-on-trent": ["ST"],
  wolverhampton: ["WV"],
  plymouth: ["PL"],
  southampton: ["SO"],
  sunderland: ["SR"],
  aberdeen: ["AB"],
  dundee: ["DD"],
  norwich: ["NR"],
  reading: ["RG"],
  ipswich: ["IP"],
  peterborough: ["PE"],
  chester: ["CH"],
  worcester: ["WR"],
  gloucester: ["GL"],
  lincoln: ["LN"],
  canterbury: ["CT"],
  carlisle: ["CA"],
  inverness: ["IV"],
  hull: ["HU"],
  middlesbrough: ["TS"],
  blackpool: ["FY"],
  preston: ["PR"],
  bolton: ["BL"],
  wigan: ["WN"],
  warrington: ["WA"],
  bradford: ["BD"],
  huddersfield: ["HD"],
  wakefield: ["WF"],
};

export async function validatePostcodes(
  postcodes: string[],
): Promise<string[]> {
  const { getAllPostcodeDistricts } = await import("@/lib/data");
  const known = new Set(await getAllPostcodeDistricts());
  return postcodes.filter((p) => known.has(p.toUpperCase()));
}
