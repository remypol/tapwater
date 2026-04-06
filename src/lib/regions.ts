export interface RegionInfo {
  slug: string;
  name: string;
  description: string;
  cities: string[]; // city slugs from src/lib/cities.ts
}

export const REGIONS: RegionInfo[] = [
  {
    slug: "london",
    name: "London",
    description: "Water quality across Greater London, supplied primarily by Thames Water and Affinity Water.",
    cities: ["london"],
  },
  {
    slug: "south-east",
    name: "South East England",
    description: "Water quality in Kent, Sussex, Surrey, Hampshire and surrounding areas. Supplied by Southern Water, South East Water, and Portsmouth Water.",
    cities: ["brighton", "southampton", "portsmouth", "canterbury", "maidstone"],
  },
  {
    slug: "south-west",
    name: "South West England",
    description: "Water quality across Devon, Cornwall, Somerset, Dorset and Bristol. Supplied by South West Water, Wessex Water, and Bristol Water.",
    cities: ["bristol", "exeter", "plymouth", "bath"],
  },
  {
    slug: "east-of-england",
    name: "East of England",
    description: "Water quality in Norfolk, Suffolk, Essex, Cambridgeshire and surrounding areas. Supplied by Anglian Water.",
    cities: ["cambridge", "norwich", "ipswich", "peterborough"],
  },
  {
    slug: "west-midlands",
    name: "West Midlands",
    description: "Water quality across Birmingham, Coventry, Wolverhampton and the Black Country. Supplied by Severn Trent.",
    cities: ["birmingham", "coventry", "wolverhampton", "stoke-on-trent"],
  },
  {
    slug: "east-midlands",
    name: "East Midlands",
    description: "Water quality across Nottingham, Leicester, Derby and surrounding areas. Supplied by Severn Trent.",
    cities: ["nottingham", "leicester", "derby"],
  },
  {
    slug: "yorkshire",
    name: "Yorkshire and the Humber",
    description: "Water quality across Leeds, Sheffield, Bradford, York and Hull. Supplied by Yorkshire Water.",
    cities: ["leeds", "sheffield", "bradford", "york", "hull"],
  },
  {
    slug: "north-west",
    name: "North West England",
    description: "Water quality across Manchester, Liverpool, and Lancashire. Supplied by United Utilities.",
    cities: ["manchester", "liverpool", "preston", "blackpool"],
  },
  {
    slug: "north-east",
    name: "North East England",
    description: "Water quality across Newcastle, Sunderland, Durham and Teesside. Supplied by Northumbrian Water.",
    cities: ["newcastle", "sunderland", "middlesbrough"],
  },
  {
    slug: "wales",
    name: "Wales",
    description: "Water quality across Cardiff, Swansea, Newport and rural Wales. Supplied by Dŵr Cymru Welsh Water.",
    cities: ["cardiff", "swansea", "newport"],
  },
  {
    slug: "scotland",
    name: "Scotland",
    description: "Water quality across Edinburgh, Glasgow, Aberdeen and the Highlands. Supplied by Scottish Water.",
    cities: ["edinburgh", "glasgow", "aberdeen", "dundee"],
  },
];

export function getRegionBySlug(slug: string): RegionInfo | undefined {
  return REGIONS.find((r) => r.slug === slug);
}
