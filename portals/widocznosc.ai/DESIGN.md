---
version: alpha
name: widocznosc-ai-instrument
description: >
  System projektowy widocznosc.ai w kierunku „instrument pomiarowy”, zbudowany na
  szkielecie zdjętym z browser-use.com (tokeny wyliczone z DOM-u, 2026-09-03) i
  przestrojony na naszą markę. Płótno to niemal czarny grafit, przełamany wyłącznie
  jednym kolorem akcentu. Nagłówki – wysokokontrastowa antykwa z kursywą jako
  akcentem retorycznym. Cały chrom interfejsu (nawigacja, etykiety, opisy osi,
  przypisy, badge'y) – monospace. Sans służy wyłącznie do tekstu ciągłego.
  Efekt ma być bliższy przyrządowi pomiarowemu niż stronie agencji: żadnych
  gradientów, poświat, cieni ani zaokrągleń większych niż 4 px.

colors:
  # akcent – JEDYNY kolor marki (browser-use ma tu #fe750e; my zostajemy przy swoim)
  primary: "#5768ff"
  on-primary: "#09090b"
  primary-soft: "rgba(87, 104, 255, 0.16)"

  # płótno i powierzchnie
  canvas: "#0a0a0a"
  canvas-deep: "#09090b"
  canvas-soft: "#131313"
  surface-raised: "#22222a"
  surface-tint: "rgba(255, 255, 255, 0.016)"
  surface-tint-strong: "rgba(255, 255, 255, 0.06)"

  # tekst
  ink: "#fafafa"
  ink-pure: "#ffffff"
  body: "#a1a1aa"
  mute: "#71717a"
  faint: "#52525b"
  chrome: "rgba(255, 255, 255, 0.5)"

  # linie
  hairline: "#27272a"
  hairline-soft: "rgba(255, 255, 255, 0.08)"

  # semantyczne – wyłącznie do oznaczania wyników, nigdy dekoracyjnie
  ok: "#4ade80"
  warn: "#fbbf24"
  bad: "#f87171"

typography:
  # ANTYKWA – tylko nagłówki. Fraunces (OFL) zamiast Playfair: ma oś opsz i grubszy
  # dolny kontrast, dzięki czemu nie robi się „ślubnego zaproszenia” w dużych stopniach.
  display-xl:
    fontFamily: Fraunces, "Playfair Display", Georgia, serif
    fontSize: 88px
    fontWeight: 400
    lineHeight: 86.24px
    letterSpacing: -2.64px
  display-lg:
    fontFamily: Fraunces, "Playfair Display", Georgia, serif
    fontSize: 68px
    fontWeight: 400
    lineHeight: 70.72px
    letterSpacing: -1.768px
  display-lg-italic:
    fontFamily: Fraunces, "Playfair Display", Georgia, serif
    fontSize: 68px
    fontStyle: italic
    fontWeight: 400
    lineHeight: 70.72px
    letterSpacing: -1.768px
    note: kursywa niesie akcent znaczeniowy, nie ozdobę – padają na nią 1–2 słowa tezy
  title:
    fontFamily: Fraunces, "Playfair Display", Georgia, serif
    fontSize: 52px
    fontWeight: 400
    lineHeight: 55.12px
    letterSpacing: -1.144px
  subtitle:
    fontFamily: Fraunces, "Playfair Display", Georgia, serif
    fontSize: 20px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: -0.4px

  # SANS – tekst ciągły. Geist (MIT) lub obecny Inter; nie mieszać obu.
  lead:
    fontFamily: Geist, Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 27px
    letterSpacing: -0.09px
    maxWidth: 34ch
  body-md:
    fontFamily: Geist, Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-sm:
    fontFamily: Geist, Inter, system-ui, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22px

  # MONO – cały chrom interfejsu. To jest sygnatura stylu, nie detal.
  mono-label:
    fontFamily: "Geist Mono", "JetBrains Mono", ui-monospace, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
  mono-chrome:
    fontFamily: "Geist Mono", "JetBrains Mono", ui-monospace, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    color: "rgba(255, 255, 255, 0.5)"
    note: nawigacja, przypisy pod wykresami, statusy
  mono-micro:
    fontFamily: "Geist Mono", "JetBrains Mono", ui-monospace, monospace
    fontSize: 10px
    fontWeight: 400
    lineHeight: 14px
    note: opisy osi wykresów, jednostki

geometry:
  radius: 4px
  radius-max: 4px
  border: 1px solid "#27272a"
  shadow: none
  gradient: none
  container: 1440px
  gutter: 32px

spacing:
  scale: [4, 8, 14, 20, 32, 48, 80, 128]
  section-gap: 128px
  card-padding: 14px
  card-padding-lg: 20px
---

# widocznosc.ai – system projektowy „instrument”

## 1. Nastrój

Strona ma sprawiać wrażenie **przyrządu, nie folderu reklamowego**. Nie sprzedajemy
obietnicy, tylko pomiar. Stąd trzy decyzje, które trzymają całość:

1. Chrom interfejsu jest w monospace. Podpis pod wykresem wygląda jak wydruk z aparatury.
2. Nagłówki są w antykwie o wysokim kontraście. Robi to napięcie: „redakcja” obok „terminala”.
3. Akcent pojawia się rzadko – na CTA, na jednej serii danych, na aktywnej pozycji przełącznika.
   Jeśli na ekranie jest więcej niż trzy niebieskie plamy, jedna jest za dużo.

## 2. Kolor

- Płótno `#0a0a0a`, karty `#131313`, uniesione powierzchnie `#22222a`.
- Wszystko poza akcentem żyje w skali szarości. Bez wyjątków dekoracyjnych.
- Zieleń, bursztyn i czerwień **wyłącznie** jako ocena wyniku (dobry / do poprawy / zły).
  Nigdy jako „kolor sekcji” czy „kolor kafla”.
- Podświetlenia karty na hoverze: podbicie tła o `rgba(255,255,255,0.016)` → `0.06`.
  Żadnych obramowań w kolorze akcentu.

## 3. Typografia

Trzy rodziny, sztywny podział ról – to jedyna reguła, której nie wolno naginać:

| Rodzina | Do czego | Czego nigdy |
|---|---|---|
| Fraunces (antykwa) | h1, h2, h3, liczby w kafelkach statystyk | tekstu ciągłego, przycisków |
| Geist / Inter (sans) | akapity, listy, lead | nagłówków, etykiet, opisów osi |
| Geist Mono | nawigacja, badge'y, statusy, opisy osi, przypisy, ceny jednostkowe | tekstu ciągłego |

- Lead pod h1 ma twardy limit `34ch`. Dłuższy zamienia hero w ulotkę.
- Nagłówki łamiemy ręcznie, przez `<span>` w osobnych wierszach – nie zdajemy się na `text-wrap`.
- Kursywą wyróżniamy 1–2 słowa niosące tezę, nigdy całą linię.
- Wersaliki: tylko `mono-micro` przy jednostkach. Bez `text-transform: uppercase` w nagłówkach.

## 4. Komponenty

**Przycisk główny** – prostokąt, `radius: 4px`, tło `--primary`, tekst `--on-primary`,
`padding: 14px 20px`, sans 16/24. Bez cienia, bez obramowania, bez ikony.

**Przycisk drugorzędny** – to samo, ale tło `transparent`, obramowanie `1px #27272a`,
tekst `--ink`.

**Karta** – `background: rgba(255,255,255,0.016)`, `border: 1px solid #27272a`,
`radius: 4px`, `padding: 14px` (20 px dla kart wiodących). Nagłówek karty w antykwie 20/28,
etykieta stanu w monospace 12 px po prawej.

**Kafel danych** – liczba w antykwie, podpis pod nią w `mono-micro` kolorem `--mute`.
Nigdy odwrotnie.

**Wykres** – seria marki w kolorze akcentu, wszystkie pozostałe w `--faint`. Opisy osi i
etykiety punktów w monospace. Pod wykresem obowiązkowy jednowierszowy przypis w formacie:
`<liczebność próby> · <sposób pomiaru> · metodologia` – z „metodologia” jako jedynym linkiem.

**Nawigacja** – pozycje w `mono-chrome`, małą literą, bez podkreśleń. Rozwijane menu to
nie lista linków, tylko siatka kafli ze stanem (liczba, status, wersja).

**Przełącznik `człowiek / maszyna`** – przyklejony do prawego dolnego rogu, ponad treścią.
Ramka `1px #27272a`, tło `--canvas-soft`, dwie pozycje w monospace 12 px, aktywna z
kwadratowym znacznikiem w kolorze akcentu i pełną bielą tekstu, nieaktywna w `--chrome`.
Przełącza całą stronę na jej wersję markdown z przyciskiem `Kopiuj stronę` w prawym górnym rogu.

## 5. Układ

- Sekcje oddzielone 128 px, bez separatorów graficznych. Oddycha sam odstęp.
- Hero: nagłówek i lead wyśrodkowane, CTA obok siebie, pod nimi pas logotypów zaufania
  z etykietą w `mono-chrome`.
- Każda sekcja „dlaczego my” musi mieć pod tezą **wykres albo liczbę z metodologią**.
  Sekcja z samymi kartami korzyści jest w tym systemie zabroniona.
- Maksymalnie jeden pas z animacją na ekran.

## 6. Do's and Don'ts

**Rób:**
- Trzymaj akcent na maksymalnie trzech elementach w widoku.
- Podpisuj każdą liczbę źródłem i próbą.
- Zostaw duże puste pola wokół hero – ciemne płótno jest częścią kompozycji.
- Łam nagłówki ręcznie i sprawdzaj je na 360 px.

**Nie rób:**
- Gradientów, poświat, `box-shadow`, `border-radius` powyżej 4 px.
- Ikon w przyciskach i kolorowych ikonek w kartach.
- Drugiego koloru akcentu „dla ożywienia”.
- Sansa w nagłówkach ani monospace'u w akapitach.
- Sekcji z trzema kaflami korzyści bez ani jednej liczby.

## 7. Responsywność

- `>= 1280px` – pełna skala, `display-xl` 88 px.
- `768–1279px` – `display-xl` → 64 px, `title` → 40 px, siatki kart 3 kol. → 2 kol.
- `< 768px` – `display-xl` → 40 px, `title` → 28 px, jedna kolumna, przełącznik
  `człowiek / maszyna` zwęża się do samych znaczników bez etykiet, wykresy przewijane poziomo
  z zachowanym przypisem pod spodem.

## 8. Prompt dla agenta

> Zbuduj sekcję zgodnie z DESIGN.md widocznosc.ai. Płótno #0a0a0a, jeden akcent #5768ff
> użyty maksymalnie trzy razy. Nagłówki w Fraunces z ujemnym trackingiem, tekst ciągły
> w Geist, cały chrom (etykiety, statusy, opisy osi, przypisy) w Geist Mono 12 px kolorem
> rgba(255,255,255,0.5). Promień 4 px, obramowania 1px #27272a, zero cieni i gradientów.
> Każda teza marketingowa musi mieć pod sobą liczbę z przypisem o metodologii.

---

Źródło szkieletu: tokeny wyliczone z DOM-u browser-use.com (2026-09-03).
Format pliku wg konwencji github.com/voltagent/awesome-design-md (MIT).
