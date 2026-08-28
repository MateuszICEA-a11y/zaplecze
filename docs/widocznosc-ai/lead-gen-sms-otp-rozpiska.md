# Bramka SMS na narzędziach widocznosc.ai – co zrobiliśmy i jak to działa

Notatka robocza, stan na 2026-06-22.

## Po co to w ogóle jest

Narzędzia w `/narzedzia/` (brand-check, url-check, fan-out, ai-bots-check) liczyły wynik dla każdego, kto wszedł i kliknął „Sprawdź". Chcieliśmy z tego wyciągać leady i jednocześnie odciąć boty oraz przypadkowe klikanie, które kosztuje nas realne pieniądze (zapytania do modeli AI).

Pomysł: zanim pokażemy wynik najdroższych narzędzi, user zostawia dane i potwierdza numer telefonu kodem z SMS-a. Dzięki temu mamy prawdziwy kontakt (zweryfikowany numer), a do ICEA leci lead z kompletem danych.

## Co zbudowaliśmy

- **Dwa endpointy SMS** – `/api/sms/send-code` (wysyła kod i zakłada „sesję weryfikacji") oraz `/api/sms/verify-code` (sprawdza kod).
- **Wspólny formularz** `ReportLeadForm.astro` – imię, nazwisko, e-mail, telefon, zgoda RODO. Działa w dwóch trybach (o tym niżej).
- **Rejestracja leada** – `/api/tools/send-report` zapisuje kontakt i wysyła powiadomienie do ICEA plus kopię raportu na maila usera.
- **Dostawca SMS** – SMSAPI.pl, cienki klient w `functions/_lib/smsapi.ts`.
- **Stan w Cloudflare KV** – sesje weryfikacji i liczniki limitów trzymamy w tym samym bindingu KV co rate-limity narzędzi (`FANOUT_RL`).
- **Polityka prywatności** – dopisaliśmy przetwarzanie numeru telefonu i wysyłkę SMS.

## Jak to działa od strony usera (tryb bramki)

Dotyczy brand-check i url-check:

1. User wpisuje markę albo adres i klika „Sprawdź".
2. Zamiast liczyć, pokazujemy formularz: zostaw dane, żeby zobaczyć wynik.
3. User wypełnia pola i klika „Wyślij kod SMS". Na telefon przychodzi 6-cyfrowy kod, ważny 10 minut.
4. User wpisuje kod i potwierdza.
5. Dopiero teraz rusza analiza. Wynik pojawia się na ekranie, a do ICEA idzie lead z danymi kontaktowymi.

Kluczowe: drogie zapytanie do modeli AI **nie odpala się**, dopóki kod nie zostanie poprawnie wpisany.

## Dwa tryby formularza – i dlaczego nie wszędzie jest bramka

Formularz ma dwa tryby. To świadoma decyzja, nie niedoróbka:

- **Bramka** (brand-check, url-check) – najpierw kod, potem analiza. Tu trzymamy najdroższe wywołania LLM, więc chcemy mieć pewność, że liczymy tylko dla zweryfikowanego leada.
- **Raport na maila** (fan-out, ai-bots-check) – wynik liczy się od razu po kliknięciu, a SMS służy tylko do wysłania kopii raportu na e-mail. Fan-out zostaje przy starym zachowaniu (pilnuje go limit 5 na IP na dobę), a ai-bots-check jest tani (sprawdza dostęp botów po HTTP, bez modeli), więc nie ma sensu go bramkować.

## Jak to działa pod spodem

- **Kod nie leży nigdzie jawnie.** W KV trzymamy tylko jego skrót: SHA-256 z kodu i sekretnego „solenia" (`OTP_SALT`). Porównujemy skróty, nie kody.
- **Sesja weryfikacji (challenge)** ma swój identyfikator, numer, skrót kodu, licznik prób, znacznik „potwierdzony" i czas ważności (10 minut). Po potwierdzeniu i wykorzystaniu jest kasowana – jeden kod = jedno użycie.
- **Próby** – maksymalnie 5 błędnych podejść do jednego kodu. Potem trzeba zamówić nowy.
- **Nadawca SMS** nie jest zaszyty w kodzie. Bierzemy go ze zmiennej `SMSAPI_SENDER` w Cloudflare Pages.
- **Treść SMS-a** jest celowo prosta i bez linku (o tym w sekcji o błędach).

## Co nas chroni przed nabiciem kosztów

Kredyt SMSAPI pali się tylko w jednym miejscu – przy realnej wysyłce kodu. Zanim do niej dojdzie, żądanie przechodzi przez kilka bramek:

- **Honeypot** – ukryte pole w formularzu. Jak bot je wypełni, dostaje fałszywy sukces i nic nie wysyłamy.
- **Walidacja numeru** – musi być poprawny polski numer komórkowy. Stacjonarny albo śmieć odpada przed wysyłką.
- **Limity wysyłki** – 60 sekund przerwy między kodami na ten sam numer, 3 kody na godzinę na numer, 10 na dobę na jedno IP i twardy sufit 30 na dobę globalnie (bezpiecznik kosztowy). Wartości da się zmienić przez zmienne środowiskowe.
- **Weryfikacja niczego nie wysyła** – sprawdzanie kodu jest darmowe, SMS leci tylko przy „Wyślij kod".

## Błędy, na które wpadliśmy po drodze

- **SMSAPI odrzucał wiadomości – błąd 94.** Okazało się, że SMSAPI blokuje treści, w których jest link albo coś, co wygląda jak domena. Najpierw chcieliśmy wrzucić adres do SMS-a – nie przechodziło. Rozwiązanie: treść bez żadnego URL-a i w czystym ASCII (stąd „Wazny" bez „ż"), żeby zmieścić się w taniej wiadomości i nie podpaść filtrowi.

- **Konflikt z Astro ClientRouter.** Po kliknięciu w formularzu strona zamiast wysłać dane robiła swoją wewnętrzną „nawigację" pod adres z danymi doklejonymi do URL-a (`?firstName=...&code=...`), a okienko bramki w ogóle się nie pokazywało. ClientRouter przechwytywał zdarzenie szybciej, niż nasz kod zdążył je zatrzymać. Naprawiliśmy to, łapiąc kliknięcie wcześniej (w fazie „capture") i twardo blokując domyślną akcję, zanim ClientRouter ją podejmie. Przy okazji zniknął problem z danymi lądującymi w adresie.

