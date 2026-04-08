#!/usr/bin/env python3
"""
Discover Thames Water zone codes for all unmapped postcode districts.

Uses the Thames Water PostCode API:
  GET https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api/PostCode/{postcode}
  Returns: {"featureCode":"58","mapCode":"NLW33","year":2025}

Strategy: For each postcode district, try "{district} 1AA" as a sample postcode.
If that fails, try other common suffixes.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

API_BASE = "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api"

# All ea-only Thames Water postcode districts (from DB query)
THAMES_EA_ONLY = [
    "AL1","AL10","AL2","AL3","AL4","AL5","AL7","AL8",
    "BA11","BA12","BA13","BA14","BA15","BA2",
    "BR4","BR8",
    "CM13","CM14",
    "CR6","CR9",
    "DA10","DA2","DA9",
    "E12",
    "EN1","EN10","EN11","EN2","EN3","EN4","EN5","EN6","EN7","EN8","EN9",
    "GL7","GL8","GL9",
    "GU1","GU12","GU15","GU16","GU18","GU19","GU2","GU20","GU21","GU22","GU23","GU24","GU25","GU26","GU27","GU3","GU4","GU47","GU5","GU6","GU7","GU8","GU9",
    "HA4","HA5","HA6","HA7","HA8",
    "HP1","HP14","HP18","HP2","HP23","HP3","HP4","HP5","HP8",
    "IG1","IG11","IG2","IG3","IG4","IG5","IG6",
    "KT10","KT11","KT12","KT13","KT14","KT15","KT16","KT17","KT18","KT19","KT20","KT21","KT22","KT23","KT24","KT9",
    "LU1","LU2","LU3","LU4","LU5","LU6","LU7",
    "MK18",
    "N11","N12","N13","N14","N18","N2","N20","N21","N22","N3","N6","N9",
    "NW4",
    "RG1","RG10","RG12","RG14","RG17","RG18","RG19","RG2","RG20","RG26","RG30","RG31","RG4","RG40","RG41","RG42","RG45","RG5","RG6","RG8","RG9",
    "RH1","RH10","RH12","RH14","RH2","RH3","RH4","RH5","RH6","RH7","RH8","RH9",
    "RM1","RM10","RM11","RM12","RM13","RM14","RM15","RM2","RM3","RM4","RM5","RM6","RM7","RM8","RM9",
    "SE11",
    "SG13","SG15","SG16","SG17","SG18","SG6","SG7","SG8",
    "SL0","SL1","SL2","SL3","SL4","SL5","SL6","SL7","SL8","SL9",
    "SM7",
    "SN1","SN10","SN11","SN12","SN13","SN14","SN15","SN16","SN2","SN25","SN26","SN3","SN4","SN5","SN6","SN7","SN8","SN9",
    "SO51",
    "SP1","SP11","SP2","SP3","SP4","SP5","SP6","SP7","SP9",
    "SW1E","SW1H","SW1P","SW1W","SW1X","SW1Y",
    "TN14","TN16",
    "TW10","TW15","TW16","TW17","TW18","TW19","TW20","TW6",
    "UB1","UB10","UB11","UB18","UB2","UB3","UB4","UB5","UB6","UB7","UB8","UB9",
    "WD17","WD18","WD19","WD23","WD24","WD25","WD3","WD4","WD5","WD6","WD7",
]

# Also check "unknown" postcodes that might be Thames Water
UNKNOWN_TO_CHECK = [
    "HP10","HP11","HP12","HP13","HP15","HP16","HP17","HP19","HP20","HP21","HP22","HP27","HP6","HP7","HP9",
    "GU10","GU11","GU14","GU17","GU30","GU31","GU32","GU33","GU34","GU35","GU46","GU51","GU52",
    "MK1","MK10","MK11","MK12","MK13","MK14","MK15","MK16","MK17","MK19","MK2","MK3","MK4","MK43","MK46","MK5","MK6","MK7","MK8","MK9",
    "GL1","GL10","GL11","GL12","GL13","GL14","GL15","GL17","GL18","GL19","GL2","GL20","GL3","GL4","GL5","GL50","GL51","GL52","GL53","GL54","GL55","GL56","GL6",
]

SUFFIXES = ["1AA", "1AB", "2AA", "3AA", "1BA", "1DA", "2AB", "4AA", "5AA"]


def lookup_postcode(district: str):
    """Try to look up a postcode district via Thames Water API."""
    for suffix in SUFFIXES:
        # Format: "E12 1AA" or "SW1E 1AA"
        postcode = f"{district} {suffix}".replace(" ", "%20")
        url = f"{API_BASE}/PostCode/{postcode}"
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "Accept": "application/json",
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read())
                    return data
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue  # Try next suffix
            elif e.code == 429:
                time.sleep(2)
                continue
        except Exception:
            continue
        time.sleep(0.05)
    return None


def main():
    all_districts = THAMES_EA_ONLY + UNKNOWN_TO_CHECK
    results = {}
    not_thames = []
    zone_codes = set()

    print(f"Looking up {len(all_districts)} postcode districts...")

    for i, district in enumerate(all_districts):
        print(f"  [{i+1}/{len(all_districts)}] {district}...", end=" ", flush=True)
        data = lookup_postcode(district)
        if data and "mapCode" in data:
            map_code = data["mapCode"]
            results[district] = map_code
            zone_codes.add(map_code)
            print(f"→ {map_code}")
        else:
            not_thames.append(district)
            print("NOT Thames Water")
        time.sleep(0.1)

    # Save results
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)

    output = {
        "postcode_to_zone": results,
        "not_thames_water": not_thames,
        "unique_zones": sorted(zone_codes),
        "stats": {
            "total_checked": len(all_districts),
            "thames_found": len(results),
            "not_thames": len(not_thames),
            "unique_zones": len(zone_codes),
        }
    }

    output_path = os.path.join(output_dir, "thames-zone-discovery.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nResults:")
    print(f"  Thames Water: {len(results)} postcodes → {len(zone_codes)} zones")
    print(f"  Not Thames: {len(not_thames)}")
    print(f"  Saved to {output_path}")

    # Show zone distribution
    zone_counts: dict[str, int] = {}
    for zone in results.values():
        prefix = zone.rstrip("0123456789")
        zone_counts[prefix] = zone_counts.get(prefix, 0) + 1
    print(f"\n  Zone prefixes: {json.dumps(zone_counts, indent=4)}")


if __name__ == "__main__":
    main()
