# Sesja 2026-08-17 cz. 2 – Content Watcher: ekspert, FAQ, układ sekcji

Punktem wyjścia była prośba o dwa dropdowny przy wypowiedzi eksperckiej. Po
drodze wyszły cztery błędy, które siedziały w obiegu od wdrożenia i nie dawały
o sobie znać, bo każdy z nich kończył się cichym „nic się nie zmieniło".

Wszystko na produkcji (`main`, osiem commitów: `80bfdd8a`, `79b80f80`,
`a689f418`, `0059ef88`, `54cdca39`, `98e3734c`, `bd646382`, `98c94964`,
`9d69dd51`).

## 1. Dropdown „Ekspert" był pusty – od zawsze

`GET /api/cw/authors/:domain` szedł do WordPressa anonimowo, a AIOS blokuje
listę użytkowników (`aios_user_lists_forbidden`, HTTP 403). Edytor łykał błąd
po cichu (`catch { return }` – „brak listy = zostaje dobierz automatycznie"),
więc select miał jedną pozycję i **wybór osoby nigdy nie działał**: cytat
zawsze podpisywał model, wybierając z czterech nazwisk zaszytych w `EXPERTS`.

Naprawa: `wpAuthors` dostaje nagłówek `Authorization` z hasła aplikacji
(`wpAuth(env)` – ten sam sekret, którym zapisujemy szkice). Endpoint oddaje
31 osób (37 kont minus firmowe).

## 2. Stanowisko z listy zamiast wolnego pola

WordPress stanowisk nie trzyma (`KNOWN_ROLES` zna cztery osoby), więc dla
reszty redaktor wpisywał je z ręki – przy każdym cytacie od nowa. Teraz drugi
select z 13 pozycjami (formy męskie i żeńskie osobno, żeby podpis się zgadzał)
plus „inne (wpisz…)", które odsłania stare pole tekstowe.

## 3. Podpis pod cytatem ginął w czarnym pasku

Motyw stylizuje `blockquote footer` ciemnym tłem, a nazwisko miało kolor
`#000623` – zlewało się z tłem i na stronie zostawało samo „, specjalistka
SEO". Blok jest teraz kartą: zaokrąglone rogi, awatar z inicjałów, cytat
kursywą, podpis „Imię Nazwisko · rola, ICEA" z jawnym `background:transparent`.

Zdjęcia: żadne z 37 kont nie ma Gravatara (sprawdzone `d=404`), więc domyślnie
lecą inicjały – ale avatar wgrany później wjedzie do karty bez zmiany w kodzie
(`expertPhoto` sprawdza adres przy generowaniu cytatu). Sanitizery przepuszczają
`div` układu i `img` po https.

Styl żyje w trzech lustrach: `cw-expert.js`, `edytor.astro`, `run.py` –
pipeline generował wcześniej blok zupełnie bez stylów.

## 4. FAQ nie docierało do edytora

Największe znalezisko. Pipeline zmieniał pytania i pokazywał je w diffie
przebiegu, ale `/api/cw/callback` przyjmował wyłącznie sloty `1..30`, więc
przestrzeń FAQ (101+) **nigdy nie trafiała do D1**. W edytorze wyglądało to jak
„FAQ bez zmian" – niezależnie od modelu i liczby przejazdów.

Naprawa: wspólny zakres slotów (`isKnownSlot`), fallback nazw pól zna
`page_faq_*`, trasa `/sections/:slot` przyjmuje numery trzycyfrowe.

**Konsekwencja historyczna:** wpisy z FAQ wdrożone przed tą poprawką mają
w WordPressie FAQ w starej wersji, mimo że pipeline je przepisał.

## 5. Fraza bez miejsca w treści → pytanie FAQ

Pomysł Mateusza: blok FAQ to naturalne miejsce na zapytanie z wyszukiwarki.
Dwa podejścia:

1. Krok `coverage` dostał wolne sloty FAQ i regułę „fraza bez miejsca
   w akapitach idzie na pytanie" (prompt 1.1.0). **Nie zadziałało w praktyce** –
   model zajęty wplataniem w akapity wybierał bezczynność: na `6552670b` fraza
   „leady sprzedażowe fotowoltaika" przeszła dwie rundy bez pokrycia, bez powodu
   i bez pytania.
2. Dlatego doszła **osobna runda na koniec** (`coverage_faq` 1.0.0): jedno
   zapytanie, którego jedynym zadaniem jest zamienić zostawione frazy w pytania.
   Model nie ma opcji „nie robię nic".

Efekt na `964ee898`: „ciepłe leady fotowoltaika" → **„Jak zdobywać ciepłe leady
na fotowoltaikę?"** (slot 105), pokrycie 1.0, `skipped` puste.

Budżet nowych pytań (`MAX_NEW_FAQ` = 3) jest wspólny z krokiem `rewrite`, slot
spoza puli wolnych par jest odrzucany.

## 6. Przepisane pytanie zostaje przy swoim temacie

Gemini 3.7 Flash zamienił „Jakie są zalety pozycjonowania branży
fotowoltaicznej?" na „Czy SEO i pozycjonowanie to to samo?" – formalnie
przepisanie, w praktyce skasowanie pytania z frazą branżową. Prompt `rewrite`
(1.8.0) zabrania podmiany tematu i kieruje nowe wątki do wolnych slotów. Grok
4.6 po zmianie zostawia pytania i dopisuje obok.

## 7. Nowe sekcje doklejane na koniec

Brief nadawał nowej sekcji **numer pierwszego wolnego slotu** i milczał o
miejscu w artykule, więc rewrite czytał to jako pozycję i dopisywał wszystko za
sekcją zamykającą. Efekt: nowe wątki po „Samodzielne SEO czy współpraca
z agencją?".

Naprawa w trzech miejscach:
- brief (1.7.0) podaje `after_slot` – sąsiada tematycznego,
- rewrite (1.9.0) traktuje kotwicę z zadania jako wiążącą i nazywa doklejanie
  na koniec błędem,
- pipeline uzupełnia kotwicę z briefu, gdy model jej nie odda.

Wynik na `964ee898` (`anchors: 7→2, 8→3, 9→4`): nowe sekcje przeplatają się
z istniejącymi, renumeracja przesuwa resztę (`moves`), sekcje zamykające
zostają na końcu.

## 8. Układ dokumentu w edytorze

Trzy usterki wyświetlania, przez które FAQ wyglądało na rozbite:

- **nowa sekcja pod nagłówkiem FAQ** – kotwicy szukaliśmy po pierwszym węźle
  o wyższym numerze slotu, a numeracja jest wspólna dla sekcji i FAQ. Sekcja bez
  następnika łapała się pytania 101 i lądowała między nagłówkiem bloku
  a pytaniami. Teraz kotwica szukana jest w tej samej przestrzeni slotów,
  a sekcja bez następnika staje przed blokiem FAQ.
- **podgląd całości bez FAQ** – snapshot zbierał H1 i H2, a pytania renderują
  się w H3; do podglądu szły same odpowiedzi, bez pytań i nagłówka bloku.
- **etykieta** – nowe pytanie podpisywało się jako „nowa sekcja".

Doszły też dwa wpisy w podsumowaniu: „Miejsce nowych sekcji" (mapa kotwic)
i „Frazy domknięte pytaniem FAQ".

## 9. Cichy przejazd bez fraz

SerpData oddało raz adresy obcięte do domen (`https://www.proformat.pl/`
zamiast pełnej ścieżki). Strony główne odrzucamy świadomie – wsypywały do
briefu frazy brandowe konkurenta (sonda 2026-07-30) – ale efekt szedł dalej po
cichu: zero fraz konkurencji → brief bez `keywords_to_cover` → bramka pokrycia
melduje „brak fraz do sprawdzenia", a zadanie kończy się jako `done` z kompletem
sekcji. Krok zapisuje teraz `warning` w payloadzie (widoczny w edytorze) i
`::warning::` w logu przebiegu. Sonda ręczna potwierdziła, że to była chwilowa
odpowiedź API, nie regresja u nas.

## Przebiegi diagnostyczne

Sześć rerunów na `posts-20811` (grupa-icea.pl). Do obejrzenia jest tylko
ostatni – **`964ee898`** (analiza `openai/gpt-5.6-terra`, pisanie
`x-ai/grok-4.6`): pokrycie 1.0, kotwice, FAQ 101–105, naprawiony układ
dokumentu. Wcześniejsze (`bdf619cd`, `2dd57bb3`, `bae6140a`, `dadd1475`,
`6552670b`) to materiał diagnostyczny – do usunięcia z kolejki.

Różnica modeli warta zapamiętania: Gemini 3.7 Flash podmienia pytania FAQ
i szuka skrótów, Grok 4.6 trzyma się instrukcji promptu.

## Zaległe

- Krok `expert` jest poza pakietem przebiegu (uruchamiany osobno z edytora), więc
  karty cytatu nie widać na świeżym rerunie, dopóki się jej nie wygeneruje.
- Reruny diagnostyczne zostają w kolejce.
- Pierwszy dispatch `repository_dispatch` odbił się błędem GitHuba i zostawił
  zadanie w stanie `failed`; drugi strzał przeszedł. Jeśli się powtórzy, warto
  dołożyć ponowienie.
