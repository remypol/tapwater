import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PostcodeSearch } from "@/components/postcode-search";
import { BreadcrumbSchema, FAQSchema } from "@/components/json-ld";

type ContaminantEntry = {
  name: string;
  description: string;
  healthEffects: string;
  sources: string;
  ukLimit: string | null;
  whoGuideline: string;
  euLimit: string;
  removal: string[];
};

const CONTAMINANTS: Record<string, ContaminantEntry> = {
  pfas: {
    name: "PFAS (Forever Chemicals)",
    description:
      "PFAS (per- and polyfluoroalkyl substances) are a large group of man-made chemicals that have been used in industry and consumer products since the 1940s. They are sometimes called 'forever chemicals' because they break down very slowly in the environment and can build up in the body over time. PFAS have been found in drinking water sources across the UK, often as a result of industrial activity, firefighting foam use, and agricultural runoff.",
    healthEffects:
      "Long-term exposure to certain PFAS compounds has been linked to a range of health concerns, including raised cholesterol, changes to immune function, thyroid disruption, reduced vaccine response in children, and a higher risk of some cancers including kidney and testicular cancer. The effects vary depending on the specific compound, the amount of exposure, and how long that exposure lasts.",
    sources:
      "PFAS reach drinking water sources mainly through industrial discharge, the use of firefighting foam at military bases and airports, leachate from landfill sites, and agricultural spreading of PFAS-contaminated sludge or pesticides. Manufacturing sites that produce non-stick coatings, water-resistant textiles, and food packaging are also significant contributors.",
    ukLimit: null,
    whoGuideline: "0.1 µg/L",
    euLimit: "0.1 µg/L (total)",
    removal: ["Reverse osmosis", "Activated carbon", "Ion exchange"],
  },
  lead: {
    name: "Lead",
    description:
      "Lead is a naturally occurring heavy metal with no safe level of exposure. In drinking water, lead contamination most commonly comes not from treatment works but from lead service pipes, lead-soldered joints, and brass fittings in older properties — particularly homes built before 1970. Water that is slightly acidic or soft is more likely to dissolve lead from pipes.",
    healthEffects:
      "Lead is harmful to the nervous system, particularly for children under six and developing babies. Even low-level exposure can affect cognitive development, reduce IQ, and cause behavioural changes in children. In adults, long-term lead exposure is linked to high blood pressure, kidney damage, cardiovascular disease, and reproductive problems. There is no known safe level of lead in the bloodstream.",
    sources:
      "The main source of lead in UK tap water is aging internal plumbing. Lead water supply pipes were commonly installed in UK homes until the 1970s, and lead solder was used in copper pipework until 1987. Properties in cities such as London, Glasgow, Edinburgh, and Birmingham are most likely to still have lead plumbing, particularly in Victorian-era housing stock.",
    ukLimit: "0.01 mg/L",
    whoGuideline: "0.01 mg/L",
    euLimit: "0.005 mg/L (from 2036)",
    removal: ["Reverse osmosis", "Distillation", "Carbon block filters"],
  },
  nitrate: {
    name: "Nitrate",
    description:
      "Nitrate is a naturally occurring compound found in soil and water. In drinking water, elevated nitrate levels are mostly caused by agricultural runoff from fertilised fields and the breakdown of organic matter. While nitrate itself is relatively low in toxicity, gut bacteria can convert it into nitrite — a more reactive compound — particularly in young infants.",
    healthEffects:
      "High nitrate levels in drinking water are most concerning for babies under three months old, where the conversion of nitrate to nitrite in the gut can interfere with the blood's ability to carry oxygen — a condition known as methaemoglobinaemia. In adults, some research has suggested a possible link between high nitrate intake and cancer risk, though the evidence is still being assessed.",
    sources:
      "The main source of nitrate in UK drinking water is farming — specifically the use of nitrogen-based fertilisers and the spreading of animal manure on fields. Nitrate leaches through soil into groundwater and rivers, which are often used as drinking water sources. Sewage and urban runoff also contribute, though usually to a lesser degree.",
    ukLimit: "50 mg/L",
    whoGuideline: "50 mg/L",
    euLimit: "50 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Distillation"],
  },
  copper: {
    name: "Copper",
    description:
      "Copper is an essential trace mineral, but excessive levels in drinking water can cause health problems. In the UK, copper contamination typically comes from copper plumbing rather than the water supply itself. Soft, acidic water is more likely to dissolve copper from pipes, particularly in new-build properties where pipes haven't yet developed a protective mineral coating.",
    healthEffects:
      "Short-term exposure to high copper levels can cause nausea, vomiting, and stomach cramps. Long-term exposure above safe limits has been linked to liver and kidney damage. People with Wilson's disease, a genetic condition affecting copper metabolism, are particularly vulnerable. Infants and young children are more sensitive to copper than adults.",
    sources:
      "The main source of copper in UK tap water is internal plumbing. Copper pipes have been standard in UK construction since the 1950s. New copper pipes are more likely to leach copper into water, especially in areas with soft or acidic water. Industrial discharge and agricultural fungicides can also contribute to copper in source water.",
    ukLimit: "2 mg/L",
    whoGuideline: "2 mg/L",
    euLimit: "2 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
  },
  chlorine: {
    name: "Chlorine",
    description:
      "Chlorine is deliberately added to UK drinking water as a disinfectant to kill harmful bacteria and viruses. It's the most common water treatment chemical in the world and has been responsible for virtually eliminating waterborne diseases like cholera and typhoid in developed countries. The amount used in UK water is carefully controlled by water companies and regulated by the DWI.",
    healthEffects:
      "At the levels used in UK drinking water (typically 0.2-0.5 mg/L), chlorine is not harmful to health. However, chlorine reacts with organic matter in water to form disinfection byproducts (DBPs), including trihalomethanes, which are linked to health risks at elevated levels. Some people find the taste and smell of chlorinated water unpleasant.",
    sources:
      "Chlorine is added at water treatment works as the final step before distribution. UK water companies use either free chlorine or chloramine (combined chlorine) to maintain disinfection throughout the pipe network. The level is highest at the treatment works and decreases as water travels through the distribution system.",
    ukLimit: "5 mg/L (residual)",
    whoGuideline: "5 mg/L",
    euLimit: "No specific limit",
    removal: ["Activated carbon", "Carbon block filters", "Reverse osmosis"],
  },
  fluoride: {
    name: "Fluoride",
    description:
      "Fluoride occurs naturally in some UK water sources and is also deliberately added to water supplies in some areas to help prevent tooth decay. Around 10% of the English population receives fluoridated water — mainly in the West Midlands, the North East, and parts of the East Midlands. The practice remains controversial, with debates about public consent and potential health effects at higher concentrations.",
    healthEffects:
      "At levels of 0.7-1.0 mg/L, fluoride helps prevent tooth decay, particularly in children. However, excessive fluoride intake during childhood can cause dental fluorosis (white spots or streaks on teeth). At very high levels (above 4 mg/L over many years), skeletal fluorosis can occur, causing joint pain and bone damage. The balance between benefit and risk depends on the total fluoride intake from all sources.",
    sources:
      "Fluoride enters UK water from two sources: naturally dissolving from minerals in rocks (particularly in areas with granite geology), and deliberate fluoridation by water companies under direction from the Secretary of State for Health. Naturally fluoridated areas include parts of Hartlepool, and deliberately fluoridated areas include Birmingham, Newcastle, and parts of Nottingham.",
    ukLimit: "1.5 mg/L",
    whoGuideline: "1.5 mg/L",
    euLimit: "1.5 mg/L",
    removal: ["Reverse osmosis", "Activated carbon", "Distillation"],
  },
  trihalomethanes: {
    name: "Trihalomethanes (THMs)",
    description:
      "Trihalomethanes are a group of chemical compounds formed as an unintended byproduct when chlorine used to disinfect water reacts with naturally occurring organic matter. The four main THMs are chloroform, bromodichloromethane, dibromochloromethane, and bromoform. THM levels tend to be higher in areas that use surface water (rivers and reservoirs) rather than groundwater, because surface water typically contains more organic matter.",
    healthEffects:
      "Long-term exposure to elevated trihalomethane levels has been associated with an increased risk of bladder cancer and potentially other cancers. Some studies have also suggested links to adverse reproductive outcomes, including miscarriage and low birth weight, though evidence is still evolving. The International Agency for Research on Cancer (IARC) classifies chloroform as 'possibly carcinogenic to humans' (Group 2B).",
    sources:
      "THMs form when chlorine reacts with humic and fulvic acids — natural organic compounds from decomposing plant material that dissolve into rivers, reservoirs, and lakes. THM levels are typically higher in summer (more organic matter, higher temperatures increase reaction rates) and in water systems that rely heavily on surface water sources.",
    ukLimit: "0.1 mg/L (total THMs)",
    whoGuideline: "Varies by compound",
    euLimit: "0.1 mg/L (total)",
    removal: ["Activated carbon", "Reverse osmosis", "Carbon block filters"],
  },
  ecoli: {
    name: "E. coli",
    description:
      "Escherichia coli (E. coli) is a bacterium that normally lives in the intestines of humans and animals. Its presence in drinking water is a critical indicator of faecal contamination — meaning the water has been in contact with human or animal waste. UK drinking water regulations have a zero-tolerance policy for E. coli: any detection in treated water triggers immediate investigation and potentially a boil-water notice.",
    healthEffects:
      "While most E. coli strains are harmless, some produce toxins that can cause severe illness. E. coli O157:H7, the most dangerous strain, can cause bloody diarrhoea, kidney failure (haemolytic uraemic syndrome), and in rare cases death — particularly in children and elderly people. Any detection in treated water is treated as a serious public health event.",
    sources:
      "E. coli reaches water sources through sewage discharges, agricultural runoff carrying animal waste, and combined sewer overflows during heavy rainfall. In treated water, detection usually indicates a failure in the treatment or distribution system — such as a broken pipe, cross-contamination, or a treatment plant malfunction.",
    ukLimit: "0 per 100ml",
    whoGuideline: "0 per 100ml",
    euLimit: "0 per 100ml",
    removal: ["UV disinfection", "Reverse osmosis", "Chlorination"],
  },
  arsenic: {
    name: "Arsenic",
    description:
      "Arsenic is a naturally occurring metalloid found in groundwater, particularly in areas with certain geological formations. In the UK, arsenic is most commonly detected at elevated levels in parts of Cornwall, Devon, and other regions with mineralised bedrock. It can also enter water sources through historical mining activity and industrial contamination.",
    healthEffects:
      "Arsenic is classified as a Group 1 carcinogen by the International Agency for Research on Cancer (IARC). Chronic exposure through drinking water is linked to cancers of the skin, bladder, lungs, and kidneys. Long-term ingestion at levels above the regulatory limit can also cause skin lesions, cardiovascular disease, diabetes, and neurological effects. Children and pregnant women are particularly vulnerable.",
    sources:
      "In the UK, the primary source of arsenic in drinking water is natural dissolution from underground rock formations, especially in the south-west of England where mineralised geology is common. Legacy mining operations in Cornwall and Devon have also contributed to elevated arsenic levels in some groundwater sources. Industrial activities, wood preservation using chromated copper arsenate, and agricultural pesticide residues are additional but less common sources.",
    ukLimit: "0.01 mg/L",
    whoGuideline: "0.01 mg/L",
    euLimit: "0.01 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
  },
  manganese: {
    name: "Manganese",
    description:
      "Manganese is a naturally occurring metal found in rocks, soil, and groundwater. It is one of the most common causes of discoloured water in the UK, producing brown or black deposits that can stain laundry and plumbing fixtures. While manganese is an essential nutrient in small amounts, elevated levels in drinking water raise health concerns — particularly for infants and young children.",
    healthEffects:
      "At elevated levels, manganese can affect the developing nervous system. Studies have linked high manganese exposure in drinking water to reduced cognitive function, learning difficulties, and behavioural problems in children. In adults, chronic overexposure can cause manganism — a condition with symptoms resembling Parkinson's disease, including tremors, difficulty walking, and mood disturbances. The WHO lowered its guideline value in 2022 to reflect these neurological concerns.",
    sources:
      "Manganese enters UK drinking water primarily through natural dissolution from rocks and soils into groundwater. Levels tend to be higher in groundwater sources than in surface water. Old cast iron distribution mains can also release manganese that has accumulated over decades as biofilm deposits, particularly when flow patterns change or mains are disturbed. Seasonal changes in reservoir water chemistry can mobilise manganese from sediments.",
    ukLimit: "0.05 mg/L",
    whoGuideline: "0.08 mg/L",
    euLimit: "0.05 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
  },
  iron: {
    name: "Iron",
    description:
      "Iron is the most common cause of brown or orange discoloured water in the UK. While not typically a health hazard at the levels found in drinking water, iron causes aesthetic problems including unpleasant taste, staining of laundry and sanitary ware, and sediment build-up. The UK regulatory limit is set as an aesthetic standard rather than a health-based one.",
    healthEffects:
      "Iron in drinking water is generally not considered a direct health risk at the concentrations typically found in UK supplies. The WHO has not set a health-based guideline because iron is an essential nutrient and toxicity from drinking water is extremely rare. However, very high iron levels can cause gastrointestinal discomfort, nausea, and contribute to an unpleasant metallic taste that discourages adequate water consumption. Iron deposits in pipes can also harbour bacteria.",
    sources:
      "The main source of iron in UK tap water is aging cast iron water mains, many of which were laid in the Victorian era. As these pipes corrode, iron oxide flakes off into the water supply — particularly after pressure changes, burst mains, or when fire hydrants are used. Natural iron in groundwater sources is another contributor, especially in areas with iron-rich geology. Internal galvanised steel plumbing in older properties can also release iron.",
    ukLimit: "0.2 mg/L",
    whoGuideline: "No health-based guideline",
    euLimit: "0.2 mg/L",
    removal: ["Activated carbon", "Reverse osmosis", "Ion exchange"],
  },
  mercury: {
    name: "Mercury",
    description:
      "Mercury is a highly toxic heavy metal that exists in several chemical forms, all of which pose health risks. In UK drinking water, mercury contamination is rare and typically found at very low levels, but the extreme toxicity of the element means that even small amounts are carefully regulated. The UK limit is among the strictest of any drinking water parameter.",
    healthEffects:
      "Mercury is a potent neurotoxin that can damage the nervous system, kidneys, and immune system. Inorganic mercury in drinking water is primarily toxic to the kidneys, where it accumulates over time. Developing foetuses and young children are most vulnerable — mercury exposure during pregnancy can impair cognitive development, language skills, and motor function. Chronic low-level exposure in adults has been linked to tremors, memory problems, and mood changes.",
    sources:
      "Mercury in UK water sources comes from both natural and industrial origins. Natural sources include weathering of mercury-containing minerals and volcanic deposits. Industrial sources include historical discharge from chemical manufacturing, chlor-alkali plants, and dental amalgam waste. Atmospheric deposition from coal-fired power stations and waste incineration can contaminate surface water catchments. Legacy contamination from industrial sites remains a concern in some areas.",
    ukLimit: "0.001 mg/L",
    whoGuideline: "0.006 mg/L",
    euLimit: "0.001 mg/L",
    removal: ["Reverse osmosis", "Distillation", "Activated carbon"],
  },
  pesticides: {
    name: "Pesticides",
    description:
      "Pesticides are a broad group of agricultural and horticultural chemicals designed to kill weeds, insects, fungi, and other pests. UK drinking water regulations set a blanket limit on individual pesticide compounds and a separate limit for total pesticides — among the strictest standards in the world. Despite this, pesticide detections remain one of the most common causes of regulatory failures by UK water companies.",
    healthEffects:
      "The health effects of pesticides vary widely depending on the specific compound, but chronic exposure through drinking water has been linked to endocrine disruption, reproductive problems, neurological effects, and increased cancer risk for some substances. Children are more vulnerable due to their lower body weight and developing organ systems. The precautionary UK limit of 0.1 µg/L per compound is set well below levels where health effects have been observed, reflecting a safety-first approach.",
    sources:
      "Pesticides reach UK drinking water sources primarily through agricultural runoff from treated fields, leaching through soil into groundwater, and spray drift. The most commonly detected pesticides in UK water include metaldehyde (used in slug pellets), clopyralid (a broadleaf herbicide), MCPA (used on grassland and cereals), and propyzamide. Seasonal patterns are common, with higher detections in autumn and winter following application and rainfall. Urban sources include weed killers used on railways, roads, and gardens.",
    ukLimit: "0.1 µg/L (individual), 0.5 µg/L (total)",
    whoGuideline: "Varies by compound",
    euLimit: "0.1 µg/L (individual), 0.5 µg/L (total)",
    removal: ["Activated carbon", "Reverse osmosis", "Carbon block filters"],
  },
  microplastics: {
    name: "Microplastics",
    description:
      "Microplastics are tiny plastic particles less than 5mm in size that have been found in drinking water sources worldwide, including UK tap water and bottled water. They are an emerging contaminant with no current UK regulatory limit. Research into their health effects is still in early stages, but the ubiquity of microplastics in the water supply has drawn growing public concern and scientific attention.",
    healthEffects:
      "The health effects of microplastics in drinking water are not yet fully understood. The WHO concluded in 2019 that microplastics in drinking water do not appear to pose a health risk at current levels, but acknowledged significant knowledge gaps. Concerns centre on the potential for microplastics to carry harmful chemicals (such as plasticisers and persistent organic pollutants) into the body, and on possible inflammatory responses to very small particles. Research is ongoing and regulatory positions may change as evidence develops.",
    sources:
      "Microplastics enter UK water sources from multiple pathways. Major sources include synthetic textile fibres released during washing, tyre wear particles washed from roads into rivers, and the breakdown of larger plastic waste in the environment. Wastewater treatment plants remove the majority of microplastics but cannot capture all particles, especially the smallest ones. Atmospheric fallout of airborne microplastics also contributes to contamination of reservoirs and catchments.",
    ukLimit: null,
    whoGuideline: "No guideline value set",
    euLimit: "Monitoring required from 2026",
    removal: ["Reverse osmosis", "Carbon block filters", "Activated carbon"],
  },
  nitrite: {
    name: "Nitrite",
    description:
      "Nitrite is a nitrogen compound that is more toxic than the more commonly discussed nitrate. It can form in water distribution systems through the microbial conversion of nitrate or ammonia, and is also found in source water affected by sewage or agricultural contamination. Nitrite is commonly detected across UK postcode areas, though usually at levels well below the regulatory limit.",
    healthEffects:
      "Nitrite poses a particular risk to infants under three months old. It reacts with haemoglobin in the blood to form methaemoglobin, which cannot carry oxygen — a condition known as methaemoglobinaemia or 'blue baby syndrome'. In severe cases this can be fatal. In adults, chronic nitrite exposure has been linked to the formation of N-nitroso compounds in the stomach, which are associated with an increased risk of gastric and oesophageal cancer. The risk is higher when nitrite is combined with dietary amines.",
    sources:
      "Nitrite in UK drinking water can form within the distribution network itself, particularly in systems that use chloramine (combined chlorine) as a disinfectant — bacteria can convert the ammonia component into nitrite through nitrification. Agricultural runoff, sewage contamination, and the breakdown of organic nitrogen in source water also contribute. Nitrite levels tend to be higher at the extremities of distribution networks where water has a longer residence time.",
    ukLimit: "0.5 mg/L",
    whoGuideline: "3 mg/L",
    euLimit: "0.5 mg/L",
    removal: ["Reverse osmosis", "Ion exchange", "Distillation"],
  },
  turbidity: {
    name: "Turbidity",
    description:
      "Turbidity is a measure of the cloudiness or haziness of water caused by suspended particles that are not visible to the naked eye individually but collectively scatter light. It is not a contaminant in itself, but rather an indicator of water quality — high turbidity suggests the possible presence of pathogens, sediment, or treatment problems. UK water companies monitor turbidity continuously at treatment works.",
    healthEffects:
      "Turbidity does not directly cause illness, but elevated levels are a serious public health concern because suspended particles can shield bacteria, viruses, and parasites like Cryptosporidium from disinfection. This means that high-turbidity water may harbour pathogens that chlorine cannot reach. Research has shown a correlation between turbidity spikes and increased rates of gastrointestinal illness in affected populations. For this reason, turbidity control is considered one of the most important barriers to waterborne disease.",
    sources:
      "Turbidity in UK water sources is caused by soil erosion and runoff (especially after heavy rainfall), algal blooms in reservoirs, disturbance of sediment in rivers and lakes, and resuspension of deposits in distribution mains. Moorland catchments in northern England and upland Wales are particularly prone to turbidity events following storms. Construction work, burst mains, and hydrant use within the distribution network can also cause localised turbidity spikes.",
    ukLimit: "4 NTU",
    whoGuideline: "1 NTU (ideally below 0.5 NTU)",
    euLimit: "1 NTU at treatment works",
    removal: ["Carbon block filters", "Reverse osmosis", "Activated carbon"],
  },
  aluminium: {
    name: "Aluminium",
    description:
      "Aluminium in UK drinking water comes primarily from aluminium sulphate, which is deliberately added during water treatment as a coagulant to remove suspended particles and organic matter. While the treatment process is designed to remove most of the added aluminium before water enters the distribution system, residual levels can remain — particularly if the coagulation process is not optimally controlled.",
    healthEffects:
      "The health effects of aluminium in drinking water have been debated for decades, with particular attention on a possible link to Alzheimer's disease. Some epidemiological studies have found an association between elevated aluminium in drinking water and increased risk of cognitive decline, though the evidence remains inconclusive and contested. Aluminium is not classified as a carcinogen. At very high levels, aluminium can cause gastrointestinal irritation, and it may accumulate in bone tissue in people with impaired kidney function.",
    sources:
      "The main source of aluminium in UK drinking water is the aluminium sulphate (alum) used as a coagulant in water treatment. When treatment works are operating correctly, most aluminium is removed along with the particles it binds to. However, operational upsets, rapid changes in raw water quality (such as after storms), and suboptimal pH control can lead to elevated residual aluminium in treated water. Natural aluminium from soil and rock dissolution also contributes to levels in raw water sources.",
    ukLimit: "0.2 mg/L",
    whoGuideline: "0.2 mg/L",
    euLimit: "0.2 mg/L",
    removal: ["Reverse osmosis", "Distillation", "Ion exchange"],
  },
  coliform: {
    name: "Coliform Bacteria",
    description:
      "Coliform bacteria are a broad group of organisms used as indicator organisms in drinking water testing. While most coliforms are not harmful themselves, their presence in treated water indicates that the disinfection or treatment process may have failed, and that disease-causing organisms could potentially be present. UK regulations require zero coliform bacteria in treated water samples.",
    healthEffects:
      "Most coliform bacteria are not pathogenic and do not cause illness directly. However, their detection in treated drinking water is treated as a serious event because it signals that the water may have been exposed to faecal contamination or that the treatment barrier has been compromised. This means that harmful organisms — including E. coli, Cryptosporidium, and viruses — could also be present. When coliforms are detected, water companies must investigate immediately and may issue precautionary boil-water notices.",
    sources:
      "Coliform bacteria are found naturally in soil, vegetation, and the intestines of warm-blooded animals. They enter water sources through agricultural runoff, sewage discharges, and surface water contamination. In treated water, coliform detection usually points to a breakdown in the treatment process, inadequate disinfection, ingress of contaminated water into the distribution network through cracked pipes, or regrowth in biofilms within the pipe system. Warm weather and stagnant water can promote bacterial growth.",
    ukLimit: "0 per 100ml",
    whoGuideline: "0 per 100ml",
    euLimit: "0 per 100ml",
    removal: ["UV disinfection", "Reverse osmosis", "Chlorination"],
  },
  cadmium: {
    name: "Cadmium",
    description:
      "Cadmium is a toxic heavy metal that accumulates in the body over time, primarily in the kidneys and liver. It is classified as a Group 1 carcinogen by the IARC. Cadmium contamination in UK drinking water is uncommon at elevated levels, but the metal's extreme toxicity and tendency to bioaccumulate mean that even low-level chronic exposure is a concern. The UK regulatory limit is set at 0.005 mg/L.",
    healthEffects:
      "Cadmium is highly toxic to the kidneys, where it accumulates over a lifetime and can cause irreversible damage to the renal tubules. Long-term exposure is associated with kidney disease, bone demineralisation (leading to osteoporosis and fractures), and increased cancer risk — particularly lung and kidney cancer. The IARC classifies cadmium as a Group 1 carcinogen (carcinogenic to humans). Even at low levels, chronic exposure can impair calcium metabolism and weaken bones, particularly in post-menopausal women.",
    sources:
      "Cadmium in UK drinking water can leach from galvanised steel pipes and fittings, cadmium-containing solders, and some older plumbing components. Industrial sources include zinc smelting, battery manufacturing, electroplating, and waste incineration, which can contaminate surface water and groundwater. Agricultural use of phosphate fertilisers (which contain trace cadmium) and sewage sludge spreading can also contribute to cadmium in source water over time.",
    ukLimit: "0.005 mg/L",
    whoGuideline: "0.003 mg/L",
    euLimit: "0.005 mg/L",
    removal: ["Reverse osmosis", "Distillation", "Ion exchange"],
  },
  chromium: {
    name: "Chromium",
    description:
      "Chromium exists in drinking water primarily in two forms: trivalent chromium (Cr-III), which is an essential nutrient, and hexavalent chromium (Cr-VI), which is carcinogenic. Current UK regulations set a limit for total chromium without distinguishing between the two forms. The EU has introduced a tighter limit of 0.025 mg/L that will take effect from 2036, reflecting growing concern about hexavalent chromium specifically.",
    healthEffects:
      "Hexavalent chromium (Cr-VI) is classified as a Group 1 carcinogen by the IARC when inhaled, and ingestion through drinking water has been linked to stomach and intestinal cancer in animal studies and some human epidemiological research. Chronic exposure to Cr-VI in drinking water may also cause liver and kidney damage, reproductive harm, and allergic skin reactions. Trivalent chromium (Cr-III) is far less toxic and is actually an essential trace nutrient involved in glucose metabolism. The challenge for regulators is that standard testing measures total chromium without distinguishing the toxic hexavalent form.",
    sources:
      "Chromium enters UK water sources from both natural and industrial origins. Natural weathering of chromium-containing rocks contributes low background levels. Industrial sources are more significant and include chrome plating facilities, leather tanning operations, textile dyeing, stainless steel manufacturing, and wood preservation using chromated copper arsenate. Legacy contamination from historical industrial sites can persist in groundwater for decades. Some older cooling water systems also used chromium-based corrosion inhibitors.",
    ukLimit: "0.05 mg/L (total chromium)",
    whoGuideline: "0.05 mg/L",
    euLimit: "0.025 mg/L (from 2036)",
    removal: ["Reverse osmosis", "Ion exchange", "Activated carbon"],
  },
};

