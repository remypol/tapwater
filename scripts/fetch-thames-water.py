#!/usr/bin/env python3
"""
Thames Water Zone PDF Fetcher & Parser

Downloads water quality zone PDFs from Thames Water's public API
and extracts parameter data into JSON format for import into Supabase.

Usage:
  python3 scripts/fetch-thames-water.py [--zones ZONE_FILE] [--output OUTPUT_DIR]

The zone PDF endpoint requires NO authentication:
  GET https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api/Zone/{mapCode}
"""

import json
import os
import re
import sys
import time
import urllib.request

try:
    import pdfplumber
except ImportError:
    print("Install pdfplumber: pip3 install pdfplumber")
    sys.exit(1)

API_BASE = "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "thames-water")
ZONES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "thames-water-zones.json")


def download_zone_pdf(map_code: str, output_dir: str) :
    """Download a zone PDF. Returns file path or None on failure."""
    url = f"{API_BASE}/Zone/{map_code}"
    path = os.path.join(output_dir, f"{map_code}.pdf")

    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path  # Already downloaded

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "application/pdf,*/*",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status != 200:
                return None
            with open(path, "wb") as f:
                f.write(resp.read())
        return path
    except Exception as e:
        print(f"  Failed to download {map_code}: {e}")
        return None


def parse_zone_pdf(pdf_path: str) :
    """Parse a Thames Water zone PDF and extract parameter data."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            zone_info = {}
            all_parameters = []

            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 3:
                        continue

                    # Check if this looks like a parameter table
                    header_row = None
                    for i, row in enumerate(table):
                        row_str = " ".join(str(c or "") for c in row).lower()
                        if "parameter" in row_str and "units" in row_str:
                            header_row = i
                            break

                    if header_row is None:
                        # Check for zone info header
                        for row in table[:3]:
                            row_str = " ".join(str(c or "") for c in row)
                            if "Water Supply Zone:" in row_str:
                                zone_match = re.search(r"Water Supply Zone:\s*(\d+)", row_str)
                                name_parts = [c for c in row if c and "Water Supply" not in str(c) and "Population" not in str(c)]
                                pop_match = re.search(r"Population:\s*([\d,]+)", row_str)
                                if zone_match:
                                    zone_info["zone_code"] = zone_match.group(1)
                                if name_parts:
                                    zone_info["zone_name"] = str(name_parts[0]).strip() if len(name_parts) > 0 else ""
                                if pop_match:
                                    zone_info["population"] = int(pop_match.group(1).replace(",", ""))
                            if "Time Period:" in row_str:
                                zone_info["time_period"] = row_str.strip()
                        continue

                    # Parse parameter rows
                    for row in table[header_row + 1:]:
                        if not row or len(row) < 6:
                            continue

                        param_name = str(row[0] or "").strip()
                        if not param_name or param_name.lower() in ("parameter", ""):
                            continue

                        unit = str(row[1] or "").strip()
                        reg_limit = str(row[2] or "").strip()
                        min_val = str(row[3] or "").strip()
                        mean_val = str(row[4] or "").strip()
                        max_val = str(row[5] or "").strip()
                        total_samples = str(row[6] or "").strip() if len(row) > 6 else ""
                        contraventions = str(row[7] or "").strip() if len(row) > 7 else ""

                        # Parse numeric values (handle <X notation)
                        def parse_num(s):
                            if not s or s in ("-", "n/a", ""):
                                return None
                            s = s.replace(",", "")
                            below_limit = s.startswith("<")
                            s = s.lstrip("<>")
                            try:
                                return {"value": float(s), "below_limit": below_limit}
                            except ValueError:
                                return None

                        all_parameters.append({
                            "parameter": param_name,
                            "unit": unit,
                            "regulatory_limit": reg_limit if reg_limit != "-" else None,
                            "min": parse_num(min_val),
                            "mean": parse_num(mean_val),
                            "max": parse_num(max_val),
                            "total_samples": int(total_samples) if total_samples.isdigit() else None,
                            "contraventions": int(contraventions) if contraventions.isdigit() else 0,
                        })

            if not all_parameters:
                return None

            return {
                **zone_info,
                "parameters": all_parameters,
                "source": "thames_water_zone_report",
                "year": 2025,
            }

    except Exception as e:
        print(f"  Parse error: {e}")
        return None


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load or discover zone codes
    if os.path.exists(ZONES_FILE):
        with open(ZONES_FILE) as f:
            zones = json.load(f)
        print(f"Loaded {len(zones)} zone codes from {ZONES_FILE}")
    else:
        print("No zones file found. Discovering zones...")
        zones = discover_zones()
        with open(ZONES_FILE, "w") as f:
            json.dump(zones, f, indent=2)
        print(f"Saved {len(zones)} zones to {ZONES_FILE}")

    # Download and parse all zone PDFs
    results = []
    for i, zone in enumerate(zones):
        code = zone if isinstance(zone, str) else zone.get("mapCode", "")
        print(f"[{i+1}/{len(zones)}] {code}...", end=" ")

        pdf_path = download_zone_pdf(code, OUTPUT_DIR)
        if not pdf_path:
            print("SKIP (download failed)")
            continue

        data = parse_zone_pdf(pdf_path)
        if not data:
            print("SKIP (parse failed)")
            continue

        data["mapCode"] = code
        results.append(data)
        param_count = len(data.get("parameters", []))
        print(f"OK ({param_count} params, {data.get('zone_name', '?')})")

        time.sleep(0.2)  # Rate limit

    # Save all results
    output_path = os.path.join(OUTPUT_DIR, "all-zones.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDone! {len(results)} zones parsed, saved to {output_path}")
    print(f"Total parameters: {sum(len(r.get('parameters', [])) for r in results)}")


def discover_zones():
    """Brute-force discover valid zone mapCodes."""
    found = []
    prefixes = ["NLW", "NLE", "NLN", "NLS", "SLW", "SLE", "SLN", "SLS", "OX", "RG", "SN", "GL", "HP", "SL", "GU", "BK", "WD", "MK"]

    for prefix in prefixes:
        for num in range(1, 50):
            code = f"{prefix}{num:02d}"
            try:
                req = urllib.request.Request(f"{API_BASE}/Zone/{code}", method="HEAD")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        found.append(code)
                        print(f"  Found: {code}")
            except:
                pass
            time.sleep(0.05)

    return found


if __name__ == "__main__":
    main()
