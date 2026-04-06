export interface WaterProblem {
  slug: string;
  title: string;
  category: "taste" | "appearance" | "smell" | "pressure";
  symptom: string;
  causes: string[];
  isDangerous: string;
  whatToDo: string[];
  whenToContact: string;
  relatedContaminants: string[];
}

export const WATER_PROBLEMS: WaterProblem[] = [
  {
    slug: "water-tastes-of-chlorine",
    title: "Why Does My Water Taste of Chlorine?",
    category: "taste",
    symptom: "Strong chlorine or swimming pool taste",
    causes: [
      "Water companies add chlorine to kill bacteria — it's a legal requirement.",
      "Chlorine levels are higher when the water has travelled further from the treatment works.",
      "Seasonal variations: more chlorine is added in warmer months when bacteria grow faster.",
    ],
    isDangerous: "No. Chlorine in UK tap water is well within safe limits (max 0.5 mg/L). The taste is noticeable at much lower concentrations than would cause harm.",
    whatToDo: [
      "Fill a jug and leave it in the fridge for 30 minutes — chlorine evaporates naturally.",
      "Use a filter jug with activated carbon, which removes chlorine taste and smell.",
      "Run the cold tap for 30 seconds before filling your glass.",
    ],
    whenToContact: "If the chlorine taste is suddenly much stronger than usual, or if the water has an unusual chemical taste that isn't chlorine.",
    relatedContaminants: ["Chlorine"],
  },
  {
    slug: "cloudy-tap-water",
    title: "Why Is My Tap Water Cloudy or Milky?",
    category: "appearance",
    symptom: "Water appears white, cloudy, or milky",
    causes: [
      "Air bubbles trapped in the water — the most common cause. Happens when cold water is pressurised in pipes.",
      "Recent plumbing work in your area can disturb sediment.",
      "In rare cases, very high mineral content (hard water areas).",
    ],
    isDangerous: "Almost always no. If caused by air bubbles, pour a glass and wait 30 seconds — it should clear from the bottom up. This is harmless.",
    whatToDo: [
      "Pour a glass and wait 30 seconds. If it clears from bottom to top, it's just air — completely harmless.",
      "If it doesn't clear, or has a colour tint, run the cold tap for 2 minutes.",
      "If the problem persists for more than 24 hours, contact your water supplier.",
    ],
    whenToContact: "If the cloudiness doesn't clear after 30 seconds, persists for more than a day, or has a yellow/brown tint.",
    relatedContaminants: [],
  },
  {
    slug: "brown-water-from-tap",
    title: "Why Is My Water Brown, Yellow, or Orange?",
    category: "appearance",
    symptom: "Water is discoloured brown, rusty, yellow, or orange",
    causes: [
      "Iron or manganese deposits disturbed in water mains — often after nearby maintenance work.",
      "Old iron pipes in your home corroding internally.",
      "Water main burst or change in water pressure disturbing sediment.",
    ],
    isDangerous: "Usually not dangerous to health, but don't drink discoloured water. Iron and manganese at these levels aren't toxic, but the water quality is compromised.",
    whatToDo: [
      "Don't use discoloured water for drinking or cooking.",
      "Run the cold kitchen tap slowly for 15-20 minutes. It should gradually clear.",
      "Don't use hot water — the hot water cylinder may have filled with discoloured water.",
      "Check with neighbours — if they have the same issue, it's likely a mains problem.",
    ],
    whenToContact: "Immediately if you haven't had recent plumbing work, or if it doesn't clear after 30 minutes of running the tap.",
    relatedContaminants: ["Iron", "Manganese"],
  },
  {
    slug: "metallic-taste-water",
    title: "Why Does My Water Taste Metallic?",
    category: "taste",
    symptom: "Water has a metallic, bitter, or tinny taste",
    causes: [
      "Copper or lead leaching from old household pipes, especially in pre-1970 homes.",
      "Low pH water dissolving metal from plumbing fittings.",
      "Galvanised iron pipes corroding (common in older properties).",
    ],
    isDangerous: "Potentially, if caused by lead. Copper gives a metallic taste at levels above 1 mg/L. Lead has no taste but often accompanies other metals. If your home was built before 1970, check for lead pipes.",
    whatToDo: [
      "Always run the cold tap for 30 seconds before drinking, especially first thing in the morning.",
      "Never use hot tap water for drinking or cooking — hot water dissolves more metal from pipes.",
      "Consider a water filter certified to remove heavy metals.",
      "If your home is pre-1970, check if you have lead pipes (they're dull grey and soft — a coin will scratch them).",
    ],
    whenToContact: "If the metallic taste is persistent, especially in a pre-1970 home. Ask your water company for a free lead test.",
    relatedContaminants: ["Lead", "Copper", "Iron"],
  },
  {
    slug: "water-smells-like-rotten-eggs",
    title: "Why Does My Water Smell Like Rotten Eggs?",
    category: "smell",
    symptom: "Water smells of sulphur, rotten eggs, or sewage",
    causes: [
      "Hydrogen sulphide from bacteria growing in your hot water cylinder (set below 60°C).",
      "Old or unused pipes where stagnant water allows bacteria to grow.",
      "Rarely, contamination from a nearby source.",
    ],
    isDangerous: "The smell is usually harmless but unpleasant. If it's only from the hot tap, it's almost certainly bacteria in your water heater. If from both taps, contact your supplier.",
    whatToDo: [
      "Check if it's only the hot tap — if so, your hot water cylinder temperature may be too low. Raise it to 60°C to kill bacteria.",
      "Run unused taps for 2-3 minutes to flush stagnant water.",
      "Clean your tap aerators (the mesh at the end of the spout) — bacteria can grow there.",
    ],
    whenToContact: "Immediately if the smell comes from the cold tap, or if multiple taps are affected.",
    relatedContaminants: [],
  },
  {
    slug: "low-water-pressure",
    title: "Why Is My Water Pressure Low?",
    category: "pressure",
    symptom: "Water comes out slowly or with poor pressure",
    causes: [
      "Partially closed stop valve — check your internal stopcock is fully open.",
      "Limescale buildup restricting flow in pipes (hard water areas).",
      "Burst or leaking pipe reducing pressure.",
      "Peak demand times (7-9am, 5-7pm) in areas with older infrastructure.",
      "Your water company may be doing maintenance nearby.",
    ],
    isDangerous: "Not a health risk, but can indicate plumbing issues that need attention.",
    whatToDo: [
      "Check your internal stop valve is fully open (usually under the kitchen sink).",
      "Check with neighbours — if they have low pressure too, it's a supply issue.",
      "Clean or replace tap aerators — limescale can restrict flow.",
      "In hard water areas, descale showerheads and taps regularly.",
    ],
    whenToContact: "If pressure drops suddenly, if neighbours have the same problem, or if you suspect a leak.",
    relatedContaminants: [],
  },
];

export const PROBLEM_CATEGORIES = [
  { id: "taste" as const, label: "Taste", description: "Chlorine, metallic, chemical, or unusual flavours" },
  { id: "appearance" as const, label: "Appearance", description: "Cloudy, brown, discoloured, or particles" },
  { id: "smell" as const, label: "Smell", description: "Chlorine, rotten eggs, musty, or chemical odours" },
  { id: "pressure" as const, label: "Pressure", description: "Low pressure, intermittent supply, or air in pipes" },
];
