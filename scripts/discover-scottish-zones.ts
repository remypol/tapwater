/**
 * Discover Scottish Water zone-to-postcode mapping.
 *
 * For each of the 442 Scottish postcode districts, looks up
 * the water quality zone via Scottish Water's AJAX API.
 *
 * Usage: npx tsx scripts/discover-scottish-zones.ts
 */

import { writeFileSync, readFileSync, existsSync } from "fs";

const SCOTTISH_DISTRICTS: string[] = [
  "AB10","AB11","AB12","AB13","AB14","AB15","AB16","AB21","AB22","AB23","AB24","AB25","AB30","AB31","AB32","AB33","AB34","AB35","AB36","AB37","AB38","AB39","AB41","AB42","AB43","AB44","AB45","AB51","AB52","AB53","AB54","AB55","AB56",
  "DD1","DD2","DD3","DD4","DD5","DD6","DD7","DD8","DD9","DD10","DD11",
  "DG1","DG2","DG3","DG4","DG5","DG6","DG7","DG8","DG9","DG10","DG11","DG12","DG13","DG14",
  "EH1","EH2","EH3","EH4","EH5","EH6","EH7","EH8","EH9","EH10","EH11","EH12","EH13","EH14","EH15","EH16","EH17","EH18","EH19","EH20","EH21","EH22","EH23","EH24","EH25","EH26","EH27","EH28","EH29","EH30","EH31","EH32","EH33","EH34","EH35","EH36","EH37","EH38","EH39","EH40","EH41","EH42","EH43","EH44","EH45","EH46","EH47","EH48","EH49","EH51","EH52","EH53","EH54","EH55",
  "FK1","FK2","FK3","FK4","FK5","FK6","FK7","FK8","FK9","FK10","FK11","FK12","FK13","FK14","FK15","FK16","FK17","FK18","FK19","FK20","FK21",
  "G1","G2","G3","G4","G5","G11","G12","G13","G14","G15","G20","G21","G22","G23","G31","G32","G33","G34","G40","G41","G42","G43","G44","G45","G46","G51","G52","G53","G58","G60","G61","G62","G63","G64","G65","G66","G67","G68","G69","G70","G71","G72","G73","G74","G75","G76","G77","G78","G79","G81","G82","G83","G84",
  "HS1","HS2","HS3","HS4","HS5","HS6","HS7","HS8","HS9",
  "IV1","IV2","IV3","IV4","IV5","IV6","IV7","IV8","IV9","IV10","IV11","IV12","IV13","IV14","IV15","IV16","IV17","IV18","IV19","IV20","IV21","IV22","IV23","IV24","IV25","IV26","IV27","IV28","IV30","IV31","IV32","IV36","IV40","IV41","IV42","IV43","IV44","IV45","IV46","IV47","IV48","IV49","IV51","IV52","IV53","IV54","IV55","IV56","IV63",
  "KA1","KA2","KA3","KA4","KA5","KA6","KA7","KA8","KA9","KA10","KA11","KA12","KA13","KA14","KA15","KA16","KA17","KA18","KA19","KA20","KA21","KA22","KA23","KA24","KA25","KA26","KA27","KA28","KA29","KA30",
  "KW1","KW2","KW3","KW5","KW6","KW7","KW8","KW9","KW10","KW11","KW12","KW13","KW14","KW15","KW16","KW17",
  "KY1","KY2","KY3","KY4","KY5","KY6","KY7","KY8","KY9","KY10","KY11","KY12","KY13","KY14","KY15","KY16",
  "ML1","ML2","ML3","ML4","ML5","ML6","ML7","ML8","ML9","ML10","ML11","ML12",
  "PA1","PA2","PA3","PA4","PA5","PA6","PA7","PA8","PA9","PA10","PA11","PA12","PA13","PA14","PA15","PA16","PA17","PA18","PA19","PA20","PA21","PA22","PA23","PA24","PA25","PA26","PA27","PA28","PA29","PA30","PA31","PA32","PA33","PA34","PA35","PA36","PA37","PA38","PA41","PA42","PA43","PA44","PA45","PA46","PA47","PA48","PA49","PA60","PA61","PA62","PA63","PA64","PA65","PA66","PA67","PA68","PA69","PA70","PA71","PA72","PA73","PA74","PA75","PA76","PA77","PA78","PA80",
  "PH1","PH2","PH3","PH4","PH5","PH6","PH7","PH8","PH9","PH10","PH11","PH12","PH13","PH14","PH15","PH16","PH17","PH18","PH19","PH20","PH21","PH22","PH23","PH24","PH25","PH26","PH30","PH31","PH32","PH33","PH34","PH35","PH36","PH37","PH38","PH39","PH40","PH41","PH42","PH43","PH44","PH49","PH50",
  "TD1","TD2","TD3","TD4","TD6","TD7","TD8","TD10","TD11","TD13","TD14",
  "ZE1","ZE2","ZE3",
];

