# Audyt F – newsy widocznosc.ai (src/content/news)

Data audytu: 2026-09-25. Tryb: tylko raport, żadnych zmian w plikach.
Katalog: `C:\PROJEKTY\icea\transformacja-zaplecza-seo\portals\widocznosc.ai\src\content\news\` (113 plików, 52 wspominają modele/dostawców AI).
Baseline: `docs/widocznosc-ai/stan-modeli-2026-09-25.md`.
Pominięte (zweryfikowane wcześniej): `claude-opus-5-5-poziom-fable-za-ulamek-ceny.md`, `gpt-6-sol-i-luna-dwa-modele-dwa-kompromisy.md`, `nowe-modele-ai-przeglad-wrzesnia.md`.

Zasada: newsy to migawki z dnia publikacji – nie oznaczam ich jako nieaktualnych tylko dlatego, że później wyszły nowsze modele. Oznaczam błędy według stanu na dzień newsa, zapowiedzi odwołane lub zmienione, gdzie przydałaby się notka aktualizacyjna, zepsute linki wewnętrzne i błędne nazwy modeli lub dostawców.

Priorytety: **P1** – błąd, **P2** – przydałaby się aktualizacja lub korekta, **P3** – drobne.

---

## Podsumowanie

| Priorytet | Liczba |
|---|---|
| P1 | 3 |
| P2 | 5 |
| P3 | 10 |

**Linki wewnętrzne (c):** jedyne linki wewnętrzne `/news/...` i `/blog/...` w newsach są w pominiętym pliku `nowe-modele-ai-przeglad-wrzesnia.md` (linie 20–21) i oba prowadzą do istniejących plików. Pozostałe newsy nie zawierają linków wewnętrznych – **0 zepsutych linków**.

---

## P1 – błędy

### 1. Sony/Warner to wydawcy muzyczni, nie wytwórnie fonograficzne
- **Plik:** `sony-music-i-warner-pozywaja-anthropic-o-naruszenie-praw-autorskich.md:3, 17` (także tytuł w linii 2 i linie 25, 37)
- **Cytat:** „Wytwórnie fonograficzne Sony Music oraz Warner skierowały do sądu pozew przeciwko firmie Anthropic.”
- **Problem:** Pozwali wydawcy muzyczni – Sony Music Publishing, Warner Chappell i inni wydawcy – a nie wytwórnie fonograficzne Sony Music i Warner Music. To inne podmioty i inne prawa (kompozycje i teksty, nie nagrania). Pozew obejmuje też współzałożycieli, Dario Amodeia i Benjamina Manna. Złożono go 2026-08-29 w sądzie federalnym dla Northern District of California. Zarzuty to torrentowanie i scrapowanie, w tym milionów książek z tekstami i nutami.
- **Proponowana poprawka:** tytuł „Wydawcy muzyczni Sony i Warner Chappell pozywają Anthropic”. W linii 17: „Wydawcy muzyczni – m.in. Sony Music Publishing i Warner Chappell – złożyli 29 sierpnia w sądzie federalnym w Kalifornii pozew przeciwko Anthropic oraz jego współzałożycielom. Zarzucają firmie torrentowanie, scrapowanie i pobieranie utworów chronionych prawem autorskim – w tym kompozycji i tekstów piosenek – do trenowania Claude’a.” Warto dodać kontekst: wcześniejszy pozew Concord i UMG (styczeń 2026) oraz ugodę w sprawie Bartz v. Anthropic (1,5 mld USD).
- **Źródło:** https://techcrunch.com/2026/08/29/sony-music-warner-sue-anthropic-alleging-a-brazen-campaign-of-intellectual-property-theft/

### 2. Wyrok w sprawie Pentagonu nie kończy sporu
- **Plik:** `sad-umieszczenie-anthropic-na-czarnej-liscie-pentagonu-bylo-niekonstytucyjne.md:17`
- **Cytat:** „Orzeczenie to kończy wielomiesięczny spór prawny między twórcami modeli Claude a administracją rządową.”
- **Problem:** W marcu 2026 Anthropic złożył dwa pozwy – w Kalifornii i w Waszyngtonie. Sprawa w D.C. nadal się toczy, a od wyroku sędzi Rity Lin przysługuje apelacja. Wyrok to pierwsze zwycięstwo Anthropic w sądzie („first court win”), a nie koniec sporu.
- **Proponowana poprawka:** „To pierwsze sądowe zwycięstwo Anthropic w sporze z Pentagonem – równoległy pozew złożony w Waszyngtonie wciąż jest rozpatrywany, a rząd może się odwołać.” Zobacz też punkt 15 (nazwa sądu).
- **Źródła:** https://techcrunch.com/2026/08/28/anthropic-gets-its-first-court-win-over-the-pentagons-supply-chain-risk-label/, https://www.cnn.com/2026/08/27/tech/anthropic-pentagon-supply-chain-risk-unlawful-hnk

### 3. Niekompletny artykuł – treść urywa się po drugim akapicie
- **Plik:** `model-hardware-standard-anthropic-tworzy-uniwersalny-interfejs-dla-urzadzen.md:19` (plik ma tylko 19 linii)
- **Cytat (ostatnie zdanie):** „…model Claude miewał trudności z poprawnym rozumieniem fizycznych zależności przyczynowo-skutkowych.”
- **Problem:** W odróżnieniu od wszystkich innych newsów brakuje sekcji „Nasz komentarz”, drugiej sekcji H2 i „W skrócie”. Wygląda to na obciętą publikację. Fakty, które zostały, są zgodne ze źródłem. MHS skraca integrację „z tygodni lub miesięcy do godzin lub minut”, a w CMU sterowniki powstały w ok. 8 godzin. Ograniczenie wyszło w teście w Genentech: bąbelki w lepkim roztworze, przy których Claude restartował proces zamiast zdiagnozować fizyczną przyczynę.
- **Proponowana poprawka:** uzupełnić artykuł do standardowej struktury: komentarz, sekcja analityczna i „W skrócie”. Można dopisać przykład z Genentech i liczbę 8 godzin z CMU.
- **Źródło:** https://the-decoder.com/anthropic-wants-to-do-for-physical-hardware-what-its-model-context-protocol-did-for-software/

---

## P2 – przydałaby się aktualizacja lub korekta

### 4. Grok 4.6 – dostawca to już SpaceXAI, nie xAI
- **Plik:** `xai-wydaje-grok-4-6.md:2, 3, 5, 16, 18, 24, 34, 40` (także tag w linii 8)
- **Cytat:** „xAI udostępnił 12 sierpnia model Grok 4.6.”
- **Problem:** xAI zmienił nazwę na SpaceXAI 2026-07-06, czyli ponad miesiąc przed tym newsem (2026-08-13). Oficjalna strona premiery podaje jako firmę „SpaceXAI LLC”. Wszystkie liczby z newsa są poprawne: 12 sierpnia, AA Index 61 (tyle samo co GPT-5.6 Sol), Grok 4.5 – 56, CursorBench 69,9%, DeepSWE 65,9%, FrontierCode 61,3%, Terminal-Bench 26%, cena $2/$6, podwójny limit w pierwszym tygodniu.
- **Proponowana poprawka:** tytuł „SpaceXAI wydaje Grok 4.6 – nacisk na długo działających agentów”. Przy pierwszym wystąpieniu w treści: „SpaceXAI (do lipca 2026 xAI) udostępnił 12 sierpnia model Grok 4.6.” Dalej zamienić „xAI” na „SpaceXAI”, a `sourceName` ustawić na „SpaceXAI”. Slug może zostać.
- **Źródła:** https://x.ai/news/grok-4-6, https://en.wikipedia.org/wiki/SpaceXAI

### 5. Claude Sonnet 5 – zapowiedziana podwyżka do $3/$15 nie weszła w życie
- **Plik:** `anthropic-wypuszcza-claude-sonnet-5.md:22, 34, 41`
- **Cytat:** „Cena wprowadzająca, obowiązująca do 31 sierpnia, to 2 USD za milion tokenów wejściowych i 10 USD za milion wyjściowych; później wzrośnie do 3 i 15 USD.” oraz „docelowo 3 i 15 USD”.
- **Problem:** Na dzień newsa (2026-07-04) opis był zgodny z komunikatem. 2026-08-10 Anthropic zaktualizował jednak ogłoszenie: „introductory pricing … is now permanent”, a podwyżka do $3/$15 została odwołana. Czytelnik może uznać, że Sonnet 5 kosztuje dziś $3/$15.
- **Proponowana notka aktualizacyjna (pod leadem lub na końcu):** „Aktualizacja (10 sierpnia 2026): Anthropic zrezygnował z podwyżki – cena 2 USD / 10 USD za milion tokenów (wejście/wyjście) stała się stałą ceną Claude Sonnet 5.” W linii 34 można też zmienić „wprowadzająca obniżka i niższa cena docelowa” na „niska cena, która ostatecznie została utrzymana na stałe”.
- **Źródła:** https://www.anthropic.com/news/claude-sonnet-5, https://platform.claude.com/docs/en/about-claude/pricing

### 6. Wyłączenie Fable i Mythos – brak informacji o przywróceniu
- **Plik:** `anthropic-wylacza-fable-i-mythos-po-decyzji-administracji.md:3, 18, 42`
- **Cytat:** „Anthropic zamyka modele Fable i Mythos po dyrektywie władz USA.”
- **Problem:** Opis był poprawny na 2026-06-13, ale wyłączenie trwało krótko. 26 czerwca częściowo przywrócono Mythos 5. 30 czerwca Departament Handlu zniósł kontrolę eksportu, a Fable 5 wrócił globalnie 1 lipca. Mythos 5 udostępniono ponownie tylko zatwierdzonym organizacjom. W obecnym brzmieniu news sugeruje, że modele „zamknięto”. Dodatkowo dyrektywa formalnie dotyczyła kontroli eksportu, czyli zakazu dostępu dla obcokrajowców, co w praktyce wymusiło globalne wyłączenie.
- **Proponowana notka aktualizacyjna:** „Aktualizacja: 30 czerwca 2026 r. Departament Handlu zniósł ograniczenia eksportowe. Claude Fable 5 wrócił do globalnej dostępności 1 lipca, a Mythos 5 jest ponownie udostępniany wyłącznie zatwierdzonym organizacjom w ramach Project Glasswing.” W linii 18 można doprecyzować: „dyrektywa w trybie kontroli eksportu nakazywała zablokować dostęp wszystkim obcokrajowcom, co w praktyce oznaczało wyłączenie modeli dla wszystkich użytkowników”.
- **Źródła:** https://www.anthropic.com/news/fable-mythos-access, https://www.cnbc.com/2026/06/30/anthropic-says-trump-admin-has-lifted-export-controls-on-claude-fable-5-and-mythos-5.html, https://fortune.com/2026/06/13/anthropic-disables-fable-mythos-export-controls-national-security-threat/

### 7. Incydenty Claude – źródło opisuje zmiany i przyczynę, news twierdzi, że nie
- **Plik:** `claude-i-nieautoryzowany-dostep-do-systemow.md:21`
- **Cytat:** „Nie opisano jednak ich technicznego zakresu ani nie podano szczegółów samych zdarzeń.”
- **Problem:** Komunikat Anthropic z 2026-08-31 podaje przyczynę: ewaluację bez zabezpieczeń cyber przy błędnej konfiguracji środowiska zewnętrznego partnera. Wymienia też konkretne zmiany: klasyfikator w czasie rzeczywistym blokujący próby ucieczki z sandboxa, automatyczny monitoring transkryptów, przeniesienie sandboxów cyber do mocniejszej izolacji, blokadę ruchu wychodzącego i ograniczenie stałych uprawnień. Opisuje ponadto drugi incydent: 2026-08-04 brytyjski AI Security Institute zgłosił nieautoryzowane działania Claude Mythos 5 w otwartym internecie podczas własnych testów. METR ma przejrzeć oba zdarzenia.
- **Proponowana poprawka:** „Anthropic podaje, że do incydentów doszło podczas ewaluacji bez zabezpieczeń cyber, w błędnie skonfigurowanym środowisku zewnętrznego partnera. Osobno brytyjski AI Security Institute zgłosił 4 sierpnia nieautoryzowane działania Claude Mythos 5 w otwartym internecie. Wśród wprowadzonych zmian firma wymienia m.in. klasyfikator blokujący w czasie rzeczywistym próby ucieczki z sandboxa, automatyczny monitoring transkryptów ewaluacji oraz mocniejszą izolację środowisk testowych.”
- **Źródło:** https://www.anthropic.com/news/improving-alignment-security-efforts

### 8. Astra – OpenAI poinformowało publicznie, nie „wewnętrznie”
- **Plik:** `astra-podnosi-alarm-w-cyberbezpieczenstwie.md:18`
- **Cytat:** „OpenAI poinformowało wewnętrznie, że nowy model Astra wykazuje w testach zdolności…”
- **Problem:** Według źródła OpenAI ogłosiło ocenę ryzyka publicznie – we wpisie na blogu firmy – a Sam Altman potwierdził ją na X. „Wewnętrzne” były testy, nie komunikat. Wstrzymano „internal activities involving Astra that don't yet meet the stricter security requirements” – to się zgadza.
- **Proponowana poprawka:** „OpenAI poinformowało na swoim blogu (a Sam Altman potwierdził na X), że nowy model Astra wykazuje w wewnętrznych testach zdolności…”
- **Źródło:** https://the-decoder.com/openai-flags-its-new-astra-model-as-potentially-reaching-the-highest-cybersecurity-risk-level-for-the-first-time/

---

## P3 – drobne

### 9. Astra – rozstrzygnięcie „GPT-6 czy GPT-5”
- **Plik:** `astra-ma-pracowac-nad-problemami-godzinami-lub-dniami.md:3, 22, 34, 43`
- **Cytat:** „nie wiadomo jeszcze, czy trafi na rynek jako GPT-6 czy wariant GPT-5.”
- **Problem:** W dniu publikacji (2026-08-01) było to poprawne. Model wyszedł jako GPT-6 Astra: w API od 2026-09-03, w ChatGPT etapowo od 3–5 września. Notka pomoże czytelnikom trafiającym na ten tekst z wyszukiwarki.
- **Proponowana notka:** „Aktualizacja: Astra zadebiutowała we wrześniu 2026 r. jako GPT-6 Astra (API od 3 września).” Warto dodać link do newsów z 4 i 5 września.
- **Źródło:** baseline (https://developers.openai.com/api/docs/models)

### 10. GPT-5.6 Sol – w czerwcu był to ograniczony podgląd, nie premiera
- **Plik:** `gpt-56-sol-z-ograniczonym-startem.md:18, 42`
- **Cytat:** „OpenAI uruchomiło nowy flagowy model GPT-5.6 Sol.”
- **Problem:** Artykuł The Decoder z 2026-06-26 mówi o „limited preview” dla wybranych partnerów przez API i Codex. Szeroka premiera serii GPT-5.6 (Sol, Terra, Luna) odbyła się 2026-07-09. Przewaga nad Mythos 5 dotyczy przede wszystkim Terminal-Bench 2.1 (Sol 88,8%, Sol Ultra 91,9%, Mythos 5 88,0%), a nie „benchmarków programistycznych” ogólnie.
- **Proponowana poprawka:** „OpenAI udostępniło GPT-5.6 Sol w ograniczonym podglądzie wybranym partnerom (API i Codex). W Terminal-Bench 2.1 model uzyskał 88,8% wobec 88,0% dla Claude Mythos 5.” Notka: „Aktualizacja: szeroka premiera serii GPT-5.6 nastąpiła 9 lipca 2026 r.”
- **Źródła:** https://the-decoder.com/openais-claude-mythos-competitor-gpt-5-6-sol-launches-under-government-controlled-access-it-calls-unsustainable/, baseline

### 11. Fable 5 – notka o czasowym zawieszeniu
- **Plik:** `claude-fable-5-model-klasy-mythos.md:3, 17` (lead i pierwszy akapit)
- **Cytat:** „Anthropic udostępnił Claude Fable 5.”
- **Problem:** Fakty z premiery są zgodne ze źródłem: 10/50 USD, „mniej niż połowa” ceny Mythos Preview, przełączanie na Opus 4.8, mniej niż 5% sesji, Glasswing „we współpracy z rządem USA”. Sama strona Anthropic ma jednak dopisek o zawieszeniu 12 czerwca i przywróceniu 1 lipca. Warto dodać krótką notkę z odesłaniem do newsa z 13 czerwca.
- **Proponowana notka:** „Aktualizacja: od 12 czerwca do 1 lipca 2026 r. dostęp do Fable 5 i Mythos 5 był zawieszony na mocy dyrektywy Departamentu Handlu USA.” Aktualny następca to Fable 5.1 (baseline) – tego nie trzeba dopisywać, bo news jest migawką.
- **Źródło:** https://www.anthropic.com/news/claude-fable-5-mythos-5

### 12. Kimi K3 – wagi zostały opublikowane; nazwa firmy
- **Plik:** `kimi-k3-zbliza-sie-do-czolowki-modeli-zamknietych.md:18, 22`
- **Cytat:** „Kimi ogłosiło model K3…”, „Pełne wagi modelu mają zostać opublikowane do 27 lipca.”
- **Problem:** Twórcą modelu jest Moonshot AI (Kimi to marka). Wagi trafiły na Hugging Face 26 lipca (`moonshotai/Kimi-K3`), więc zapowiedź została spełniona. Na koniec warto dodać cenę z artykułu źródłowego: $3/$15 za 1 mln tokenów.
- **Proponowana poprawka:** „Moonshot AI (marka Kimi) ogłosiło model K3…”. Notka: „Aktualizacja: wagi K3 opublikowano na Hugging Face 26 lipca 2026 r.”
- **Źródła:** https://the-decoder.com/kimis-open-model-k3-nears-gpt-5-6-sol-and-fable-5-while-signaling-the-end-of-super-cheap-chinese-ai/, https://huggingface.co/moonshotai/Kimi-K3

### 13. MiniMax M3 – wagi i raport zostały opublikowane
- **Plik:** `minimax-m3-otwarty-model-milion-tokenow.md:30`
- **Cytat:** „Wagi i raport techniczny mają trafić do sieci w ciągu około dziesięciu dni…”
- **Problem:** Zapowiedź się spełniła: wagi pojawiły się na Hugging Face do 7 czerwca, a raport techniczny na arXiv 11 czerwca (źródła wtórne).
- **Proponowana notka:** „Aktualizacja: wagi M3 są dostępne na Hugging Face (MiniMaxAI/MiniMax-M3), a raport techniczny opublikowano 11 czerwca 2026 r.”
- **Źródło:** https://huggingface.co/MiniMaxAI/MiniMax-M3 (daty z wyników wyszukiwania – źródło wtórne)

### 14. Gemini 3.7 Flash – Gemini Spark niedostępny w Polsce; „GPT-5.x mini”
- **Plik:** `google-prezentuje-gemini-3-7-flash.md:22, 33, 42`
- **Cytat:** „…w usłudze Gemini Spark dla subskrybentów planów Pro i Ultra w ponad 160 krajach.”; „…w którym konkurują też GPT-5.x mini i Grok.”
- **Problem:** Wszystkie liczby (benchmarki, ceny, 13 sierpnia) zgadzają się z blogiem Google. Google wyłącza jednak z Gemini Spark Europejski Obszar Gospodarczy, Szwajcarię, Wielką Brytanię i Nigerię, a dla polskiego czytelnika to istotne. „GPT-5.x mini” to nieprecyzyjna nazwa – w sierpniu 2026 tanim modelem OpenAI był GPT-5.6 Luna.
- **Proponowana poprawka:** „…w Gemini Spark dla subskrybentów Google AI Pro i Ultra w ponad 160 krajach (bez EOG, w tym Polski, oraz Szwajcarii, Wielkiej Brytanii i Nigerii).” Zamiast „GPT-5.x mini” napisać „GPT-5.6 Luna”.
- **Źródło:** https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/

### 15. Nazwa sądu w sprawie Pentagonu
- **Plik:** `sad-umieszczenie-anthropic-na-czarnej-liscie-pentagonu-bylo-niekonstytucyjne.md:17, 25, 37`
- **Cytat:** „Kalifornijski sąd okręgowy wydał wyrok…”
- **Problem:** Wyrok wydał sąd federalny – U.S. District Court for the Northern District of California (sędzia Rita Lin). „Kalifornijski sąd okręgowy” brzmi jak sąd stanowy.
- **Proponowana poprawka:** „Federalny sąd okręgowy w Kalifornii (Northern District of California, sędzia Rita Lin) orzekł…”
- **Źródło:** https://www.cnn.com/2026/08/27/tech/anthropic-pentagon-supply-chain-risk-unlawful-hnk

### 16. Norwegia – „szkoły średnie” to w rzeczywistości klasy 8–10
- **Plik:** `norwegia-blokuje-generatywne-ai-w-szkolach-podstawowych.md:3, 18, 43`
- **Cytat:** „W szkołach średnich takie systemy będą dozwolone tylko pod nadzorem.”
- **Problem:** Źródło mówi o klasach 8–10 (uczniowie w wieku 14–16 lat, norweska ungdomsskole). W polskim systemie to nie „szkoła średnia” (liceum lub technikum), tylko odpowiednik starszych klas szkoły podstawowej.
- **Proponowana poprawka:** „W klasach 8–10 (uczniowie w wieku 14–16 lat) AI będzie dozwolona tylko pod nadzorem.”
- **Źródło:** https://the-decoder.com/norway-bans-generative-ai-tools-in-elementary-schools-to-protect-kids-basic-learning-skills/

### 17. Fundusz Economic Futures – data ogłoszenia (niezweryfikowane)
- **Plik:** `anthropic-przeznacza-200-milionow-dolarow-na-niezalezne-badania-nad-ekonomiczna.md:16`
- **Cytat:** „Anthropic ogłosiło uruchomienie nowej inicjatywy grantowej…”
- **Problem:** Strona źródłowa (`economic-futures-research-fund-agenda`) jest datowana na 2026-07-22, a news na 2026-08-26 i przedstawia fundusz jako świeżą nowość. Możliwe, że 26 sierpnia opublikowano dopiero agendę badawczą. Tego nie udało się jednoznacznie ustalić. Nazwa funduszu i kwota 200 mln USD się zgadzają.
- **Proponowana poprawka:** sprawdzić datę. Jeśli fundusz ogłoszono 22 lipca, zmienić na: „Anthropic opublikowało agendę badawczą ogłoszonego w lipcu funduszu Anthropic Economic Futures Research Fund (200 mln USD)…”
- **Źródło:** https://www.anthropic.com/news/economic-futures-research-fund-agenda

### 18. Claude pisze kod Anthropic – brak zastrzeżenia do liczby „8 razy”
- **Plik:** `claude-pisze-juz-wiekszosc-kodu-anthropic.md:17, 43`
- **Cytat:** „Inżynierowie dostarczają osiem razy więcej kodu dziennie niż w 2024 roku.”; „…drastycznie zwiększył tempo pracy inżynierów.”
- **Problem:** Liczba „ponad 80% kodu produkcyjnego” jest poprawna (ponad 90% to szacunek dla całego kodu, łącznie ze skryptami). Samo Anthropic zastrzega jednak, że wzrost ośmiokrotny „is almost certainly an overstatement”, a ankiety pracowników wskazują raczej na ok. 4-krotny wzrost produktywności. News pomija to zastrzeżenie.
- **Proponowana poprawka:** dopisać: „Anthropic sam zastrzega, że ośmiokrotny wzrost niemal na pewno zawyża realny przyrost produktywności – ankiety wśród pracowników wskazują raczej na czterokrotny.” Opcjonalnie w linii 17: „ponad 80 proc. kodu produkcyjnego (a według szacunku kierownictwa ponad 90 proc. całego kodu)”.
- **Źródło:** https://the-decoder.com/anthropic-says-claude-now-writes-over-90-of-its-code-and-wants-the-world-to-have-an-ai-pause-button/

---

## Weryfikacja – które newsy faktycznie sprawdziłem

### Sprawdzone względem źródła (WebFetch/WebSearch)
| Data | Plik | Wynik |
|---|---|---|
| 09-19 | gemini-uzyskal-dostep-do-trzech-firm-przez-blad-srodowiska-testowego.md | OK (Irregular, trzy firmy, OpenAI/Anthropic/Meta) |
| 09-07 | claude-i-nieautoryzowany-dostep-do-systemow.md | P2 (punkt 7) |
| 09-05 | openai-wdraza-gpt-6-astra-dla-najwyzszych-planow-chatgpt-ze-znacznie-nizszymi.md | OK (Pro, Enterprise, Business Premium; 5–45 wobec 10–100; Astra Pro; bez Free i Go) |
| 09-04 | problemy-z-wdrozeniem-gpt-6-astra-sam-altman-przeprasza-placacych-uzytkownikow.md | OK (Daybreak, przeprosiny; The Verge blokuje pobieranie – potwierdzone w źródłach wtórnych) |
| 08-31 | claude-i-claude-code-diametralnie-roznia-sie-w-przeszukiwaniu-sieci.md | OK (93/13%, 20%, 75/5%, 60/4%, 322/459 słów, 11%) |
| 08-30 | sony-music-i-warner-pozywaja-anthropic-o-naruszenie-praw-autorskich.md | P1 (punkt 1) |
| 08-29 | model-hardware-standard-anthropic-tworzy-uniwersalny-interfejs-dla-urzadzen.md | fakty OK, plik obcięty – P1 (punkt 3) |
| 08-28 | sad-umieszczenie-anthropic-na-czarnej-liscie-pentagonu-bylo-niekonstytucyjne.md | P1 i P3 (punkty 2 i 15) |
| 08-26 | anthropic-przeznacza-200-milionow-dolarow-na-niezalezne-badania-nad-ekonomiczna.md | kwota OK, data – P3 (punkt 17) |
| 08-15 | anthropic-szykuje-api-do-wykrywania-tekstow-claudea.md | OK (SynthID Text, ograniczenia) |
| 08-14 | google-prezentuje-gemini-3-7-flash.md | liczby OK, P3 (punkt 14) |
| 08-13 | xai-wydaje-grok-4-6.md | liczby OK, P2 – nazwa dostawcy (punkt 4) |
| 08-08 | astra-podnosi-alarm-w-cyberbezpieczenstwie.md | P2 (punkt 8) |
| 08-01 | astra-ma-pracowac-nad-problemami-godzinami-lub-dniami.md | P3 – notka (punkt 9) |
| 07-22 | openai-testowany-model-przebil-sie-do-hugging-face.md | OK (GPT-5.6 Sol i model przedpremierowy; źródła wtórne – The Verge blokuje) |
| 07-17 | kimi-k3-zbliza-sie-do-czolowki-modeli-zamknietych.md | OK, P3 (punkt 12) |
| 07-04 | anthropic-wypuszcza-claude-sonnet-5.md | P2 (punkt 5) |
| 06-27 | gpt-56-sol-z-ograniczonym-startem.md | P3 (punkt 10) |
| 06-20 | norwegia-blokuje-generatywne-ai-w-szkolach-podstawowych.md | P3 (punkt 16) |
| 06-13 | anthropic-wylacza-fable-i-mythos-po-decyzji-administracji.md | P2 (punkt 6) |
| 06-09 | claude-fable-5-model-klasy-mythos.md | cena, Glasswing, <5%, Stripe – OK; P3 (punkt 11) |
| 06-05 | claude-pisze-juz-wiekszosc-kodu-anthropic.md | 80% OK, P3 (punkt 18) |
| 06-02 | gemini-3-5-flash-agentowy-model-google.md | OK (76,2 / 83,6 / 84,2 / 1656 Elo, 4x, dostępność; cena zgodna z baseline) |
| 06-01 | minimax-m3-otwarty-model-milion-tokenow.md | P3 (punkt 13); wyniki benchmarków niezweryfikowane |

### Przeczytane i porównane z baseline, bez weryfikacji źródła (niezweryfikowane)
- `perplexity-szerzej-ufa-gpt-6-astra.md` (09-12) – openai.com zwraca 403; w treści brak liczb do sprawdzenia, nazwa GPT-6 Astra zgodna z baseline.
- `gemini-trafia-na-windows.md` (09-11), `gpt-56-sol-wspiera-autonomiczne-eksperymenty-kwantowe.md` (09-09), `chatgpt-i-reddit-pod-najsurowszymi-unijnymi-regulami-bezpieczenstwa.md` (09-01), `openai-wdraza-obsluge-webmcp-w-desktopowej-przegladarce-chatgpt.md` (08-27), `piec-warstw-full-stack-ai-wedlug-inzynierow-google-deepmind.md` (08-22), `openai-odrabia-straty-do-anthropic-w-segmencie-biznesowym-klienci-korporacyjni.md` (08-21), `mico-znika-z-glosu-copilota.md` (08-14), `chatgpt-trafia-na-linuksa.md` (08-12), `jeff-dean-odchodzi-z-google-do-nowego-startupu-ai.md` (08-06), `snap-i-linkedin-zaostrzaja-walke-z-ai-slopem.md` (08-02), `chatgpt-znacznie-czesciej-cytuje-przy-pytaniach-o-podroze.md` (07-28), `udostepnione-rozmowy-z-claude-trafily-do-wynikow-wyszukiwania.md` (07-27), `usa-sklaniaja-sie-ku-selektywnym-blokadom-chinskich-modeli.md` (07-26), `pozew-apple-a-sprzetowe-ambicje-openai.md` (07-20), `pozew-zbiorowy-wokol-ksiazek-uzytych-do-trenowania-gemini.md` (07-18), `agenci-w-firmach-na-razie-czesciej-chatboty-niz-orkiestracja.md` (07-16), `waze-rozszerza-funkcje-ai-z-udzialem-gemini.md` (07-13), `badanie-z-cambridge-chatboty-ai-wykorzystywane-do-planowania-atakow.md` (07-12), `deepseek-chce-projektowac-wlasne-uklady.md` (07-08), `brockman-przyszlosc-ai-to-niemal-brak-interfejsu.md` (07-05), `openrouter-z-routera-w-platforme-ai.md` (07-04 – strona ogłoszeń potwierdza tylko wpis o Fusion z 2026-06-12; kwota Series B, Image API i porównanie z GPT-5.5/Opus 4.8 niezweryfikowane), `chatgpt-moze-zmierzac-w-strone-reklam-obrazowych-i-wideo.md` (07-02), `claude-trafia-do-slacka-jako-wspolpracownik.md` (06-24), `samsung-wdraza-chatgpt-i-codex-dla-pracownikow.md` (06-22), `anthropic-porzadkuje-swoje-podejscie-do-bezpieczenstwa-ai.md` (06-16), `falszywe-studia-przypadkow-w-raporcie-o-ai.md` (06-14), `serwisy-newsowe-mocniej-odcinaja-boty-ai.md` (06-10), `pozew-po-niewykryciu-broni-przez-system-ai.md` (06-08).
- W żadnym z nich nie znalazłem czerwonych flag z baseline: brak błędnych nazw modeli, brak „GPT-6 Terra”, „Gemini 3.5 Pro wydany”, „Qwen4” i podobnych.

### Newsy z 20 najnowszych bez modeli AI – przejrzane pobieżnie, bez zastrzeżeń
`rywalizacja-z-chinami-moze-utrudnic-wspolprace-nad-bezpieczenstwem-ai.md` (09-24), `badanie-krytycznie-ocenia-google-ai-mode.md` (09-22), `tworcy-symulatorow-swiata-niewiele-zdradzaja.md` (09-21), `anthropic-zapowiada-program-weryfikacji-dla-nauk-o-zyciu.md` (09-18), `apple-ma-rozwijac-serwer-ai-z-ukladami-m-series-ultra.md` (09-17), `openai-ma-przejac-glass-imaging-za-300-mln-dolarow.md` (09-15), `openai-chce-wolniejszego-tempa-ale-nie-rezygnuje-z-postepu.md` (09-14), `ai-centra-danych-a-slabsza-ochrona-srodowiska.md` (09-13), `koszt-ai-na-pracownika-spadl-niemal-o-10-proc.md` (09-10), `seattle-times-i-newsday-pozywaja-openai-oraz-microsoft-za-trenowanie-ai-na-ich.md` (09-06) – treść ogólna, bez twierdzeń o modelach; źródeł nie sprawdzałem.

### Uwaga formalna (poza zakresem)
Część plików ma `date:` bez cudzysłowu (np. `claude-i-nieautoryzowany-dostep-do-systemow.md`, `sony-music-...`, `sad-...`, `anthropic-przeznacza-...`), a część w cudzysłowie. Jeśli schemat Astro używa `z.coerce.date()`, nie ma to znaczenia. Wspominam, bo przy sortowaniu dat skryptami te dwa formaty sortowały się osobno.
