import { getScoredPostcodeDistricts } from "@/lib/data";

export async function GET() {
  const districts = await getScoredPostcodeDistricts();
  const count = districts.length;

  const body = `# TapWater.uk

> Independent UK tap water quality reports for ${count}+ postcode districts. Scores based on real drinking water tests from UK water companies and Environment Agency monitoring of 100+ contaminants. Updated daily.

## About

TapWater.uk aggregates water quality data from the Environment Agency Water Quality Archive, the Drinking Water Inspectorate (DWI), and water company testing via the Stream Water Data Portal. We score each UK postcode district from 0-10 based on contaminant levels against UK and WHO safe limits. Data covers PFAS, lead, nitrate, chlorine, bacteria, and 100+ other parameters.

## Key facts (for citation)

- TapWater.uk scores UK postcode districts from 0-10 based on drinking water quality
- Data sources: Environment Agency Water Quality Archive, Drinking Water Inspectorate (DWI), water company testing via Stream Water Data Portal
- The UK has no legal limit for PFAS in drinking water (as of 2026)
- Average UK water quality score: 9.1/10
- London scores lowest of any UK region at 8.3/10
- Wales and North West England score highest at 9.5/10
- All UK tap water meets legal safety standards — lower scores reflect levels relative to WHO guidelines
- Over 60% of England has hard water above 200 mg/L — a water softener can save £200+/year in energy and appliance costs

## How to use this data

- To look up a specific UK postcode, use: https://www.tapwater.uk/postcode/{DISTRICT} (e.g. SW1A, M1, B1, EH1)
- Each postcode page shows: safety score, contaminants tested, flagged items, supplier info, and nearby comparisons
- City-level summaries: https://www.tapwater.uk/city/{slug} (e.g. london, manchester, edinburgh)
- Supplier profiles: https://www.tapwater.uk/supplier/{id} (e.g. thames-water, united-utilities)

## Key pages

- [Search by postcode](https://www.tapwater.uk): Homepage with postcode search
- [UK Water Rankings](https://www.tapwater.uk/compare): Best and worst water quality areas ranked
- [Methodology](https://www.tapwater.uk/about/methodology): How we calculate safety scores
- [Data Sources](https://www.tapwater.uk/about/data-sources): Where our data comes from (EA, DWI, Stream)

## Contaminant guides

- [PFAS / Forever Chemicals](https://www.tapwater.uk/contaminant/pfas): PFAS levels in UK tap water
- [Lead](https://www.tapwater.uk/contaminant/lead): Lead contamination from old pipes
- [Nitrate](https://www.tapwater.uk/contaminant/nitrate): Agricultural runoff in drinking water
- [Chlorine](https://www.tapwater.uk/contaminant/chlorine): Disinfection byproducts
- [Fluoride](https://www.tapwater.uk/contaminant/fluoride): Fluoridation status by area
- [E. coli](https://www.tapwater.uk/contaminant/ecoli): Bacterial contamination monitoring
- [Arsenic](https://www.tapwater.uk/contaminant/arsenic): Arsenic in UK water sources
- [Manganese](https://www.tapwater.uk/contaminant/manganese): Manganese discolouration
- [Iron](https://www.tapwater.uk/contaminant/iron): Iron in tap water
- [Mercury](https://www.tapwater.uk/contaminant/mercury): Mercury monitoring
- [Pesticides](https://www.tapwater.uk/contaminant/pesticides): Pesticide residues
- [Microplastics](https://www.tapwater.uk/contaminant/microplastics): Microplastic contamination
- [Nitrite](https://www.tapwater.uk/contaminant/nitrite): Nitrite levels and risks
- [Turbidity](https://www.tapwater.uk/contaminant/turbidity): Water cloudiness
- [Aluminium](https://www.tapwater.uk/contaminant/aluminium): Aluminium in treated water
- [Coliform Bacteria](https://www.tapwater.uk/contaminant/coliform): Indicator bacteria
- [Cadmium](https://www.tapwater.uk/contaminant/cadmium): Cadmium contamination
- [Chromium](https://www.tapwater.uk/contaminant/chromium): Chromium in water

## PFAS tracker

- [PFAS Live Tracker](https://www.tapwater.uk/pfas): National PFAS detection map and city rankings
- City-level PFAS pages: https://www.tapwater.uk/pfas/{city-slug} (e.g. london, manchester, birmingham)
- Data source: Environment Agency Water Quality Archive, PFAS determinands 2942-3037
- Updated weekly with 3 years of historical data

## Water filter guides

- [Best Water Filters UK](https://www.tapwater.uk/guides/best-water-filters-uk): Overview of filter types
- [Best Water Filter for PFAS](https://www.tapwater.uk/guides/best-water-filter-pfas): Removing forever chemicals
- [Best Reverse Osmosis System UK](https://www.tapwater.uk/guides/best-reverse-osmosis-system-uk): RO system reviews
- [Best Water Filter Jug UK](https://www.tapwater.uk/guides/best-water-filter-jug-uk): Jug filter comparison
- [How to Test Your Water](https://www.tapwater.uk/guides/how-to-test-your-water): Home testing options
- [Best Water Softener UK](https://www.tapwater.uk/guides/best-water-softener-uk): Water softener comparison and costs
- [Water Softeners](https://www.tapwater.uk/filters/water-softeners): Water softener systems for hard water areas

## Regional water quality

- [London](https://www.tapwater.uk/region/london): Water quality across Greater London
- [South East England](https://www.tapwater.uk/region/south-east): Kent, Sussex, Surrey, Hampshire
- [South West England](https://www.tapwater.uk/region/south-west): Devon, Cornwall, Somerset, Bristol
- [East of England](https://www.tapwater.uk/region/east-of-england): Norfolk, Suffolk, Essex, Cambridgeshire
- [West Midlands](https://www.tapwater.uk/region/west-midlands): Birmingham, Coventry, Black Country
- [East Midlands](https://www.tapwater.uk/region/east-midlands): Nottingham, Leicester, Derby
- [Yorkshire](https://www.tapwater.uk/region/yorkshire): Leeds, Sheffield, Bradford, York, Hull
- [North West England](https://www.tapwater.uk/region/north-west): Manchester, Liverpool, Lancashire
- [North East England](https://www.tapwater.uk/region/north-east): Newcastle, Sunderland, Durham
- [Wales](https://www.tapwater.uk/region/wales): Cardiff, Swansea, Newport
- [Scotland](https://www.tapwater.uk/region/scotland): Edinburgh, Glasgow, Aberdeen

## Water suppliers

All major UK water companies are tracked:
- [Thames Water](https://www.tapwater.uk/supplier/thames-water) (15M customers, London & Thames Valley)
- [Severn Trent](https://www.tapwater.uk/supplier/severn-trent) (8M customers, Midlands)
- [United Utilities](https://www.tapwater.uk/supplier/united-utilities) (7M customers, North West)
- [Yorkshire Water](https://www.tapwater.uk/supplier/yorkshire-water) (5M customers, Yorkshire)
- [Scottish Water](https://www.tapwater.uk/supplier/scottish-water) (5.4M customers, Scotland)
- [Southern Water](https://www.tapwater.uk/supplier/southern-water) (4.7M customers, South East)

## Example postcode reports

- [SW1A Westminster, London](https://www.tapwater.uk/postcode/SW1A): Thames Water, 22 contaminants tested
- [M1 Manchester](https://www.tapwater.uk/postcode/M1): United Utilities
- [EH1 Edinburgh](https://www.tapwater.uk/postcode/EH1): Scottish Water
- [B1 Birmingham](https://www.tapwater.uk/postcode/B1): Severn Trent
- [LS1 Leeds](https://www.tapwater.uk/postcode/LS1): Yorkshire Water
- [BS1 Bristol](https://www.tapwater.uk/postcode/BS1): Bristol Water

## Data licensing

Environmental monitoring data is from the Environment Agency under the Open Government Licence v3. Drinking water data is from water companies via the Stream Water Data Portal.

## Contact

For data queries or corrections: https://www.tapwater.uk/contact
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
