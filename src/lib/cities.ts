/**
 * City data for TapWater.uk programmatic city pages.
 *
 * `matches` lists the admin_district values (from postcodes.io)
 * that belong to each city. London boroughs are separate admin
 * districts, so we list them individually.
 */

export interface CityInfo {
  slug: string;
  name: string;
  region: string;
  description: string;
  matches: string[]; // admin_district names to match against PostcodeData.city
}

export const CITIES: CityInfo[] = [
  {
    slug: "london",
    name: "London",
    region: "England",
    description:
      "The capital serves over 9 million people through Thames Water, one of the UK's largest water suppliers.",
    matches: [
      "Westminster",
      "Southwark",
      "Greenwich",
      "Hackney",
      "Tower Hamlets",
      "Camden",
      "Kensington and Chelsea",
      "Hammersmith and Fulham",
      "Barnet",
    ],
  },
  {
    slug: "manchester",
    name: "Manchester",
    region: "England",
    description:
      "Supplied by United Utilities, Manchester's water comes primarily from reservoirs in the Lake District and Peak District.",
    matches: ["Manchester", "Salford"],
  },
  {
    slug: "birmingham",
    name: "Birmingham",
    region: "England",
    description:
      "Served by Severn Trent, Birmingham's water travels over 70 miles from the Elan Valley in Wales.",
    matches: ["Birmingham"],
  },
  {
    slug: "leeds",
    name: "Leeds",
    region: "England",
    description:
      "Yorkshire Water supplies Leeds from reservoirs across the Pennines and Yorkshire Dales.",
    matches: ["Leeds"],
  },
  {
    slug: "glasgow",
    name: "Glasgow",
    region: "Scotland",
    description:
      "Scottish Water supplies Glasgow from Loch Katrine, widely considered some of the UK's softest and purest water.",
    matches: ["Glasgow", "Glasgow City"],
  },
  {
    slug: "edinburgh",
    name: "Edinburgh",
    region: "Scotland",
    description:
      "Scottish Water supplies Edinburgh from multiple reservoirs in the Pentland Hills and Moorfoot Hills.",
    matches: ["City of Edinburgh"],
  },
  {
    slug: "bristol",
    name: "Bristol",
    region: "England",
    description:
      "Bristol Water draws from the Mendip Hills reservoirs and underground sources in the surrounding area.",
    matches: ["Bristol, City of", "North Somerset"],
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    region: "England",
    description:
      "United Utilities supplies Liverpool with water from Lake Vyrnwy in Wales and local reservoirs.",
    matches: ["Liverpool"],
  },
  {
    slug: "sheffield",
    name: "Sheffield",
    region: "England",
    description:
      "Yorkshire Water serves Sheffield from reservoirs in the Peak District and surrounding moorlands.",
    matches: ["Sheffield"],
  },
  {
    slug: "newcastle",
    name: "Newcastle",
    region: "England",
    description:
      "Northumbrian Water supplies Newcastle from Kielder Water, Europe's largest man-made lake.",
    matches: ["Newcastle upon Tyne"],
  },
  {
    slug: "nottingham",
    name: "Nottingham",
    region: "England",
    description:
      "Severn Trent supplies Nottingham primarily from the Derwent Valley reservoirs in Derbyshire.",
    matches: ["Nottingham", "Broxtowe"],
  },
  {
    slug: "cardiff",
    name: "Cardiff",
    region: "Wales",
    description:
      "Dŵr Cymru Welsh Water supplies Cardiff from reservoirs in the Brecon Beacons and Taff Fawr valley.",
    matches: ["Cardiff"],
  },
  {
    slug: "brighton",
    name: "Brighton",
    region: "England",
    description:
      "Southern Water supplies Brighton from chalk aquifers beneath the South Downs, producing naturally hard water.",
    matches: ["Brighton and Hove"],
  },
  {
    slug: "oxford",
    name: "Oxford",
    region: "England",
    description:
      "Thames Water supplies Oxford from a mix of river abstraction and local groundwater sources.",
    matches: ["Oxford", "South Oxfordshire"],
  },
  {
    slug: "cambridge",
    name: "Cambridge",
    region: "England",
    description:
      "Cambridge Water (now part of South Staffs Water) draws from chalk aquifers, producing very hard water.",
    matches: ["Cambridge", "South Cambridgeshire"],
  },
  {
    slug: "bath",
    name: "Bath",
    region: "England",
    description:
      "Wessex Water supplies Bath, drawing from springs and boreholes in the surrounding limestone geology.",
    matches: ["Bath and North East Somerset"],
  },
  {
    slug: "york",
    name: "York",
    region: "England",
    description:
      "Yorkshire Water supplies York from the River Derwent and River Ouse, with treatment at Elvington.",
    matches: ["York"],
  },
  {
    slug: "exeter",
    name: "Exeter",
    region: "England",
    description:
      "South West Water supplies Exeter from Wimbleball and Roadford reservoirs on Exmoor and Dartmoor.",
    matches: ["Exeter"],
  },
  {
    slug: "swansea",
    name: "Swansea",
    region: "Wales",
    description:
      "Dŵr Cymru Welsh Water supplies Swansea from reservoirs in the Brecon Beacons and upper Swansea Valley.",
    matches: ["Swansea"],
  },
  {
    slug: "portsmouth",
    name: "Portsmouth",
    region: "England",
    description:
      "Portsmouth Water draws from chalk springs and boreholes in the Hampshire Downs, one of the UK's smallest water companies.",
    matches: ["Portsmouth"],
  },
];

export function getCityBySlug(slug: string): CityInfo | undefined {
  return CITIES.find((c) => c.slug === slug);
}