const REMOVAL_DESCRIPTIONS: Record<string, string> = {
  "Reverse osmosis":
    "A membrane filtration process that removes up to 99% of contaminants by forcing water through a semi-permeable membrane under pressure. Highly effective but produces some wastewater.",
  "Activated carbon":
    "Porous carbon material (from charcoal or coconut shell) that adsorbs contaminants as water passes through. Best for organic compounds and some heavy metals.",
  "Ion exchange":
    "Replaces unwanted ions (such as nitrate or lead) with harmless ones using resin beads. Effective and widely used in both whole-house and point-of-use systems.",
  "Carbon block filters":
    "Dense blocks of activated carbon that physically block particles and adsorb chemicals. More effective than granular carbon for lead and other heavy metals.",
  Distillation:
    "Water is boiled and the steam condensed, leaving most contaminants behind. Highly effective but slow and energy-intensive — typically used in countertop units.",
  "UV disinfection":
    "Ultraviolet light at 254nm wavelength damages the DNA of bacteria and viruses, preventing them from reproducing. Highly effective against microorganisms without adding chemicals to the water.",
  Chlorination:
    "Adding chlorine or chloramine to water kills bacteria and viruses. The standard disinfection method used by UK water companies. Effective against E. coli and most waterborne pathogens.",
};

