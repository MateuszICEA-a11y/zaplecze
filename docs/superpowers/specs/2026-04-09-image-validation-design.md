# Image Validation & Category Prompts for News Hero Images

**Date:** 2026-04-09
**Status:** Approved
**Problem:** AI image generator (Nano Banana 2 via kie.ai) produces nonsensical images (e.g. person fueling through a car door) because the prompt is too generic.

## Solution

Two-layer defense in `pipeline/news-generator/image_generator.py`:

### 1. Category-Specific Prompt Templates

Detect article category from title keywords and use a scene-specific prompt instead of generic "article about {title}".

| Category | Keywords | Scene |
|----------|----------|-------|
| fuel | paliwo, diesel, benzyna, lpg, ceny paliw, tankowanie | Fuel station, dispenser, wide shot of gas station |
| regulations | prawo, regulacje, mandat, przepisy, rejestracja, homologacja | Documents, road signs, road markings |
| model_specific | ducato, sprinter, transit, crafter, boxer, master, daily, transporter, vito, berlingo, combo, trafic, jumper, jumpy | Specific vehicle type on road/parking, side view |
| camper | kamper, campervan, vanlife, zabudowa | Campervan in travel scenery |
| electric | elektryczny, ev, ładowanie, bateria | Commercial EV at charging station |
| market | sprzedaż, rynek, producent, wyniki, ranking | Dealer parking lot, row of vehicles |
| default | (fallback) | Modern commercial vehicle on road |

### 2. Style Suffix & Negative Prompt

Appended to every prompt:

```
Style: photojournalistic, clean composition, natural lighting,
shallow depth of field, 16:9 landscape.
No text overlays, no watermarks, no logos, no impossible physics,
no anatomical errors, no people interacting with vehicles incorrectly,
no floating objects, no distorted proportions.
```

### 3. Vision Validation Gate (GPT-5.4 Vision)

After image generation:

1. Send image to GPT-5.4 Vision with validation prompt
2. Check: physically sensible? thematically relevant? professional quality?
3. Response: `{valid: bool, reason: string}`
4. If invalid (attempt 1): regenerate with refined prompt including vision's reason
5. If invalid (attempt 2): fall back to placeholder image, log warning

Cost: ~$0.01-0.02 per validation call. Max 3 vision calls per article (worst case).

## Changes

All changes in `pipeline/news-generator/image_generator.py`:

- `CATEGORY_PROMPTS` dict -- new
- `STYLE_SUFFIX` constant -- new
- `_detect_category(title)` -- new function
- `build_prompt(title, section)` -- refactored to use category templates
- `_validate_image(image_path, title)` -- new function (GPT-5.4 Vision)
- `generate_hero_image()` -- added validation loop (max 2 retries)

No changes to `main.py` or other modules. Interface `generate_hero_image()` stays identical.

## Environment

- Requires existing `OPENAI_API_KEY` (already used by generator.py)
- Requires existing `KIE_API_KEY` (already used)
