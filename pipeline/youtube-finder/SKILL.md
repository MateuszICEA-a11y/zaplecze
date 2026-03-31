---
name: youtube-finder
description: >
  Find and embed relevant YouTube videos in BusManiak.pl articles. Searches YouTube
  Data API v3 for thematically matching videos (Polish preferred, English fallback),
  evaluates relevance, and adds to article frontmatter + inserts shortcode before
  the last H2. Use this skill to enrich existing articles with video content.
  Triggers: "/add-youtube", "dodaj film", "znajdź film", "youtube do artykułu".
  Can run on single article or entire directory.
---

# YouTube Finder – Skill

Finds and embeds relevant YouTube videos in BusManiak.pl articles.

## How It Works

1. Read article frontmatter (title, h1, main_keyword)
2. Build search query from article metadata
3. Call YouTube Data API v3 via `find-youtube.py`
4. Evaluate relevance (LLM judgment if score is borderline)
5. If relevant match found → add to frontmatter + insert shortcode
6. If no match → skip silently (no forced embeds)

## Prerequisites

- Python 3 available in PATH
- YouTube Data API v3 key (hardcoded in `find-youtube.py`)
- API quota: 100 units per search, 10,000 units/day free tier

## Invocation

```
/add-youtube <path>
```

- `<path>` = single `.md` file OR directory (processes all `.md` files recursively)
- If no path given, ask the user

## Step-by-Step Process

### Step 1: Identify Target Articles

Read the target path. If directory, find all `.md` files recursively.
Skip articles that already have `youtube:` in frontmatter.

### Step 2: Build Search Query

For each article, read frontmatter and build query:

```
{main_keyword} {h1 fragment} recenzja test
```

**Query construction rules:**
- Use `main_keyword` as primary term
- Add 1-2 words from `h1` if different from main_keyword
- Append Polish context words: "recenzja", "test", "opinia", "przegląd"
- For service articles: append "naprawa", "serwis"
- For camper articles: append "kamper", "vanlife"
- Max query length: ~6-8 words

**Examples:**
| Article | Query |
|---------|-------|
| Fiat Ducato L2H2 | `fiat ducato L2H2 recenzja test` |
| Przeróbka busa na kampera | `przeróbka busa kamper vanlife` |
| Rozrząd Ducato 2.3 | `ducato 2.3 rozrząd naprawa serwis` |
| Camper van co to | `camper van recenzja przegląd` |

### Step 3: Search YouTube API

Run the Python script:

```bash
python3 pipeline/youtube-finder/find-youtube.py "QUERY" --lang pl --threshold 0.3
```

The script:
- Searches YouTube with `relevanceLanguage=pl`, `videoEmbeddable=true`
- Filters out Shorts, memes, TikTok reposts
- Scores results by keyword overlap
- Falls back to English if no Polish results
- Returns JSON with best match or null

### Step 4: Evaluate Relevance

**Auto-accept** (score >= 0.5):
- Video title clearly matches article topic
- Add directly

**Manual judgment** (score 0.3-0.5):
- Read video title and description
- Does the video genuinely relate to the article topic?
- Is it from a credible channel (not spam)?
- Would a reader find it useful?
- If yes → accept. If unsure → skip.

**Auto-reject** (score < 0.3 or null):
- Skip this article, no video added

**Always reject:**
- Videos shorter than 2 minutes (likely Shorts)
- Clickbait titles with no substance
- Videos in languages other than Polish or English
- Product placement / pure ads
- Videos older than 8 years (unless historical/classic content)

### Step 5: Update Article

If a relevant video is found:

**5a. Add to frontmatter:**

```yaml
youtube: "VIDEO_ID"
youtube_title: "Original video title from YouTube"
```

Insert after `image_alt:` line (or after `lead:` if no image_alt).

**5b. Insert shortcode before the last H2:**

Find the last `## ` heading in the article body.
Insert the shortcode on a new line BEFORE that heading, with blank lines around it:

```markdown
(previous section content)

{{% youtube %}}

## Last Heading Here
```

**Important:** Use `{{% %}}` syntax (double percent), NOT `{{< >}}`.

### Step 6: Report

After processing all articles, output a summary table:

```
| Article | Video | Score |
|---------|-------|-------|
| fiat-ducato.md | ✅ "Title..." | 0.72 |
| camper-van.md | ❌ no match | - |
| sprinter.md | ⏭️ already has video | - |
```

## Edge Cases

- **Article already has `youtube:` in frontmatter** → skip entirely
- **Article has only 1 H2** → insert shortcode before that H2
- **Article has no H2** → skip (malformed article)
- **API quota exhausted** → stop processing, report how many done
- **Network error** → retry once, then skip article

## Shortcode Reference

The `{{% youtube %}}` shortcode (at `shared/theme/layouts/shortcodes/youtube.html`):
- Reads `youtube` and `youtube_title` from page frontmatter
- Renders responsive 16:9 iframe with lazy loading
- Uses `youtube-nocookie.com` for privacy
- Shows caption with video title below embed
- Styled via `.youtube-embed` in `main.css`

## API Details

- **Endpoint:** `https://www.googleapis.com/youtube/v3/search`
- **Key:** Hardcoded in `find-youtube.py`
- **Cost:** 100 units per search call
- **Daily limit:** 10,000 units = ~100 searches/day
- **Rate limiting:** No sleep needed (low volume)
