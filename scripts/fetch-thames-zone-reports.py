#!/usr/bin/env python3
"""
Fetch the Thames Water zone reports we do not hold yet.

scripts/map-thames-zones.ts asks Thames which supply zone each district is in and
writes data/thames-district-zones.json. Many of the zones it names are missing from
data/thames-water/all-zones.json, because the first search only tried two-digit
codes under 50. This downloads the missing reports, parses them with the same
parser as fetch-thames-water.py and adds them to all-zones.json.

  python3 scripts/fetch-thames-zone-reports.py           # every zone named but not held
  python3 scripts/fetch-thames-zone-reports.py SLW4 S22  # just these
  python3 scripts/fetch-thames-zone-reports.py --describe # name and year for reports on disk, no downloads
  python3 scripts/fetch-thames-zone-reports.py --refresh  # every zone on the map again (a new year's reports)

One request every four seconds, and it stops at the first 403: a faster run got
this machine blocked by Thames's firewall on 17 November 2026. Safe to re-run.
"""

import importlib.util
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
ZONES_DIR = os.path.join(ROOT, "data", "thames-water")
ALL_ZONES = os.path.join(ZONES_DIR, "all-zones.json")
DISTRICT_ZONES = os.path.join(ROOT, "data", "thames-district-zones.json")
API = "https://water-quality-api.prod.p.webapp.thameswater.co.uk/water-quality-api/Zone"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
PAUSE_SECONDS = 4

spec = importlib.util.spec_from_file_location("fetch_thames_water", os.path.join(HERE, "fetch-thames-water.py"))
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)


def download(code, refresh=False):
    """Returns the pdf path, None when Thames has no report, or raises on a block."""
    path = os.path.join(ZONES_DIR, f"{code}.pdf")
    if not refresh and os.path.exists(path) and os.path.getsize(path) > 1000:
        return path, False
    req = urllib.request.Request(f"{API}/{code}", headers={"User-Agent": UA, "Accept": "application/pdf,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise
        print(f"  {code}: HTTP {e.code}")
        return None, True
    if not body.startswith(b"%PDF"):
        print(f"  {code}: not a PDF ({len(body)} bytes)")
        return None, True
    with open(path, "wb") as f:
        f.write(body)
    return path, True


def describe(path):
    """Zone name, population and the year the report covers, from the first page.

    The third line is either "Water Supply Zone: 0239 READING CENTRAL Population: 49,721"
    or just the name ("ESHER & CHESSINGTON"). The table parser misses both.
    """
    import pdfplumber
    with pdfplumber.open(path) as pdf:
        lines = (pdf.pages[0].extract_text() or "").split("\n")
    out = {}
    for i, line in enumerate(lines[:8]):
        period = re.search(r"Time Period:.*?(\d{4})\s*$", line)
        if period:
            out["year"] = int(period.group(1))
            name = lines[i - 1].strip() if i > 0 else ""
            pop = re.search(r"Population:\s*([\d,]+)", name)
            if pop:
                out["population"] = int(pop.group(1).replace(",", ""))
            name = re.sub(r"^Water Supply Zone:\s*\d+\s*", "", name)
            name = re.sub(r"\s*Population:.*$", "", name).strip()
            if name and "Water Quality Report" not in name:
                out["zone_name"] = re.sub(r"\b(Ne|Nw|Se|Sw)\b", lambda m: m.group(1).upper(), name.title().replace("&", "and"))
            break
    return out


def main():
    with open(ALL_ZONES) as f:
        zones = json.load(f)
    if "--describe" in sys.argv:
        # Fill in name, population and year for every report already on disk. No downloads.
        for z in zones:
            path = os.path.join(ZONES_DIR, f"{z['mapCode']}.pdf")
            if os.path.exists(path):
                z.update(describe(path))
        with open(ALL_ZONES, "w") as f:
            json.dump(zones, f, indent=2)
        print(f"{sum(1 for z in zones if z.get('zone_name'))} of {len(zones)} zones named")
        return
    held = {z["mapCode"] for z in zones}
    refresh = "--refresh" in sys.argv

    wanted = [c.upper() for c in sys.argv[1:] if not c.startswith("--")]
    if not wanted:
        with open(DISTRICT_ZONES) as f:
            districts = json.load(f)
        named = {}
        for d in districts.values():
            for code, n in d["zones"].items():
                named[code] = named.get(code, 0) + n
        wanted = sorted((c for c in named if refresh or c not in held), key=lambda c: -named[c])
    print(f"{len(wanted)} zone reports to fetch")

    added = 0
    for i, code in enumerate(wanted):
        try:
            path, asked = download(code, refresh)
        except urllib.error.HTTPError:
            print("Stopped: Thames returned 403 (blocked). Wait a day and re-run.")
            break
        if path:
            data = parser.parse_zone_pdf(path)
            if data:
                data["mapCode"] = code
                data.update(describe(path))
                zones = [z for z in zones if z["mapCode"] != code] + [data]
                added += 1
                print(f"[{i + 1}/{len(wanted)}] {code}: {len(data['parameters'])} parameters")
            else:
                print(f"[{i + 1}/{len(wanted)}] {code}: could not be parsed")
        if added and added % 10 == 0:
            with open(ALL_ZONES, "w") as f:
                json.dump(zones, f, indent=2)
        if asked:
            time.sleep(PAUSE_SECONDS)

    zones.sort(key=lambda z: z["mapCode"])
    with open(ALL_ZONES, "w") as f:
        json.dump(zones, f, indent=2)
    print(f"done: {added} added, {len(zones)} zone reports held")


if __name__ == "__main__":
    main()
