#!/usr/bin/env python3
"""Refresh reviews.json from Sharpline Digital's Google Business Profile.

Run daily by .github/workflows/update-reviews.yml. Uses Google's Places API (New).
Needs the GOOGLE_PLACES_API_KEY secret. Optional: PLACE_ID (skips the lookup).

Safety: if anything looks wrong (API error, wrong business, no rating), the
script stops WITHOUT touching reviews.json, so the website keeps the last good copy.
Google returns at most 5 reviews; the rating and total count are always exact.
"""
import json, os, sys, urllib.request, urllib.error

KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
PLACE_ID = os.environ.get("PLACE_ID", "").strip()
SEARCH = "Sharpline Digital, Chilliwack, BC"
NAME_MUST_CONTAIN = "sharpline"
OUT = "reviews.json"


def call(url, field_mask, body=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        method="POST" if body is not None else "GET",
        headers={"X-Goog-Api-Key": KEY, "X-Goog-FieldMask": field_mask,
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Google API error {e.code}: {e.read().decode()[:500]}")


def main():
    if not KEY:
        sys.exit("GOOGLE_PLACES_API_KEY secret is missing.")

    place_id = PLACE_ID
    if not place_id:
        # IDs-only search is free and unlimited.
        found = call("https://places.googleapis.com/v1/places:searchText",
                     "places.id", {"textQuery": SEARCH,
                                   # Sharpline has no storefront, so it is a
                                   # "service-area business" that Google hides
                                   # from search unless asked.
                                   "includePureServiceAreaBusinesses": True})
        places = found.get("places") or []
        if not places:
            sys.exit(f"No Google listing found for '{SEARCH}'.")
        place_id = places[0]["id"]
    print("Place ID:", place_id)

    d = call(f"https://places.googleapis.com/v1/places/{place_id}?languageCode=en",
             "displayName,rating,userRatingCount,reviews,googleMapsUri")

    name = (d.get("displayName") or {}).get("text", "")
    if NAME_MUST_CONTAIN not in name.lower():
        sys.exit(f"Found the wrong business ('{name}'). Set the PLACE_ID secret. Nothing changed.")
    if not d.get("rating") or not d.get("userRatingCount"):
        sys.exit("Google returned no rating. Nothing changed.")

    try:
        old = json.load(open(OUT, encoding="utf-8"))
    except Exception:
        old = {}
    # Keep the hand-entered business names (Google doesn't supply them).
    business = {r.get("author"): r.get("business", "") for r in old.get("reviews", [])}

    reviews = []
    for r in d.get("reviews", []):
        text = ((r.get("originalText") or r.get("text") or {}).get("text") or "").strip()
        if not text:
            continue  # star-only reviews have no words to show
        who = r.get("authorAttribution") or {}
        author = who.get("displayName", "Google user")
        reviews.append({
            "author": author,
            "authorUrl": who.get("uri", ""),
            "business": business.get(author, ""),
            "rating": r.get("rating", 5),
            "date": (r.get("publishTime") or "")[:10],
            "text": text,
        })
    # Google's feed lags behind brand-new reviews (often a day or more) and
    # returns at most 5. If it sends fewer than the real total, keep reviews
    # already on the site that it left out, up to the total (max 5).
    target = min(int(d["userRatingCount"]), 5)
    have = {r["author"] for r in reviews}
    for r in sorted(old.get("reviews", []), key=lambda r: r.get("date", ""), reverse=True):
        if len(reviews) >= target:
            break
        if r.get("author") not in have:
            reviews.append(r)
            have.add(r.get("author"))
    reviews.sort(key=lambda r: r["date"], reverse=True)

    new = {
        "_note": "Updated automatically every morning from Google by .github/workflows/update-reviews.yml. "
                 "Hand edits to review text will be overwritten; the 'business' field is kept.",
        "rating": round(float(d["rating"]), 1),
        "count": int(d["userRatingCount"]),
        "googleUrl": d.get("googleMapsUri") or old.get("googleUrl", ""),
        "reviews": reviews or old.get("reviews", []),
    }

    if new == old:
        print("No change.")
        return
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(new, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Updated: {new['rating']} stars, {new['count']} reviews, {len(new['reviews'])} shown.")


if __name__ == "__main__":
    main()
