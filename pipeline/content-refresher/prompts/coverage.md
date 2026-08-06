<!-- version: 1.0.0 -->
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

{{ sections }}

## Zadanie

Wpleć brakujące frazy w istniejącą treść. Zwróć wyłącznie JSON:

{
  "sections": [
    {"slot": 3, "title": "Nagłówek H2", "text": "<p>Pełna treść sekcji po zmianie…</p>", "change": "wpleciono: fraza X, fraza Y"}
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
- Nie dopisuj akapitów „o niczym" tylko po to, żeby fraza padła. Jeśli fraza nie ma w tym artykule sensownego miejsca, wpisz ją do `skipped` z powodem – lista braków z uzasadnieniem jest lepsza niż zdanie, którego nikt by nie napisał.
- Nie wprowadzaj twierdzeń, których nie ma w tekście ani w wytycznych. Fraza to sposób nazwania czegoś, co artykuł już mówi.

{{ editorial_rules }}