/** Generate a plausible full postcode from a district code */
function makeTestPostcodes(district: string): string[] {
  // Common second part patterns that tend to exist
  const suffixes = ["1AA", "1AB", "1AD", "1AE", "1AF", "1AG", "1AH", "1AJ",
                     "1AL", "1AN", "1AP", "1AQ", "1AR", "1AS", "1AT", "1AU",
                     "1AW", "1AX", "1AY", "1AZ", "1BA", "1BB", "1BD",
                     "1RE", "1QA", "1PA", "1NA", "2AA", "0AA"];
  return suffixes.map((s) => `${district} ${s}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  "Accept": "text/html,*/*",
  "Accept-Language": "en-GB,en;q=0.9",
  "Referer": "https://www.scottishwater.co.uk/your-home/your-water/water-quality/water-quality",
};

async function lookupZone(district: string): Promise<string | null> {
  const postcodes = makeTestPostcodes(district);

  for (const postcode of postcodes) {
    try {
      const url = `https://www.scottishwater.co.uk/api/feature/WaterQuality/Results?q=${encodeURIComponent(postcode)}`;
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Extract zone name from "Site Name:" followed by <strong>ZoneName</strong>
      const match = html.match(/<td>[\s\S]*?Site Name:[\s\S]*?<\/td>[\s\S]*?<td>[\s\S]*?<strong>\s*([^<]+?)\s*<\/strong>/);
      if (match) {
        return match[1].trim();
      }

      // Also check for the emptySummaryResult indicator
      if (html.includes("emptySummaryResult")) {
        continue; // This postcode didn't work, try next
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function main() {
  const outputPath = "data/scottish-water/zone-discovery.json";

  // Resume from existing progress if available
  let results: Record<string, string | null> = {};
  if (existsSync(outputPath)) {
    results = JSON.parse(readFileSync(outputPath, "utf-8"));
    console.log(`Resuming from ${Object.keys(results).length} existing results`);
  }

  const remaining = SCOTTISH_DISTRICTS.filter((d) => !(d in results));
  console.log(`${remaining.length} districts remaining out of ${SCOTTISH_DISTRICTS.length} total`);

  let found = 0;
  let notFound = 0;
  let i = 0;

  for (const district of remaining) {
    i++;
    const zone = await lookupZone(district);
    results[district] = zone;

    if (zone) {
      found++;
      process.stdout.write(`\r[${i}/${remaining.length}] ${district} → ${zone}                    `);
    } else {
      notFound++;
      process.stdout.write(`\r[${i}/${remaining.length}] ${district} → NOT FOUND                  `);
    }

    // Save progress every 20 districts
    if (i % 20 === 0) {
      writeFileSync(outputPath, JSON.stringify(results, null, 2));
    }

    // Rate limit - 300ms between requests to be polite
    await sleep(300);
  }

  // Final save
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n\nDone!`);
  console.log(`Found: ${found}`);
  console.log(`Not found: ${notFound}`);

  // Build zone → postcodes mapping
  const zoneToPostcodes: Record<string, string[]> = {};
  for (const [district, zone] of Object.entries(results)) {
    if (!zone) continue;
    if (!zoneToPostcodes[zone]) zoneToPostcodes[zone] = [];
    zoneToPostcodes[zone].push(district);
  }

  // Sort postcodes within each zone
  for (const zone of Object.keys(zoneToPostcodes)) {
    zoneToPostcodes[zone].sort();
  }

  writeFileSync(
    "data/scottish-water/zone-postcodes.json",
    JSON.stringify(zoneToPostcodes, null, 2),
  );

  console.log(`\nZone → postcode mapping: ${Object.keys(zoneToPostcodes).length} zones`);
  for (const [zone, pcs] of Object.entries(zoneToPostcodes).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
    console.log(`  ${zone}: ${pcs.length} postcodes`);
  }
}

main().catch(console.error);
