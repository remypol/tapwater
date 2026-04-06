/**
 * Thames Water zone-to-postcode mapping.
 *
 * Thames Water divides its supply area into zones with prefixes:
 * - NLE: North London East (E, N postcodes)
 * - NLW: North London West (W, NW, HA, TW postcodes)
 * - SLE: South London East (SE, BR, DA postcodes)
 * - SLW: South London West (SW, CR, KT, SM postcodes)
 * - OX: Oxford / Thames Valley
 */

export const THAMES_ZONE_POSTCODES: Record<string, string[]> = {
  NLE: ["E1", "E2", "E3", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E13", "E14", "E15", "E16", "E17", "E18", "E20", "N1", "N4", "N5", "N7", "N8", "N10", "N15", "N16", "N17", "N19"],
  NLW: ["W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14", "NW1", "NW2", "NW3", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10", "NW11", "HA0", "HA1", "HA2", "HA3", "HA9", "TW1", "TW2", "TW3", "TW4", "TW5", "TW7", "TW8", "TW9", "TW11", "TW12", "TW13", "TW14"],
  SLE: ["SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "SE9", "SE10", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28", "BR1", "BR2", "BR3", "BR5", "BR6", "BR7", "DA1", "DA2", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", "DA17", "DA18"],
  SLW: ["SW1A", "SW1V", "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20", "CR0", "CR2", "CR3", "CR4", "CR5", "CR7", "CR8", "KT1", "KT2", "KT3", "KT4", "KT5", "KT6", "KT7", "KT8", "SM1", "SM2", "SM3", "SM4", "SM5", "SM6"],
  OX: ["OX1", "OX2", "OX3", "OX4", "OX5", "OX7", "OX9", "OX10", "OX11", "OX12", "OX13", "OX14", "OX15", "OX16", "OX17", "OX18", "OX25", "OX26", "OX27", "OX28", "OX29", "OX33", "OX39", "OX44", "OX49"],
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
