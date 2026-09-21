/**
 * Reading names as they appear in the data → /contaminant/[slug]. Lives in lib so both
 * server and client components can read it (a const exported from a client module
 * reaches server code as a reference, not a value).
 */
export const CONTAMINANT_SLUG_MAP: Record<string, string> = {
  "PFAS": "pfas", "Lead": "lead", "Nitrate": "nitrate", "Copper": "copper",
  "Chlorine": "chlorine", "Fluoride": "fluoride", "Trihalomethanes": "trihalomethanes",
  "E. coli": "ecoli", "Arsenic": "arsenic", "Manganese": "manganese",
  "Iron": "iron", "Mercury": "mercury", "Microplastics": "microplastics",
  "Nitrite": "nitrite", "Turbidity": "turbidity", "Aluminium": "aluminium",
  "Coliform Bacteria": "coliform", "Cadmium": "cadmium", "Chromium": "chromium",
  "Pesticides": "pesticides", "Total Coliforms": "coliform",
  "Coliform bacteria": "coliform",
};
