# Przejazd widocznosc-blog-polish — Pass 1 (wygładzanie polszczyzny)

**Data:** 2026-06-04
**Zakres:** Pass 1 (wygładzanie PL, Gemini 3.1 Pro / OpenRouter + diff-guard). Pass 2 (fact-check) pominięty — był świeżo wykonany 2026-05-30.
**Wynik:** 42/46 wpisów wygładzonych i zacommitowanych, 4 odrzucone przez diff-guard (oryginały nietknięte).

## Wynik per kategoria

| Kategoria | Smoothed | Rejected/Error | Commit |
|---|---|---|---|
| prompty | 1/1 | – | `e1cf791` |
| agenci-ai | 2/2 | – | `92e34a5` |
| rag | 3/4 | 1 | `b5daa81` + retry `d5a7c4c` |
| modele-llm | 11/11 | – | `eff80fa` + retry `d5a7c4c` |
| ai-w-biznesie | 12/12 | – | `e159be2` |
| geo | 13/16 | 3 | `fad14ec` + retry `d5a7c4c` |
| **Razem** | **42/46** | **4** | 7 commitów content |

## needs-manual (4 odrzucone — wymagają ręcznego wygładzenia lub pozostają w oryginale)

Wszystkie odrzucone przez diff-guard za **zgubiony tag HTML** (token `§HTMLTAG§` 0×). Wspólny mianownik: wpisy najbogatsze w inline HTML (SVG ikony/hero `<path>/<circle>/<rect>` + bloki przykładowego kodu `<documents>/<document>/<p>/<strong>/<code>`). Model przy przepisywaniu prozy gubi pojedynczy tag w gąszczu. Uparte — odrzucone w obu przejazdach (1. + retry). Oryginały bezpieczne.

- `rag/przewodnik.md` — §HTMLTAG_43, _44
- `geo/boty-ai-przewodnik.md` — §HTMLTAG_40
- `geo/najczestsze-bledy-geo.md` — §HTMLTAG_23, _24
- `geo/schema-org-dane-strukturalne.md` — §HTMLTAG_31

**Możliwe ulepszenie skilla:** zamrażać całe bloki `<svg>…</svg>` oraz `<p>…</p>`/`<documents>…</documents>` jako pojedyncze tokeny (jak `<aside>`), zamiast pojedynczych tagów — wtedy model nie ma okazji zgubić tagu wewnątrz.

## Jakość — uwagi z przeglądu (post-check glos + linki, per kategoria)

- **Linki:** we wszystkich 42 wpisach całe (naprawa zamrażania `[anchor](url)` z tej sesji działa).
- **Glosy/terminy:** chronione przez zacieśniony prompt (sekcja TERMINOLOGIA I GLOSY). Większość flag post-checku to przeredagowania zachowujące treść (nawias→zdanie, `+`→`i`, drobne słowa) lub zmiana typografii cudzysłowu `„..."`→`„...”`.
- **Realne mikro-straty (2 na ~1000+ glos):**
  - `modele-llm/chatgpt-vs-claude.md` — wypadł poboczny nawias `(dla deweloperów integrujących modele w produktach)`.
  - `ai-w-biznesie/ai-w-hr.md` — wypadł `(dashboardów)` przy „kokpitów menedżerskich".
  - Oba: objaśnienia kontekstowe, nie fakty/źródła/terminy-klucze. Łagodne.
- **Fakty:** wszystkie liczby, daty, kwoty kar (AI Act/RODO: 15 mln/3%/35 mln/7%, 2024/1689, 2016/679, 2 grudnia 2027), nazwy modeli i wersje — nietknięte (diff-guard).
- **Typografia:** model ujednolica zamykający cudzysłów na poprawny polski `”` (był prosty `"`). Spójne w obrębie wygładzonych wpisów.

## Decyzje promptu z tej sesji (smoother.py SYSTEM_PROMPT)

1. Cytaty DOSŁOWNIE (też angielskie) w cudzysłowie — bez tłumaczenia/parafrazy (commit `0579cdb` poprzedza `a5ef8a1`).
2. Zakaz zdań wprowadzających/podsumowujących wokół tokenów (tabele/listy/obrazy) + akapity 1:1.
3. TERMINOLOGIA I GLOSY: zachowaj każdy nawias-glosę dosłownie, nie polszcz ustalonych terminów-kluczy (commit `0579cdb`).
4. Zamrożenie całego linku `[anchor](url)` (commit `a5ef8a1`).

## Decyzje użytkownika

- Pogrubienia dodawane przez Gemini — **zostawione** (OK/pożądane).
- Konsolidacja powtórzonych liczb — **zostawiona diff-guardowi** (rejected → ręcznie).
- Zakres: **tylko Pass 1**, Pass 2 (fact-check) pominięty (świeży z 2026-05-30).
