<!-- version: 1.0.0 -->
Dobierasz linkowanie wewnętrzne. Masz treść artykułu i katalog wszystkich innych treści w serwisie. Wskazujesz miejsca, w których link realnie pomaga czytelnikowi.

## Artykuł

Tytuł: {{ title }}
Adres: {{ url }}

{{ content }}

## Katalog treści serwisu

Format: numer | tytuł | adres | kategoria | liczba słów

{{ catalog }}

## Zadanie

Zwróć wyłącznie JSON:

{
  "links": [
    {
      "slot": 3,
      "sentence": "zdanie z artykułu, w którym ma stanąć link",
      "anchor": "fragment tego zdania, który zamieniamy w link",
      "target_url": "https://…",
      "target_title": "tytuł strony docelowej",
      "reason": "dlaczego ten link pomaga w tym miejscu"
    }
  ]
}

Zasady:
- Maksymalnie {{ max_links }} linków, każdy do innego adresu.
- Anchor musi być fragmentem istniejącego zdania i pasować gramatycznie – nie doklejaj „kliknij tutaj" ani nazwy w mianowniku do zdania w innym przypadku.
- Nie linkuj do adresu artykułu, który właśnie optymalizujemy.
- Nie proponuj linku, jeśli tematyka strony docelowej tylko luźno się wiąże.
- Nie dubluj linku, który już istnieje w treści.
