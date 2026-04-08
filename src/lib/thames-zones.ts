/**
 * Thames Water zone-to-postcode mapping.
 *
 * Thames Water divides its supply area into zones with prefixes:
 * - NLE: North London East (E, N, IG, RM postcodes)
 * - NLW: North London West (W, NW, HA, TW, UB postcodes)
 * - SLE: South London East (SE, BR, DA postcodes)
 * - SLW: South London West (SW, CR, KT inner, SM postcodes)
 * - OX: Oxford / Cotswolds
 * - R: Reading / Thames Valley (RG, SL, HP, LU, SG, AL, WD, EN, SN, SP, BA)
 * - G: Guildford / Surrey (GU, RH, KT outer, TN)
 */

export const THAMES_ZONE_POSTCODES: Record<string, string[]> = {
  // ── North London East ──
  NLE: [
    "E1","E2","E3","E5","E6","E7","E8","E9","E10","E11","E12","E13","E14","E15","E16","E17","E18","E20",
    "N1","N4","N5","N7","N8","N10","N15","N16","N17","N19",
    "IG1","IG2","IG3","IG4","IG5","IG6","IG11",
    "RM1","RM2","RM3","RM4","RM5","RM6","RM7","RM8","RM9","RM10","RM11","RM12","RM13","RM14","RM15",
    "CM13","CM14",
  ],
  // ── North London West ──
  NLW: [
    "W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13","W14",
    "NW1","NW2","NW3","NW4","NW5","NW6","NW7","NW8","NW9","NW10","NW11",
    "HA0","HA1","HA2","HA3","HA4","HA5","HA6","HA7","HA8","HA9",
    "TW1","TW2","TW3","TW4","TW5","TW7","TW8","TW9","TW11","TW12","TW13","TW14",
    "UB1","UB2","UB3","UB4","UB5","UB6","UB7","UB8","UB9","UB10","UB11","UB18",
  ],
  // ── South London East ──
  SLE: [
    "SE1","SE2","SE3","SE4","SE5","SE6","SE7","SE8","SE9","SE10","SE11","SE12","SE13","SE14","SE15","SE16","SE17","SE18","SE19","SE20","SE21","SE22","SE23","SE24","SE25","SE26","SE27","SE28",
    "BR1","BR2","BR3","BR4","BR5","BR6","BR7","BR8",
    "DA1","DA2","DA5","DA6","DA7","DA8","DA9","DA10","DA14","DA15","DA16","DA17","DA18",
    "TN14","TN16",
  ],
  // ── South London West ──
  SLW: [
    "SW1A","SW1E","SW1H","SW1P","SW1V","SW1W","SW1X","SW1Y","SW2","SW3","SW4","SW5","SW6","SW7","SW8","SW9","SW10","SW11","SW12","SW13","SW14","SW15","SW16","SW17","SW18","SW19","SW20",
    "CR0","CR2","CR3","CR4","CR5","CR6","CR7","CR8","CR9",
    "KT1","KT2","KT3","KT4","KT5","KT6","KT7","KT8","KT9",
    "SM1","SM2","SM3","SM4","SM5","SM6","SM7",
  ],
  // ── Oxford / Cotswolds ──
  OX: [
    "OX1","OX2","OX3","OX4","OX5","OX7","OX9","OX10","OX11","OX12","OX13","OX14","OX15","OX16","OX17","OX18",
    "OX25","OX26","OX27","OX28","OX29","OX33","OX39","OX44","OX49",
    "GL7","GL8","GL9",
  ],
  // ── Reading / Thames Valley ──
  R: [
    "RG1","RG2","RG4","RG5","RG6","RG8","RG9","RG10","RG12","RG14","RG17","RG18","RG19","RG20","RG26","RG30","RG31","RG40","RG41","RG42","RG45",
    "SL0","SL1","SL2","SL3","SL4","SL5","SL6","SL7","SL8","SL9",
    "HP1","HP2","HP3","HP4","HP5","HP8","HP14","HP18","HP23",
    "AL1","AL2","AL3","AL4","AL5","AL7","AL8","AL10",
    "WD3","WD4","WD5","WD6","WD7","WD17","WD18","WD19","WD23","WD24","WD25",
    "EN1","EN2","EN3","EN4","EN5","EN6","EN7","EN8","EN9","EN10","EN11",
    "N2","N3","N6","N9","N11","N12","N13","N14","N18","N20","N21","N22",
    "LU1","LU2","LU3","LU4","LU5","LU6","LU7",
    "SG6","SG7","SG8","SG13","SG15","SG16","SG17","SG18",
    "MK18",
    "TW6","TW10","TW15","TW16","TW17","TW18","TW19","TW20",
    "SN1","SN2","SN3","SN4","SN5","SN6","SN7","SN8","SN9","SN10","SN11","SN12","SN13","SN14","SN15","SN16","SN25","SN26",
    "SP1","SP2","SP3","SP4","SP5","SP6","SP7","SP9","SP11",
    "BA2","BA11","BA12","BA13","BA14","BA15",
    "SO51",
    "HP11","HP12","HP13","HP15","HP16","HP17","HP19","HP20","HP21","HP22","HP27",
  ],
  // ── Guildford / Surrey ──
  G: [
    "GU1","GU2","GU3","GU4","GU5","GU6","GU7","GU8","GU9","GU12","GU15","GU16","GU18","GU19","GU20","GU21","GU22","GU23","GU24","GU25","GU26","GU27","GU47",
    "RH1","RH2","RH3","RH4","RH5","RH6","RH7","RH8","RH9","RH10","RH12","RH14",
    "KT10","KT11","KT12","KT13","KT14","KT15","KT16","KT17","KT18","KT19","KT20","KT21","KT22","KT23","KT24",
  ],
};

/**
 * Look up which Thames zone prefix a postcode district belongs to.
 * Returns null if the postcode is not in a Thames Water zone.
 */
export function getThamesZonePrefix(district: string): string | null {
  for (const [prefix, postcodes] of Object.entries(THAMES_ZONE_POSTCODES)) {
    if (postcodes.includes(district)) return prefix;
  }
  return null;
}

/**
 * Check if a postcode district is served by Thames Water zones.
 */
export function isThamesPostcode(district: string): boolean {
  return getThamesZonePrefix(district) !== null;
}
