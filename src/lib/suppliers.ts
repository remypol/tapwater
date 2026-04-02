/**
 * Water supplier mapping for TapWater.uk
 * Maps local authority area names to water companies.
 * Shared between the data pipeline and the data layer.
 */

export interface SupplierInfo {
  name: string;
  id: string;
}

export const SUPPLIER_MAP: Record<string, SupplierInfo> = {
  Westminster: { name: "Thames Water", id: "thames-water" },
  Southwark: { name: "Thames Water", id: "thames-water" },
  Greenwich: { name: "Thames Water", id: "thames-water" },
  Hackney: { name: "Thames Water", id: "thames-water" },
  "Tower Hamlets": { name: "Thames Water", id: "thames-water" },
  Camden: { name: "Thames Water", id: "thames-water" },
  "Kensington and Chelsea": { name: "Thames Water", id: "thames-water" },
  "Hammersmith and Fulham": { name: "Thames Water", id: "thames-water" },
  Barnet: { name: "Thames Water", id: "thames-water" },
  Manchester: { name: "United Utilities", id: "united-utilities" },
  Salford: { name: "United Utilities", id: "united-utilities" },
  Liverpool: { name: "United Utilities", id: "united-utilities" },
  Birmingham: { name: "Severn Trent", id: "severn-trent" },
  Nottingham: { name: "Severn Trent", id: "severn-trent" },
  Leeds: { name: "Yorkshire Water", id: "yorkshire-water" },
  Sheffield: { name: "Yorkshire Water", id: "yorkshire-water" },
  "Bristol, City of": { name: "Bristol Water", id: "bristol-water" },
  "North Somerset": { name: "Bristol Water", id: "bristol-water" },
  "Newcastle upon Tyne": { name: "Northumbrian Water", id: "northumbrian-water" },
  Oxford: { name: "Thames Water", id: "thames-water" },
  "South Oxfordshire": { name: "Thames Water", id: "thames-water" },
  Reading: { name: "Thames Water", id: "thames-water" },
  "West Berkshire": { name: "Thames Water", id: "thames-water" },
  Wokingham: { name: "Thames Water", id: "thames-water" },
  Cambridge: { name: "Anglian Water", id: "anglian-water" },
  "South Cambridgeshire": { name: "Anglian Water", id: "anglian-water" },
  Norwich: { name: "Anglian Water", id: "anglian-water" },
  Broadland: { name: "Anglian Water", id: "anglian-water" },
  "City of Edinburgh": { name: "Scottish Water", id: "scottish-water" },
  Glasgow: { name: "Scottish Water", id: "scottish-water" },
  "Glasgow City": { name: "Scottish Water", id: "scottish-water" },
  "Aberdeen City": { name: "Scottish Water", id: "scottish-water" },
  Cardiff: { name: "Dŵr Cymru Welsh Water", id: "welsh-water" },
  Swansea: { name: "Dŵr Cymru Welsh Water", id: "welsh-water" },
  "Brighton and Hove": { name: "Southern Water", id: "southern-water" },
  Southampton: { name: "Southern Water", id: "southern-water" },
  Portsmouth: { name: "Portsmouth Water", id: "portsmouth-water" },
  Exeter: { name: "South West Water", id: "south-west-water" },
  Plymouth: { name: "South West Water", id: "south-west-water" },
  "Bath and North East Somerset": { name: "Wessex Water", id: "wessex-water" },
  Leicester: { name: "Severn Trent", id: "severn-trent" },
  Coventry: { name: "Severn Trent", id: "severn-trent" },
  Derby: { name: "Severn Trent", id: "severn-trent" },
  "Amber Valley": { name: "Severn Trent", id: "severn-trent" },
  York: { name: "Yorkshire Water", id: "yorkshire-water" },
  Broxtowe: { name: "Severn Trent", id: "severn-trent" },
};

const UNKNOWN_SUPPLIER: SupplierInfo = { name: "Unknown", id: "unknown" };

export function getSupplier(city: string): SupplierInfo {
  return SUPPLIER_MAP[city] ?? UNKNOWN_SUPPLIER;
}