- **„Weryfikacja SMS chwilowo niedostępna".** To była niekompletna konfiguracja – brakowało któregoś z ustawień (token, nadawca, sól, KV). Na czas diagnozy dorzuciliśmy szczegółowe komunikaty, namierzyliśmy braki, a potem diagnostykę sprzątnęliśmy, żeby nie wyciekały szczegóły konfiguracji.

- **Wynik i błędy poza ekranem.** Po weryfikacji wynik renderował się niżej, niż user akurat patrzył. Dodaliśmy automatyczne przewijanie do sekcji z wynikiem.

- **Pola formularza bez widocznych etykiet.** Z początku pola miały tylko podpowiedzi w środku. Dodaliśmy normalne, widoczne etykiety (Imię, Nazwisko, E-mail, Telefon).

- **Narzędzia „gadały do siebie".** Mechanizm, który po weryfikacji uruchamia analizę, na początku potrafił złapać zdarzenie z innego narzędzia na stronie. Naprawiliśmy to filtrem (każde narzędzie reaguje tylko na swoje zdarzenie) i pilnowaniem, żeby uruchomić właściwą, aktualną wersję funkcji liczącej.

## Co jeszcze zostało do ogarnięcia

- **Ustawić nadawcę na „ICEA".** Mamy już zweryfikowane pole nadawcy w SMSAPI, więc trzeba wpisać `SMSAPI_SENDER=ICEA` w Cloudflare Pages (Production i Preview) i przepuścić nowy deploy, żeby weszło w życie.
- **Sprawdzić, czy `SMSAPI_TEST` nie jest ustawione na `1` na produkcji** – w trybie testowym SMSAPI nie pobiera kredytów, ale też nic realnie nie wysyła.
- **Wymienić token SMSAPI** (rotacja po testach).
- **Test na żywym numerze** – pełne przejście od wpisania marki po wynik i maila.
