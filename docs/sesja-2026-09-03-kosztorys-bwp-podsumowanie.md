# Sesja 2026-09-03 – kosztorys sieci BWP 2.0 (scenariusze B i C)

Zlecenie: Michał Ziach, `zlecenie-szacunkowy-kosztorys-sieci-bwp-2-0.md` (Downloads), termin 10.09, przegląd we dwóch 11.09, wynik do ticketu 434172.

## Zrobione

- `docs/kosztorys-siec-bwp-2-0-2026-09-03.html` – dokument w stylu iCEA, 11 sekcji + 4a, kopia w Downloads. Przycisk „Pobierz .md” do wklejenia do ticketu.
- Dane wejściowe wzięte z repo: 52,2 h z ticketu 441565, 280 tekstów evergreen (mediana 1 600 słów), 123 newsy, 421 grafik, 4 narzędzia, koszty API z `docs/dokumentacja-busmaniak-proces.html`, cenniki modeli 09.2026, przejazdy Content Watchera.
- Po pytaniu Mateusza dopisana sekcja 4a: operator Claude Code, licencje (2 seaty Max 20x w B), wydajność (1 seat = 1 portal na 5–7 dni; B 2–3 portale/mies.; C 30 portali/mies. przez API). Tabela B przeliczona.

## Kluczowe liczby (po korekcie)

| | B (15 portali) | C (250 portali) |
|---|---|---|
| CAPEX | ≈100 tys. zł | ≈320 tys. zł (panel 40–55 tys.) |
| OPEX/mies. pełna skala | ≈11 tys. zł | ≈43 tys. zł |
| Portal w 12 mies. | ≈12 tys. zł | ≈2,7 tys. zł (nr 100) |
| Portal, który pracuje | ≈17 tys. zł | ≈5,4 tys. zł |
| Całość 12 mies. | 160–230 tys. zł | 250 portali dopiero w 18–20 mies. |

Portal nr 1 skorygowany z 52 h do ≈110 rbh. Artykuł ≈2,5 zł API w B, ≈4 zł w C. Recykling ≈1,7 zł/przejazd. Trafialność 3/4/3 z 10 w B, 1/4/5 w C.

## Założenia do obrony 11.09

- senior 180 zł/rbh, junior 9 000 zł/mies., kurs 3,8
- C istnieje tylko przy publikacji bez oka człowieka (inaczej ×3–4)
- świeże domeny 100 zł; aged = +75–500 tys. w C
- limity Senuto/SerpData przy 250 portalach; limit projektów CF Pages (do sprawdzenia przed portalem 80)
- wielkość portalu startowego B: 200 czy 100 tekstów

## Na jutro

- przejrzeć dokument świeżym okiem, ewentualnie doprecyzować rbh współdzielone C (600–900 to szerokie widełki)
- zdecydować, czy wrzucić do ticketu jako .md, czy link do HTML
- nie zacommitowane wcześniej pliki w docs/ (analiza klastra, case study .md, plany superpowers) nadal wiszą jako untracked – osobna decyzja
