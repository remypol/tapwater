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
  {
    slug: "leicester",
    name: "Leicester",
    region: "England",
    description:
      "Severn Trent supplies Leicester from Rutland Water, the largest reservoir by surface area in England.",
    matches: ["Leicester"],
  },
  {
    slug: "coventry",
    name: "Coventry",
    region: "England",
    description:
      "Severn Trent serves Coventry with water drawn from the River Severn and Derwent Valley reservoirs.",
    matches: ["Coventry"],
  },
  {
    slug: "derby",
    name: "Derby",
    region: "England",
    description:
      "Severn Trent supplies Derby from the Derwent Valley reservoirs, which also supply much of the East Midlands.",
    matches: ["Derby", "Amber Valley"],
  },
  {
    slug: "stoke-on-trent",
    name: "Stoke-on-Trent",
    region: "England",
    description:
      "Severn Trent supplies Stoke-on-Trent, drawing water from reservoirs in the Peak District uplands.",
    matches: ["Stoke-on-Trent"],
  },
  {
    slug: "wolverhampton",
    name: "Wolverhampton",
    region: "England",
    description:
      "South Staffordshire Water serves Wolverhampton, drawing primarily from the River Severn and local groundwater.",
    matches: ["Wolverhampton", "South Staffordshire"],
  },
  {
    slug: "plymouth",
    name: "Plymouth",
    region: "England",
    description:
      "South West Water supplies Plymouth from Burrator Reservoir on Dartmoor, a source used since Victorian times.",
    matches: ["Plymouth"],
  },
  {
    slug: "southampton",
    name: "Southampton",
    region: "England",
    description:
      "Southern Water supplies Southampton from chalk aquifers in the Test Valley and river abstraction points.",
    matches: ["Southampton", "Eastleigh"],
  },
  {
    slug: "reading",
    name: "Reading",
    region: "England",
    description:
      "Thames Water supplies Reading from the River Thames and groundwater sources in the Thames Valley.",
    matches: ["Reading", "West Berkshire", "Wokingham"],
  },
  {
    slug: "northampton",
    name: "Northampton",
    region: "England",
    description:
      "Anglian Water supplies Northampton from the Ruthamford system, a network of reservoirs and river abstraction points.",
    matches: ["Northampton", "Northamptonshire"],
  },
  {
    slug: "sunderland",
    name: "Sunderland",
    region: "England",
    description:
      "Northumbrian Water serves Sunderland with water from Kielder Water and the River Wear catchment.",
    matches: ["Sunderland"],
  },
  {
    slug: "warrington",
    name: "Warrington",
    region: "England",
    description:
      "United Utilities supplies Warrington from Lake District and Peak District reservoirs via an extensive treatment network.",
    matches: ["Warrington"],
  },
  {
    slug: "huddersfield",
    name: "Huddersfield",
    region: "England",
    description:
      "Yorkshire Water serves Huddersfield from Pennine reservoirs including Digley, Butterley, and Wessenden.",
    matches: ["Kirklees"],
  },
  {
    slug: "blackpool",
    name: "Blackpool",
    region: "England",
    description:
      "United Utilities supplies Blackpool from Lake District reservoirs, with water treated at Franklaw works.",
    matches: ["Blackpool", "Fylde", "Wyre"],
  },
  {
    slug: "ipswich",
    name: "Ipswich",
    region: "England",
    description:
      "Anglian Water supplies Ipswich from the River Orwell and groundwater sources in the Gipping Valley.",
    matches: ["Ipswich", "Suffolk Coastal"],
  },
  {
    slug: "norwich",
    name: "Norwich",
    region: "England",
    description:
      "Anglian Water supplies Norwich from chalk aquifers beneath Norfolk, producing moderately hard water.",
    matches: ["Norwich", "Broadland"],
  },
  {
    slug: "preston",
    name: "Preston",
    region: "England",
    description:
      "United Utilities serves Preston from Thirlmere and Haweswater in the Lake District, via the Pennine aqueduct.",
    matches: ["Preston", "South Ribble"],
  },
  {
    slug: "gloucester",
    name: "Gloucester",
    region: "England",
    description:
      "Severn Trent supplies Gloucester from the River Severn, with treatment at Mythe and Tewkesbury works.",
    matches: ["Gloucester", "Tewkesbury"],
  },
  {
    slug: "cheltenham",
    name: "Cheltenham",
    region: "England",
    description:
      "Severn Trent serves Cheltenham from Severn river sources and the Cotswold aquifer.",
    matches: ["Cheltenham"],
  },
  {
    slug: "lincoln",
    name: "Lincoln",
    region: "England",
    description:
      "Anglian Water supplies Lincoln from the River Witham and Lincoln Edge limestone aquifer.",
    matches: ["Lincoln", "North Kesteven"],
  },
  {
    slug: "dundee",
    name: "Dundee",
    region: "Scotland",
    description:
      "Scottish Water supplies Dundee from Loch Earn and the River Tay catchment in Perthshire.",
    matches: ["Dundee City"],
  },
  {
    slug: "aberdeen",
    name: "Aberdeen",
    region: "Scotland",
    description:
      "Scottish Water serves Aberdeen from the River Dee, widely rated as one of Scotland's cleanest water sources.",
    matches: ["Aberdeen City"],
  },
  {
    slug: "inverness",
    name: "Inverness",
    region: "Scotland",
    description:
      "Scottish Water supplies Inverness from Loch Ness and the River Ness catchment in the Great Glen.",
    matches: ["Highland"],
  },
  {
    slug: "middlesbrough",
    name: "Middlesbrough",
    region: "England",
    description:
      "Northumbrian Water serves Middlesbrough from Scaling Dam and other Teesside reservoirs fed by the North Yorkshire Moors.",
    matches: ["Middlesbrough", "Stockton-on-Tees"],
  },
  {
    slug: "bradford",
    name: "Bradford",
    region: "England",
    description:
      "Yorkshire Water supplies Bradford from Pennine moorland reservoirs including Grimwith, Chelker, and Barden.",
    matches: ["Bradford"],
  },
  {
    slug: "hull",
    name: "Hull",
    region: "England",
    description:
      "Yorkshire Water supplies Hull primarily from the chalk aquifer beneath the Yorkshire Wolds.",
    matches: ["Kingston upon Hull, City of", "East Riding of Yorkshire"],
  },
  {
    slug: "blackburn",
    name: "Blackburn",
    region: "England",
    description:
      "United Utilities serves Blackburn from Pennine reservoirs including Jumbles and the Rivington group.",
    matches: ["Blackburn with Darwen"],
  },
  {
    slug: "wigan",
    name: "Wigan",
    region: "England",
    description:
      "United Utilities supplies Wigan from Lake District and Peak District sources via the integrated northwest grid.",
    matches: ["Wigan"],
  },
  {
    slug: "stockport",
    name: "Stockport",
    region: "England",
    description:
      "United Utilities serves Stockport from Peak District reservoirs including Longdendale and Kinder.",
    matches: ["Stockport"],
  },
  {
    slug: "swindon",
    name: "Swindon",
    region: "England",
    description:
      "Thames Water supplies Swindon from the River Thames and Cotswold groundwater sources.",
    matches: ["Swindon"],
  },
  {
    slug: "bournemouth",
    name: "Bournemouth",
    region: "England",
    description:
      "Bournemouth Water (part of South West Water) draws from the River Stour and Hampshire Basin aquifer.",
    matches: ["Bournemouth", "Christchurch", "Poole"],
  },
];

export function getCityBySlug(slug: string): CityInfo | undefined {
  return CITIES.find((c) => c.slug === slug);
}
