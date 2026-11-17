#!/usr/bin/env python3
"""
Which water company supplies each postcode district in England and Wales.

Until November 2026 the supplier came from a hand-written list of council areas
(src/lib/suppliers.ts), which named the wrong company for 476 of 2,260 districts:
Woking and St Albans as Thames Water (both Affinity), Sutton as Thames (SES
Water), Eastbourne as Southern (South East Water), West Bromwich as Severn Trent
(South Staffs Water). This replaces the guess with Ofwat's own map.

Method:
  1. Ofwat's water supply areas (open data portal, Open Government Licence),
     regional companies only; the small new-build "inset" areas are left out.
  2. The ONS population-weighted centre of every 2021 census small area (LSOA).
     Each centre is placed on Ofwat's map, which gives one company per LSOA.
     South Staffs Water's area also lies inside Severn Trent's outline (Severn
     Trent takes the sewage there), so where two areas overlap the smaller wins.
  3. Our own postcode table says how many postcodes of each district fall in
     each LSOA. A district's supplier is the company with the most postcodes,
     and every company with 5% or more is kept with its share.

Checked against Thames Water's own postcode lookup (data/thames-district-zones.json):
the two agree for 408 of 417 districts, and the other nine are split close to
half and half.

Run:
  # 1. postcodes per district and LSOA, read-only, from the database
  psql "<connection>" -At -F, -c "select trim(left(postcode, length(postcode)-3)), lsoa_code, count(*) from postcode_lsoa group by 1,2" > /tmp/work/district-lsoa.csv
  # 2. build (needs: pip install shapely)
  python3 scripts/build-district-suppliers.py /tmp/work

Writes src/data/district-suppliers.json: district -> [[supplier id, percent], ...],
largest first. Districts mostly in Scotland are left out; they keep Scottish Water.
The two downloads are kept in the work folder and reused on the next run.
"""

import collections
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from shapely.geometry import Point, shape
from shapely.strtree import STRtree

OFWAT = "https://services-eu1.arcgis.com/XxS6FebPX29TRGDJ/arcgis/rest/services/WaterSupplyAreas_incNAVsv1_5/FeatureServer/0/query"
ONS_CENTRES = "https://services-eu1.arcgis.com/6BsumkdKnml1ntNV/arcgis/rest/services/2021_LSOA_Population_Weighted_Centroid/FeatureServer/0/query"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "district-suppliers.json")

# Ofwat's acronym, or acronym|area where one company holds several brands.
# Bournemouth and Hartlepool go to their parent's id because the parent's
# published samples cover them; Bristol does not appear in South West Water's.
AREA_TO_SUPPLIER = {
    "HDD": "hafren-dyfrdwy",
    "SVE": "severn-trent",
    "WSX": "wessex-water",
    "SRN": "southern-water",
    "SBB|Bristol": "bristol-water",
    "SBB": "south-west-water",
    "TMS": "thames-water",
    "NES|Suffolk": "essex-suffolk-water",
    "NES|Essex": "essex-suffolk-water",
    "NES": "northumbrian-water",
    "AFW": "affinity-water",
    "SEW": "south-east-water",
    "SSC|Cambridge": "cambridge-water",
    "SSC": "south-staffs-water",
    "YKY": "yorkshire-water",
    "PRT": "portsmouth-water",
    "UUW": "united-utilities",
    "WSH": "welsh-water",
    "ANH": "anglian-water",
    "SES": "ses-water",
}
MIN_SHARE = 0.05
# A centre this far (in degrees, about 3 km) from every area is left unplaced.
MAX_GAP = 0.03


def get_json(url, params):
    with urllib.request.urlopen(f"{url}?{urllib.parse.urlencode(params)}", timeout=120) as r:
        return json.load(r)


def supply_areas(work):
    path = os.path.join(work, "ofwat-areas.geojson")
    if not os.path.exists(path):
        data = get_json(OFWAT, {
            "where": "AreaType <> 'inset' AND AreaType NOT LIKE '%sewerage%'",
            "outFields": "AreaServed,COMPANY,Acronym,AreaType,Version",
            "outSR": 4326, "maxAllowableOffset": 0.0003, "geometryPrecision": 5, "f": "geojson",
        })
        with open(path, "w") as f:
            json.dump(data, f)
    return json.load(open(path))["features"]


def lsoa_centres(work):
    path = os.path.join(work, "lsoa-pwc.json")
    if not os.path.exists(path):
        out, offset = {}, 0
        while True:
            d = get_json(ONS_CENTRES, {"where": "1=1", "outFields": "CODE", "outSR": 4326, "f": "json",
                                       "resultOffset": offset, "resultRecordCount": 1000, "orderByFields": "OBJECTID"})
            rows = d.get("features", [])
            for row in rows:
                out[row["attributes"]["CODE"]] = [round(row["geometry"]["x"], 5), round(row["geometry"]["y"], 5)]
            offset += len(rows)
            if not rows or not d.get("exceededTransferLimit"):
                break
            time.sleep(0.3)
        with open(path, "w") as f:
            json.dump(out, f)
    return json.load(open(path))


def supplier_of(props):
    key = f"{props['Acronym']}|{props['AreaServed']}"
    return AREA_TO_SUPPLIER.get(key) or AREA_TO_SUPPLIER[props["Acronym"]]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    work = sys.argv[1]
    areas = supply_areas(work)
    geoms = [shape(a["geometry"]).buffer(0) for a in areas]
    suppliers = [supplier_of(a["properties"]) for a in areas]
    tree = STRtree(geoms)

    lsoa_supplier = {}
    for code, (x, y) in lsoa_centres(work).items():
        p = Point(x, y)
        hits = [i for i in tree.query(p) if geoms[i].contains(p)]
        if not hits:
            nearest = min(range(len(geoms)), key=lambda k: geoms[k].distance(p))
            hits = [nearest] if geoms[nearest].distance(p) < MAX_GAP else []
        if hits:
            lsoa_supplier[code] = suppliers[min(hits, key=lambda k: geoms[k].area)]
    print(f"{len(lsoa_supplier)} census areas placed on {len(areas)} supply areas")

    counts = collections.defaultdict(collections.Counter)
    totals = collections.Counter()
    for district, lsoa, n in csv.reader(open(os.path.join(work, "district-lsoa.csv"))):
        totals[district] += int(n)
        if lsoa in lsoa_supplier:
            counts[district][lsoa_supplier[lsoa]] += int(n)

    out = {}
    for district in sorted(counts):
        placed = sum(counts[district].values())
        if placed < totals[district] / 2:
            continue  # mostly Scotland
        shares = [[s, round(n / placed * 100)] for s, n in counts[district].most_common() if n / placed >= MIN_SHARE]
        out[district] = shares
    with open(OUT, "w") as f:
        f.write("{\n" + ",\n".join(f'  {json.dumps(d)}: {json.dumps(s, separators=(",", ":"))}' for d, s in out.items()) + "\n}\n")
    main_supplier = collections.Counter(s[0][0] for s in out.values())
    print(f"{len(out)} districts written to {os.path.relpath(OUT)}")
    for s, n in main_supplier.most_common():
        print(f"  {n:4d} {s}")
    print(f"  {sum(1 for s in out.values() if len(s) > 1)} districts have a second company with 5% or more")


if __name__ == "__main__":
    main()
