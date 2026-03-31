#!/usr/bin/env python3
"""
YouTube Video Finder for BusManiak.pl articles.
Searches YouTube Data API v3 for relevant videos and outputs the best match.

Usage:
    python find-youtube.py "query string" [--lang pl] [--max-results 5]

Output (JSON):
    {"video_id": "...", "title": "...", "channel": "...", "description": "...", "relevance_score": 0.85}
    or
    {"video_id": null, "reason": "no relevant match found"}
"""

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request

API_KEY = "AIzaSyCZACFqg96R911xpTCv5Xpi5QAD_k6WuiI"
SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Channels/terms that indicate spam or irrelevant content
BLACKLIST_TERMS = [
    "shorts", "#shorts", "tiktok", "meme", "funny", "prank",
    "unboxing", "asmr", "reaction", "gameplay"
]


def search_youtube(query: str, lang: str = "pl", max_results: int = 5) -> list:
    """Search YouTube for videos matching query."""
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "relevanceLanguage": lang,
        "videoEmbeddable": "true",
        "key": API_KEY,
    }
    url = f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(json.dumps({"video_id": None, "reason": f"API error: {e}"}))
        sys.exit(1)

    results = []
    for item in data.get("items", []):
        snippet = item["snippet"]
        title = snippet.get("title", "")
        desc = snippet.get("description", "")

        # Skip blacklisted content
        combined = (title + " " + desc).lower()
        if any(bl in combined for bl in BLACKLIST_TERMS):
            continue

        results.append({
            "video_id": item["id"]["videoId"],
            "title": title,
            "channel": snippet.get("channelTitle", ""),
            "description": desc[:200],
        })

    return results


def score_relevance(query_terms: list[str], video: dict) -> float:
    """Simple keyword overlap scoring."""
    text = (video["title"] + " " + video["description"]).lower()
    query_lower = [t.lower() for t in query_terms if len(t) > 2]
    if not query_lower:
        return 0.0
    matches = sum(1 for t in query_lower if t in text)
    return matches / len(query_lower)


def main():
    parser = argparse.ArgumentParser(description="Find YouTube videos for articles")
    parser.add_argument("query", help="Search query (e.g. article title or main keyword)")
    parser.add_argument("--lang", default="pl", help="Preferred language (default: pl)")
    parser.add_argument("--max-results", type=int, default=5, help="Max API results (default: 5)")
    parser.add_argument("--threshold", type=float, default=0.3, help="Min relevance score (default: 0.3)")
    args = parser.parse_args()

    # Search in preferred language first
    results = search_youtube(args.query, lang=args.lang, max_results=args.max_results)

    # Fallback to English if no results in preferred language
    if not results and args.lang != "en":
        results = search_youtube(args.query, lang="en", max_results=args.max_results)

    if not results:
        print(json.dumps({"video_id": None, "reason": "no results from API"}))
        return

    # Score and rank
    query_terms = re.split(r'\s+', args.query)
    for video in results:
        video["relevance_score"] = round(score_relevance(query_terms, video), 2)

    results.sort(key=lambda v: v["relevance_score"], reverse=True)
    best = results[0]

    if best["relevance_score"] < args.threshold:
        print(json.dumps({
            "video_id": None,
            "reason": f"best match score {best['relevance_score']} below threshold {args.threshold}",
            "best_candidate": best
        }))
    else:
        print(json.dumps(best))


if __name__ == "__main__":
    main()
