/**
 * Simplified UK region boundaries for SVG choropleth map.
 * ViewBox: 0 0 500 700 — represents Great Britain from Cornwall to northern Scotland.
 * Paths are simplified but geographically recognisable outlines.
 */

export interface UKRegion {
  id: string;
  name: string;
  path: string;
}

export const UK_REGIONS: UKRegion[] = [
  {
    id: "scotland",
    name: "Scotland",
    path: "M200 10 L215 5 L240 12 L265 8 L290 20 L310 15 L340 30 L355 25 L370 40 L360 55 L375 70 L365 85 L380 95 L370 110 L355 105 L340 120 L350 135 L340 150 L355 160 L345 175 L330 170 L315 185 L300 178 L285 190 L275 185 L260 195 L250 190 L240 200 L260 210 L275 205 L290 215 L305 210 L315 220 L330 215 L340 225 L350 240 L340 250 L320 245 L305 255 L290 250 L275 260 L260 255 L245 265 L230 260 L215 270 L200 265 L185 275 L170 268 L155 278 L140 270 L125 275 L115 265 L105 270 L100 258 L110 245 L100 235 L115 225 L110 210 L125 200 L120 190 L135 180 L130 168 L140 155 L155 160 L165 148 L155 135 L168 125 L160 112 L148 120 L135 110 L145 95 L130 85 L140 70 L128 58 L142 45 L155 50 L168 38 L180 45 L192 30 L200 10 Z",
  },
  {
    id: "north-east",
    name: "North East",
    path: "M305 255 L320 245 L340 250 L350 260 L355 275 L350 290 L340 305 L330 315 L315 320 L300 315 L290 305 L285 290 L280 275 L275 260 L290 250 L305 255 Z",
  },
  {
    id: "north-west",
    name: "North West",
    path: "M185 275 L200 265 L215 270 L230 260 L245 265 L260 255 L275 260 L280 275 L285 290 L290 305 L280 320 L270 335 L260 350 L245 355 L230 350 L218 358 L205 350 L190 355 L178 345 L170 330 L175 315 L168 300 L178 288 L185 275 Z",
  },
  {
    id: "yorkshire",
    name: "Yorkshire and the Humber",
    path: "M280 275 L285 290 L290 305 L300 315 L315 320 L330 315 L340 325 L345 340 L340 355 L330 365 L315 370 L300 365 L285 370 L270 365 L260 350 L270 335 L280 320 L290 305 L280 275 Z",
  },
  {
    id: "east-midlands",
    name: "East Midlands",
    path: "M260 350 L270 365 L285 370 L300 365 L315 370 L330 365 L340 375 L345 390 L340 405 L330 415 L315 420 L300 425 L285 420 L270 415 L258 405 L250 390 L248 375 L252 360 L260 350 Z",
  },
  {
    id: "west-midlands",
    name: "West Midlands",
    path: "M205 350 L218 358 L230 350 L245 355 L260 350 L252 360 L248 375 L250 390 L258 405 L250 415 L238 420 L225 425 L210 420 L198 412 L188 400 L185 385 L190 370 L198 358 L205 350 Z",
  },
  {
    id: "wales",
    name: "Wales",
    path: "M105 335 L120 325 L135 320 L150 325 L165 318 L175 315 L170 330 L178 345 L190 355 L198 358 L190 370 L185 385 L188 400 L180 415 L168 425 L155 435 L140 440 L125 435 L112 440 L100 432 L90 420 L85 405 L90 390 L85 375 L92 360 L100 345 L105 335 Z",
  },
  {
    id: "east",
    name: "East of England",
    path: "M315 370 L330 365 L340 375 L345 390 L340 405 L345 415 L355 420 L365 430 L370 445 L365 460 L355 470 L340 475 L325 480 L310 475 L300 465 L295 450 L300 435 L300 425 L315 420 L315 370 Z",
  },
  {
    id: "south-east",
    name: "South East",
    path: "M238 420 L250 415 L258 405 L270 415 L285 420 L300 425 L300 435 L295 450 L300 465 L310 475 L325 480 L340 475 L355 470 L365 485 L360 500 L350 510 L335 518 L320 522 L305 518 L295 525 L280 520 L268 528 L255 522 L245 530 L230 525 L218 518 L225 505 L220 490 L225 475 L220 460 L225 445 L230 432 L238 420 Z",
  },
  {
    id: "london",
    name: "London",
    path: "M270 460 L280 455 L292 458 L300 465 L295 475 L285 480 L275 478 L265 475 L260 468 L270 460 Z",
  },
  {
    id: "south-west",
    name: "South West",
    path: "M155 435 L168 425 L180 415 L188 400 L198 412 L210 420 L225 425 L238 420 L230 432 L225 445 L220 460 L225 475 L220 490 L225 505 L218 518 L205 525 L190 530 L175 540 L160 548 L145 555 L130 560 L115 558 L100 550 L88 540 L80 525 L75 510 L80 495 L88 480 L95 465 L105 452 L115 445 L130 442 L140 440 L155 435 Z",
  },
];

