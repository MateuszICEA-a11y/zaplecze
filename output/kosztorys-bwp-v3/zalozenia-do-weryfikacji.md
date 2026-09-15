# Założenia aktualnego modelu – 15.09.2026

Użytkownik wyjaśnił jednostkę: **250 zł za roboczogodzinę**, nie miesięcznie. Kalkulator pozwala dodać wielu pracowników z różnymi kosztami i udziałami. Stawka miesięczna pracownika jest przeliczana przez dostępne godziny; koszt projektu odzwierciedla przydzielony czas, nie automatycznie całą listę płac. Dostępność jest porównywana z miesięczną obsługą. Nie porównujemy wszystkich godzin uruchomienia z jednym miesiącem bez podania harmonogramu.

Potwierdzono około 100 wpisów na start portalu, cykliczne dopisywanie treści, koszt przygotowania i publikacji treści dla klientów, Claude 100 USD/mies. jako stały koszt wspólny, hosting Pages obecnie 0 zł. Promocja limitów Claude przy BusManiaku nie wyznacza standardowej przepustowości.

## Korekta po przeglądzie 15.09

Przegląd wykazał trzy problemy pierwszej wersji: 1 wpis miesięcznie zaniżał OPEX, profil C zachowywał 15 min człowieka na wpis (czyli nie był scenariuszem C z briefu), a cała praca szła po 250 zł/rbh bez zaznaczenia, że to górna granica. Poprawki: baza to zespół senior 250 zł/rbh + junior 9 000 zł/mies. w proporcji 1:3 (brief zakładał 1 etat juniora); B 10 wpisów/mies.; C 60 wpisów na start, 6/mies., 2 min na wpis i 98 h nadzoru (18 h + 80 h próbkowej QA, pół etatu redaktora); narzędzia researchu 180/2 500 zł/mies.; wariant górny 250 zł/rbh pokazany obok; miesiące uruchomienia przy pełnej dostępności; sekcja z krzywą portal 1/10/100 i obsadą (pozycje 6 i 8 briefu). Poza modelem, z adnotacją w dokumencie: newsy z automatu, recykling, odnowienia domen od roku 2, drugi seat Claude dla juniora, sędzia jakości LLM w C.

## Jednostka treści

Założenie: wpis około 1200–1800 słów, 15 minut pracy operatora (przygotowanie 5, kontrola i korekty 7, publikacja 3), jeden obraz 1K. Czas oczekiwania modelu nie jest automatycznie czasem pracy. Dodatkowy wpis dla klienta ma 10 minut dodatkowej obsługi briefu i linku. Jeżeli wpis dla klienta jest już liczony w planie, nie jest dodawany drugi raz.

Domyślnie w B 10 nowych wpisów miesięcznie i 0 dodatkowych klienta (skrót z 04.09: 15 tekstów + 30 newsów; newsy poza modelem). W C 60 wpisów na start, 6 miesięcznie i 2 min na wpis: człowiek obsługuje tylko wyjątki z automatu, jakość kontroluje próbka 1 na 10 w nadzorze wspólnym. Bez tego warunku C nie istnieje (portal C kosztuje wtedy ok. 70% portalu B). Wolumen można dowolnie zmienić. Praca wpisów jest doliczana do pracy technicznej, która nie zawiera produkcji treści. Dawnych 12–20 godzin na cały portal nie stosujemy równocześnie z nowym modelem jednostkowym.

## Ceny i budżet zużycia

- Gemini 3.5 Flash: 1,50/9 USD za mln tokenów wejścia/wyjścia. 16000/8000 tokenów na wpis daje 0,096 USD. https://ai.google.dev/gemini-api/docs/pricing
- Sonar: 1/1 USD za mln tokenów oraz 0,008 USD za zapytanie medium. 12000/4000 tokenów łącznie, 2 zapytania (research i fact-check): 0,032 USD. https://docs.perplexity.ai/docs/getting-started/pricing
- Sonnet 4.6: 3/15 USD za mln tokenów. 12000/4000 tokenów daje 0,096 USD, tylko w pełnym API. W B redakcja jest w subskrypcji Claude. https://platform.claude.com/docs/en/about-claude/pricing
- Kie.ai Nano Banana 2: 1K 0,04, 2K 0,06, 4K 0,09 USD. https://kie.ai/nano-banana-2
- Kie.ai GPT Image 2: 1K 0,03, 2K 0,05, 4K 0,08 USD. Sformułowanie użytkownika „gpt2” interpretujemy jako ten model. https://kie.ai/gpt-image-2

Ceny zweryfikowane 15.09.2026. Model korzysta z cenników bezpośrednich dostawców LLM i Kie dla grafik. Pośrednicy mogą mieć inne stawki. Zużycie tokenów, 25% rezerwy i kurs 4 PLN/USD są jawnymi założeniami, nie pomiarem ani aktualnym kursem NBP. Rezerwa dotyczy ponowień API, nie pracy pracownika.

## Profil techniczny

B: uruchomienie portalu 8 h, wspólny proces 36 h, obsługa 1 h/portal/mies., nadzór 6 h/mies.
C: uruchomienie 3 h, wspólna warstwa 240 h (36 architektura + 96 pipeline + 108 panel), obsługa 0,25 h/portal/mies., nadzór 98 h/mies. (18 h + ok. 80 h próbkowej kontroli jakości).
To założenia planistyczne do walidacji, nie deklaracje wykonawcy. Do tego dochodzi liczba wpisów razy minuty obsługi. B: 8 h + 100 wpisów × 15 min = 33 h bezpośredniej pracy na portal. C: 3 h + 60 × 2 min = 5 h. Narzędzia researchu: B 180 zł/mies. (SerpData, Workers; Senuto i DataForSEO w subskrypcjach firmowych), C 2 500 zł/mies.

Domena: rezerwa 100 zł na pierwszy rok, bez odnowienia roku drugiego. C: rezerwa 200 zł/mies. wspólnej infrastruktury, bez ponownego doliczania hostingu per portal. Nowe zakupy wspólne: założenie 0 zł; praca panelu liczona w godzinach.

Pages ma 100 projektów/konto i 500 buildów/mies. Free. Skala C przy jednym projekcie na portal wymaga innej architektury. https://developers.cloudflare.com/pages/platform/limits/
Claude i Claude Code mają wspólne limity; API osobne rozliczenie. https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan

Pierwszy rok = uruchomienie + 12 miesięcy pracy całej sieci. To porównanie kosztów, nie harmonogram narastania sieci. Publikacje dla klientów dotyczą normalnej pracy po osiągnięciu dojrzałości; wcześniejsza koncepcja przewidywała 90 dni i 12 treści przed pierwszym linkiem. Trafialność 30/50/70% to analiza wrażliwości. B i C liczone niezależnie; przejście B→C wymaga odjęcia ponownie użytej pracy wspólnej.

Historyczne 52,2 h obejmuje też późniejsze prace; około 3 tygodnie to czas kalendarzowy. Nie przepisujemy tej liczby jako pomiaru samego uruchomienia, a promocji limitów nie traktujemy jako stałej właściwości abonamentu.
