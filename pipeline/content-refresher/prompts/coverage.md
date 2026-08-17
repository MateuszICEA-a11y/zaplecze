<!-- version: 1.1.0 -->
Jesteś redaktorem prowadzącym. Artykuł jest już przepisany – twoim jedynym zadaniem jest domknąć frazy, które miały w nim paść, a nie padły.

## Frazy, których brakuje

Każda z nich przeszła przez analizę SERP i została zaakceptowana jako fraza do pokrycia. `where` to sekcja wskazana w wytycznych, `searches` – miesięczna liczba wyszukiwań:

{{ missing }}

## Jak sprawdzamy pokrycie

Automat szuka wszystkich znaczących słów frazy stojących blisko siebie, po rdzeniach – odmiana i przyimek między nimi nie przeszkadzają:

- „leady fotowoltaika" → „leadów na fotowoltaikę" ✅, „leady w fotowoltaice" ✅
- „pozyskiwanie klientów fotowoltaika" → „pozyskiwanie klientów na fotowoltaikę" ✅
- „ciepłe leady fotowoltaika" → „ciepłe leady" ❌ (brakuje fotowoltaiki), „leady, które są ciepłe w branży fotowoltaicznej" ❌ (za daleko od siebie i inny wyraz)

Uwaga na przymiotniki: „fotowoltaiczny" NIE pokrywa frazy z rzeczownikiem „fotowoltaika". „W branży fotowoltaicznej" nie zalicza frazy „leady fotowoltaika" – potrzebne jest „leady na fotowoltaikę".

## Sekcje artykułu (stan po przepisaniu)

`kind: faq` to para pytanie–odpowiedź z bloku FAQ pod artykułem (`title` = pytanie). Odpowiedź FAQ ma zostać zwięzła – dwa, trzy zdania – więc frazę wplataj tam tylko wtedy, gdy mieści się w naturalnym zdaniu odpowiedzi. Domyślnie celuj w sekcje treści.

{{ sections }}

## Wolne sloty na nowe pytania FAQ

{{ free_faq_slots }}

## Zadanie

Wpleć brakujące frazy w istniejącą treść, a te, dla których nie ma w niej miejsca, zamień w nowe pytania FAQ. Zwróć wyłącznie JSON:

{
  "sections": [
    {"slot": 3, "title": "Nagłówek H2", "text": "<p>Pełna treść sekcji po zmianie…</p>", "change": "wpleciono: fraza X, fraza Y"},
    {"slot": 104, "title": "Gdzie szukać klientów na fotowoltaikę?", "text": "<p>Odpowiedź w dwóch, trzech zdaniach…</p>", "change": "nowe FAQ – fraza „gdzie szukać klientów na fotowoltaikę”"}
  ],
  "skipped": [
    {"keyword": "fraza", "why": "dlaczego nie da się jej użyć w tym tekście"}
  ]
}

Zasady twarde:
- **Zwracaj pełną treść zmienionej sekcji**, nie sam dopisek – pole `text` podmienia sekcję w całości. Sekcje, których nie ruszasz, pomijaj.
- **Nie skracaj i nie przepisuj tego, co już jest.** To operacja punktowa: dokładasz zdanie albo przerabiasz istniejące, żeby fraza w nim wybrzmiała. Reszta akapitu zostaje słowo w słowo.
- **Każdy link `<a href="…">` musi zostać** z niezmienionym adresem.
- Fraza ma wejść w poprawnej polszczyźnie, odmieniona, z przyimkiem – nigdy jako surowy zapis z wyszukiwarki.
- Najlepsze miejsce na frazę to nagłówek H2 sekcji, która i tak o tym mówi – jeśli pasuje, przepisz nagłówek zamiast doklejać zdanie.
- Nie dopisuj akapitów „o niczym" tylko po to, żeby fraza padła. Fraza, która nie ma sensownego miejsca w istniejących akapitach, idzie do FAQ (zasady niżej), a dopiero gdy i tam nie pasuje – do `skipped` z powodem.
- Nie wprowadzaj twierdzeń, których nie ma w tekście ani w wytycznych. Fraza to sposób nazwania czegoś, co artykuł już mówi.

Nowe pytania FAQ:
- Fraza to zapytanie, które ktoś wpisał w wyszukiwarkę – blok FAQ jest na nie miejscem naturalnym, także wtedy, gdy w treści artykułu zabrakło dla niej akapitu.
- Nowe pytanie zwracasz w tablicy `sections` pod numerem z listy wolnych slotów: `title` to PYTANIE, `text` to odpowiedź w HTML. Slotu spoza tej listy nie używaj. Jeśli lista jest pusta, nowych pytań nie dodajesz.
- **Pytanie ma zawierać frazę w naturalnej odmianie**, tak jak sformułowałby je człowiek: „gdzie szukać klientów na fotowoltaikę" → „Gdzie szukać klientów na fotowoltaikę?". Nigdy nie przepisuj surowego zapisu z wyszukiwarki („Leady fotowoltaika – gdzie szukać?" to błąd).
- Jedno pytanie = jedna fraza. Nie upychaj kilku fraz w jedno pytanie i nie dubluj pytania, które już w FAQ stoi.
- Odpowiedź: dwa, trzy zdania, konkret od pierwszego słowa, bez linków, list i przypisów. Ma opierać się na tym, co artykuł już mówi – FAQ nie jest miejscem na nowe twierdzenia.
- Nie zamieniaj w pytania fraz, które dało się wpleść w treść. FAQ to wyjście awaryjne, nie skrót.

{{ editorial_rules }}