const CONTAMINANT_GUIDE_MAP: Record<string, { guideTitle: string; guideHref: string; categoryTitle: string; categoryHref: string }> = {
  pfas: { guideTitle: "Best water filter for PFAS removal", guideHref: "/guides/best-water-filter-pfas/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  lead: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Under-sink filters", categoryHref: "/filters/under-sink-filters" },
  fluoride: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  nitrate: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  chlorine: { guideTitle: "Best shower filter UK", guideHref: "/guides/best-shower-filter-uk/", categoryTitle: "Jug filters", categoryHref: "/filters/water-filter-jugs" },
  copper: { guideTitle: "Best water filters UK", guideHref: "/guides/best-water-filters-uk/", categoryTitle: "Under-sink filters", categoryHref: "/filters/under-sink-filters" },
  trihalomethanes: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  ecoli: { guideTitle: "Best water testing kit UK", guideHref: "/guides/best-water-testing-kit-uk/", categoryTitle: "Water testing kits", categoryHref: "/filters/water-testing-kits" },
  arsenic: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  manganese: { guideTitle: "Best whole house water filter UK", guideHref: "/guides/best-whole-house-water-filter-uk/", categoryTitle: "Whole-house filters", categoryHref: "/filters/whole-house-filters" },
  iron: { guideTitle: "Best whole house water filter UK", guideHref: "/guides/best-whole-house-water-filter-uk/", categoryTitle: "Whole-house filters", categoryHref: "/filters/whole-house-filters" },
  mercury: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  pesticides: { guideTitle: "Best water filters UK", guideHref: "/guides/best-water-filters-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  microplastics: { guideTitle: "Best water filters UK", guideHref: "/guides/best-water-filters-uk/", categoryTitle: "Under-sink filters", categoryHref: "/filters/under-sink-filters" },
  nitrite: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  turbidity: { guideTitle: "Best water testing kit UK", guideHref: "/guides/best-water-testing-kit-uk/", categoryTitle: "Water testing kits", categoryHref: "/filters/water-testing-kits" },
  aluminium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  coliform: { guideTitle: "Best water testing kit UK", guideHref: "/guides/best-water-testing-kit-uk/", categoryTitle: "Water testing kits", categoryHref: "/filters/water-testing-kits" },
  cadmium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
  chromium: { guideTitle: "Best reverse osmosis system UK", guideHref: "/guides/best-reverse-osmosis-system-uk/", categoryTitle: "Reverse osmosis systems", categoryHref: "/filters/reverse-osmosis-systems" },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(CONTAMINANTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contaminant = CONTAMINANTS[slug];

  if (!contaminant) {
    return { title: "Not Found" };
  }

  const description = `Learn about ${contaminant.name} in UK tap water — health effects, sources, UK and WHO legal limits, and how to remove it with the right water filter.`;

  return {
    title: `${contaminant.name} in UK Drinking Water`,
    description,
    openGraph: {
      title: `${contaminant.name} in UK Drinking Water`,
      description,
      url: `https://www.tapwater.uk/contaminant/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${contaminant.name} in UK Drinking Water`,
      description,
    },
  };
}

export default async function ContaminantPage({ params }: Props) {
  const { slug } = await params;
  const contaminant = CONTAMINANTS[slug];

  if (!contaminant) {
    notFound();
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.tapwater.uk" },
          { name: "Contaminants", url: "https://www.tapwater.uk/contaminant" },
          { name: contaminant.name, url: `https://www.tapwater.uk/contaminant/${slug}` },
        ]}
      />
      <FAQSchema
        faqs={[
          { question: `What is ${contaminant.name} and why is it in UK drinking water?`, answer: contaminant.description.slice(0, 300) },
          { question: `What are the health effects of ${contaminant.name} in drinking water?`, answer: contaminant.healthEffects.slice(0, 300) },
          { question: `What is the UK legal limit for ${contaminant.name}?`, answer: contaminant.ukLimit ? `The UK legal limit for ${contaminant.name} in drinking water is ${contaminant.ukLimit}, set under the Water Supply (Water Quality) Regulations.` : `The UK currently has no legal limit for ${contaminant.name} in drinking water, though the WHO guideline is ${contaminant.whoGuideline} and the EU standard is ${contaminant.euLimit}.` },
          { question: `How do I remove ${contaminant.name} from my tap water?`, answer: `The most effective methods to remove ${contaminant.name} from tap water are: ${contaminant.removal.join(", ")}. Check your postcode on TapWater.uk to see current levels in your area.` },
        ]}
      />
      {/* 1. Breadcrumb */}
      <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-body transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/contaminant"
              className="hover:text-body transition-colors"
            >
              Contaminants
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-body" aria-current="page">
            {contaminant.name}
          </li>
        </ol>
      </nav>

      {/* 2. H1 */}
      <h1 className="text-2xl lg:text-3xl font-bold font-display italic text-ink mb-6">
        {contaminant.name} in UK Drinking Water
      </h1>

      {/* 3. Quick facts card */}
      <div className="bg-accent-light rounded-xl p-6 mb-10">
        <h2 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">
          Quick Facts
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted mb-1">UK Legal Limit</p>
            <p className="text-base font-bold font-data text-ink">
              {contaminant.ukLimit ?? (
                <span className="text-warning">No UK limit set</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">WHO Guideline</p>
            <p className="text-base font-bold font-data text-ink">
              {contaminant.whoGuideline}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">EU Standard</p>
            <p className="text-base font-bold font-data text-ink">
              {contaminant.euLimit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Primary Sources</p>
            <p className="text-base font-semibold text-ink leading-snug">
              {slug === "pfas"
                ? "Industry, firefighting foam"
                : slug === "lead"
                  ? "Old lead pipes"
                  : slug === "ecoli"
                    ? "Sewage, animal waste"
                    : slug === "trihalomethanes"
                      ? "Chlorine + organic matter"
                      : slug === "fluoride"
                        ? "Added by water companies"
                        : slug === "chlorine"
                          ? "Added as disinfectant"
                          : slug === "copper"
                            ? "Copper plumbing"
                            : slug === "arsenic"
                              ? "Geology, mining legacy"
                              : slug === "manganese"
                                ? "Geology, old iron mains"
                                : slug === "iron"
                                  ? "Old cast iron mains"
                                  : slug === "mercury"
                                    ? "Industry, atmospheric deposits"
                                    : slug === "pesticides"
                                      ? "Agricultural chemicals"
                                      : slug === "microplastics"
                                        ? "Textiles, tyre wear, plastics"
                                        : slug === "nitrite"
                                          ? "Distribution pipes, agriculture"
                                          : slug === "turbidity"
                                            ? "Runoff, sediment disturbance"
                                            : slug === "aluminium"
                                              ? "Water treatment process"
                                              : slug === "coliform"
                                                ? "Soil, sewage, pipe ingress"
                                                : slug === "cadmium"
                                                  ? "Galvanised pipes, industry"
                                                  : slug === "chromium"
                                                    ? "Chrome plating, tanning"
                                                    : "Agricultural runoff"}
            </p>
          </div>
        </div>
      </div>

      {/* GEO: Key takeaway for AI citation */}
      <div className="card p-5 border-l-4 border-l-accent mb-10">
        <p className="text-base text-body leading-relaxed">
          <strong className="text-ink">
            {contaminant.ukLimit
              ? `${contaminant.name} in UK drinking water is regulated at ${contaminant.ukLimit}.`
              : `The UK has no legal limit for ${contaminant.name} in drinking water.`}
          </strong>{" "}
          {contaminant.ukLimit
            ? `The WHO guideline is ${contaminant.whoGuideline} and the EU standard is ${contaminant.euLimit}. `
            : `The WHO recommends a guideline of ${contaminant.whoGuideline} and the EU has set a standard of ${contaminant.euLimit}. `}
          {slug === "pfas"
            ? "PFAS are man-made chemicals that persist in the environment and the human body. The UK government published a PFAS Action Plan in February 2026 but has not yet set binding limits."
            : slug === "lead"
              ? "Lead contamination in UK tap water comes primarily from lead pipes in homes built before 1970, not from the water supply itself."
              : slug === "ecoli"
                ? "UK regulations require zero E. coli in treated drinking water. Any detection triggers immediate investigation by the water company and the Drinking Water Inspectorate."
                : slug === "trihalomethanes"
                  ? "THMs form when chlorine used to disinfect water reacts with organic matter. Levels are typically higher in summer and in areas using surface water sources."
                  : slug === "fluoride"
                    ? "About 10% of the English population receives deliberately fluoridated water, primarily in the West Midlands and North East."
                    : slug === "chlorine"
                      ? "Chlorine is deliberately added to UK tap water as a disinfectant. At the levels used (typically 0.2-0.5 mg/L), it is not harmful to health."
                      : slug === "arsenic"
                        ? "Arsenic occurs naturally in groundwater in parts of Cornwall and Devon. It is classified as a Group 1 carcinogen with no safe level of long-term exposure."
                        : slug === "manganese"
                          ? "Manganese is a common cause of brown or black discoloured water in the UK. The WHO lowered its guideline in 2022 due to neurological concerns in children."
                          : slug === "iron"
                            ? "Iron is the most common cause of brown or orange water complaints in the UK, typically from aging Victorian-era cast iron mains."
                            : slug === "mercury"
                              ? "Mercury is one of the most tightly regulated metals in UK drinking water. The UK limit of 0.001 mg/L is six times stricter than the WHO guideline."
                              : slug === "pesticides"
                                ? "The UK applies a precautionary blanket limit of 0.1 µg/L for any individual pesticide. Metaldehyde and clopyralid are among the most commonly detected."
                                : slug === "microplastics"
                                  ? "Microplastics are an emerging contaminant with no UK legal limit. The EU will require monitoring from 2026, but health effects remain uncertain."
                                  : slug === "nitrite"
                                    ? "Nitrite is more toxic than nitrate and can form within distribution pipes. It poses the greatest risk to infants under three months old."
                                    : slug === "turbidity"
                                      ? "Turbidity is not harmful itself but can shield bacteria from disinfection. The WHO recommends levels below 0.5 NTU for effective chlorination."
                                      : slug === "aluminium"
                                        ? "Most aluminium in UK tap water comes from aluminium sulphate added during treatment. A debated link to Alzheimer's disease remains inconclusive."
                                        : slug === "coliform"
                                          ? "UK regulations require zero coliform bacteria in treated water. Detection indicates possible treatment failure and triggers immediate investigation."
                                          : slug === "cadmium"
                                            ? "Cadmium is a Group 1 carcinogen that accumulates in the kidneys over a lifetime. It can leach from galvanised pipes and industrial sources."
                                            : slug === "chromium"
                                              ? "Hexavalent chromium is carcinogenic. The EU will tighten its standard to 0.025 mg/L from 2036 — half the current UK limit."
                                              : `Enter your postcode on TapWater.uk to check ${contaminant.name} levels in your area.`}
        </p>
      </div>

      {/* 4. Health Effects */}
      <section className="mt-8">
        <h2 className="font-display text-xl italic text-ink mb-3">
          Health Effects
        </h2>
        <p className="text-base text-body leading-relaxed">
          {contaminant.healthEffects}
        </p>
      </section>

      {/* 5. Where It Comes From */}
      <section className="mt-8">
        <h2 className="font-display text-xl italic text-ink mb-3">
          Where It Comes From
        </h2>
        <p className="text-base text-body leading-relaxed">
          {contaminant.sources}
        </p>
      </section>

      {/* 6. Regulatory Standards */}
      <section className="mt-8">
        <h2 className="font-display text-xl italic text-ink mb-4">
          Regulatory Standards
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left py-2 pr-6 font-semibold text-body">
                  Jurisdiction
                </th>
                <th className="text-left py-2 pr-6 font-semibold text-body">
                  Limit / Guideline
                </th>
                <th className="text-left py-2 font-semibold text-body">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              <tr>
                <td className="py-3 pr-6 text-body font-medium">
                  UK (DWI)
                </td>
                <td className="py-3 pr-6 font-data text-ink">
                  {contaminant.ukLimit ?? (
                    <span className="text-warning font-semibold">
                      No legal limit
                    </span>
                  )}
                </td>
                <td className="py-3 text-muted">
                  {contaminant.ukLimit
                    ? "Regulated under the Water Supply (Water Quality) Regulations 2016"
                    : "The UK has not yet set a statutory limit. Guidance is voluntary."}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-6 text-body font-medium">WHO</td>
                <td className="py-3 pr-6 font-data text-ink">
                  {contaminant.whoGuideline}
                </td>
                <td className="py-3 text-muted">
                  World Health Organization Guidelines for Drinking-water Quality
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-6 text-body font-medium">EU</td>
                <td className="py-3 pr-6 font-data text-ink">
                  {contaminant.euLimit}
                </td>
                <td className="py-3 text-muted">
                  EU Drinking Water Directive (2020/2184). The UK no longer
                  automatically mirrors EU standards post-Brexit.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {!contaminant.ukLimit && (
          <p className="mt-4 text-sm text-muted bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            The UK currently has no statutory limit for {contaminant.name}.
            This means water companies are not legally required to monitor or
            report levels, even though both the WHO and EU have set guidelines.
            Campaigners and scientists have called on the UK government to
            introduce binding limits.
          </p>
        )}
      </section>

      {/* 7. How to Remove */}
      <section className="mt-8">
        <h2 className="font-display text-xl italic text-ink mb-4">
          How to Remove {contaminant.name}
        </h2>
        <ul className="space-y-3">
          {contaminant.removal.map((method) => (
            <li
              key={method}
              className="flex gap-3 bg-white rounded-lg border border-rule p-4"
            >
              <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <div>
                <p className="font-semibold text-ink">{method}</p>
                <p className="text-sm text-muted mt-0.5">
                  {REMOVAL_DESCRIPTIONS[method] ??
                    "An effective water treatment method for removing this contaminant."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Check Your Area */}
      <section className="mt-10 bg-wash rounded-xl border border-rule p-6">
        <h2 className="font-display text-xl italic text-ink mb-2">
          Check Your Area
        </h2>
        <p className="text-base text-body mb-4">
          Want to know the {contaminant.name} levels in your water? Enter your
          postcode to get a free report for your area.
        </p>
        <PostcodeSearch size="sm" />
      </section>

      {/* 9. Guide & filter cross-links */}
      {CONTAMINANT_GUIDE_MAP[slug] && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink italic">How to remove {contaminant.name}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href={CONTAMINANT_GUIDE_MAP[slug].guideHref} className="card p-4 group hover:border-accent/30 transition-colors">
              <p className="font-semibold text-ink text-sm group-hover:text-accent">Read our guide</p>
              <p className="text-xs text-muted mt-1">{CONTAMINANT_GUIDE_MAP[slug].guideTitle}</p>
            </Link>
            <Link href={CONTAMINANT_GUIDE_MAP[slug].categoryHref} className="card p-4 group hover:border-accent/30 transition-colors">
              <p className="font-semibold text-ink text-sm group-hover:text-accent">Browse filters</p>
              <p className="text-xs text-muted mt-1">{CONTAMINANT_GUIDE_MAP[slug].categoryTitle}</p>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