/**
 * Maps UK postcode prefixes to region IDs.
 * Covers major postcode areas — not exhaustive but sufficient for the ~220 postcodes in seed data.
 */
export const POSTCODE_TO_REGION: Record<string, string> = {
  // London
  SW: "london",
  SE: "london",
  E: "london",
  EC: "london",
  N: "london",
  NW: "london",
  W: "london",
  WC: "london",
  // North West
  M: "north-west",
  L: "north-west",
  WA: "north-west",
  WN: "north-west",
  BL: "north-west",
  OL: "north-west",
  SK: "north-west",
  PR: "north-west",
  FY: "north-west",
  BB: "north-west",
  LA: "north-west",
  CA: "north-west",
  CW: "north-west",
  CH: "north-west",
  // Yorkshire
  LS: "yorkshire",
  S: "yorkshire",
  YO: "yorkshire",
  BD: "yorkshire",
  HX: "yorkshire",
  HD: "yorkshire",
  WF: "yorkshire",
  HU: "yorkshire",
  DN: "yorkshire",
  HG: "yorkshire",
  DL: "yorkshire",
  // West Midlands
  B: "west-midlands",
  CV: "west-midlands",
  WS: "west-midlands",
  WV: "west-midlands",
  DY: "west-midlands",
  ST: "west-midlands",
  TF: "west-midlands",
  // East Midlands
  NG: "east-midlands",
  DE: "east-midlands",
  LE: "east-midlands",
  LN: "east-midlands",
  NN: "east-midlands",
  // South West
  BS: "south-west",
  BA: "south-west",
  EX: "south-west",
  PL: "south-west",
  TA: "south-west",
  DT: "south-west",
  SP: "south-west",
  SN: "south-west",
  GL: "south-west",
  BH: "south-west",
  TQ: "south-west",
  TR: "south-west",
  // South East
  BN: "south-east",
  SO: "south-east",
  PO: "south-east",
  RG: "south-east",
  OX: "south-east",
  GU: "south-east",
  RH: "south-east",
  TN: "south-east",
  CT: "south-east",
  ME: "south-east",
  DA: "south-east",
  HP: "south-east",
  SL: "south-east",
  MK: "south-east",
  KT: "south-east",
  CR: "south-east",
  SM: "south-east",
  BR: "south-east",
  RM: "south-east",
  IG: "south-east",
  EN: "south-east",
  HA: "south-east",
  UB: "south-east",
  TW: "south-east",
  // East of England
  CB: "east",
  NR: "east",
  IP: "east",
  CO: "east",
  CM: "east",
  SS: "east",
  SG: "east",
  AL: "east",
  LU: "east",
  PE: "east",
  // North East
  NE: "north-east",
  SR: "north-east",
  DH: "north-east",
  TS: "north-east",
  // Wales
  CF: "wales",
  SA: "wales",
  LL: "wales",
  SY: "wales",
  LD: "wales",
  NP: "wales",
  // Scotland
  EH: "scotland",
  G: "scotland",
  AB: "scotland",
  DD: "scotland",
  FK: "scotland",
  KY: "scotland",
  PH: "scotland",
  IV: "scotland",
  PA: "scotland",
  KA: "scotland",
  ML: "scotland",
  TD: "scotland",
  DG: "scotland",
};
