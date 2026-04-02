/**
 * Target postcode districts for TapWater.uk
 * Shared between the data pipeline and the build system.
 */

export const TARGET_POSTCODES = [
  // London — SW (11)
  "SW1A", "SW1V", "SW3", "SW5", "SW6", "SW7", "SW10", "SW11", "SW15", "SW18", "SW19",
  // London — SE (12)
  "SE1", "SE3", "SE5", "SE10", "SE13", "SE15", "SE16", "SE18", "SE22", "SE23", "SE25",
  // London — E (15)
  "E1", "E2", "E3", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E13", "E14", "E15", "E16", "E17",
  // London — N (14)
  "N1", "N4", "N5", "N7", "N8", "N10", "N11", "N12", "N13", "N15", "N16", "N17", "N19", "N22",
  // London — NW (9)
  "NW1", "NW2", "NW3", "NW5", "NW6", "NW8", "NW9", "NW10", "NW11",
  // London — W (13)
  "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14",
  // Manchester (10)
  "M1", "M2", "M3", "M4", "M5", "M8", "M11", "M14", "M20", "M21",
  // Birmingham (16)
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14", "B15", "B16",
  // Leeds (8)
  "LS1", "LS2", "LS3", "LS4", "LS5", "LS6", "LS7", "LS8",
  // Bristol (8)
  "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8",
  // Liverpool (8)
  "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8",
  // Sheffield (9)
  "S1", "S2", "S3", "S5", "S6", "S7", "S8", "S10", "S11",
  // Edinburgh (8)
  "EH1", "EH2", "EH3", "EH4", "EH6", "EH7", "EH8", "EH9",
  // Glasgow (8)
  "G1", "G2", "G3", "G4", "G5", "G11", "G12", "G20",
  // Cardiff (6)
  "CF5", "CF10", "CF11", "CF14", "CF23", "CF24",
  // Newcastle (6)
  "NE1", "NE2", "NE3", "NE4", "NE5", "NE6",
  // Nottingham (6)
  "NG1", "NG2", "NG3", "NG5", "NG7", "NG9",
  // Oxford (4)
  "OX1", "OX2", "OX3", "OX4",
  // Cambridge (4)
  "CB1", "CB2", "CB3", "CB4",
  // Brighton (3)
  "BN1", "BN2", "BN3",
  // Southampton (4)
  "SO14", "SO15", "SO16", "SO17",
  // Portsmouth (4)
  "PO1", "PO2", "PO4", "PO5",
  // Reading (4)
  "RG1", "RG2", "RG4", "RG6",
  // Leicester (3)
  "LE1", "LE2", "LE3",
  // Coventry (4)
  "CV1", "CV2", "CV3", "CV4",
  // York (4)
  "YO1", "YO10", "YO24", "YO31",
  // Bath (2)
  "BA1", "BA2",
  // Exeter (3)
  "EX1", "EX2", "EX4",
  // Norwich (3)
  "NR1", "NR2", "NR3",
  // Plymouth (3)
  "PL1", "PL2", "PL4",
  // Derby (3)
  "DE1", "DE21", "DE22",
  // Swansea (2)
  "SA1", "SA2",
  // Aberdeen (4)
  "AB10", "AB11", "AB24", "AB25",
] as const;

export type PostcodeDistrict = (typeof TARGET_POSTCODES)[number];
