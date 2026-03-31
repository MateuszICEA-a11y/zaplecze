# Transformacja Zaplecza SEO – Project Instructions

## Content Writing

When creating content for BusManiak.pl (articles, keyword research, content pipeline), ALWAYS use the content writer skill:
- Slash command: `/write-content [topic]`
- Full pipeline: `pipeline/content-writer/SKILL.md`

This is a 6-stage pipeline: Keyword Research → Outline & Research → Draft (Gemini Flash) → Humanize (Sonnet) → Post-processing → Output.

Never write articles without following this pipeline. Run all 6 stages end-to-end without stopping for approval.

## YouTube Videos

To find and embed relevant YouTube videos in articles, use the YouTube finder skill:
- Slash command: `/add-youtube <path>`
- Full skill: `pipeline/youtube-finder/SKILL.md`

Searches YouTube API for matching videos (PL first, EN fallback). Adds only when a relevant match is found. Embeds before the last H2 via `{{% youtube %}}` shortcode.

## Typography

- En-dash (–) only. Never em-dash (—).
- Brand name: BusManiak.pl (camelCase).

## Content Rules

- Image placement: before 3rd or 4th H2 heading.
- No bold+colon in lists. Use: **Term** – description.
- FAQ in frontmatter, not in article body.
- Every article goes through Sonnet humanization subagent.
