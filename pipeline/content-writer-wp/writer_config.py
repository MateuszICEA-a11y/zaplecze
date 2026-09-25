"""Konfiguracja pipeline'u Content Writera (nowe artykuły dla grupa-icea.pl).

Nazwa `writer_config`, nie `config`: katalog content-refresher jest na
sys.path przed tym katalogiem i jego moduły robią `from config import …`.
"""
PIPELINE_VERSION = "1.0.0"

# Lustro dashboard/app/cw-writer.js (MAX_OUTLINE, MAX_FAQ) – brief po
# poprawkach redaktora jest tam przycinany do tych samych limitów, a test
# test_limity_lustrem_workera pilnuje zgodności.
MAX_OUTLINE = 15
MAX_FAQ = 8

# Ile tytułów istniejących wpisów pokazujemy przy briefie – żeby nowy tekst
# nie powielał artykułu, który już jest (kanibalizacja).
RELATED_ARTICLES = 15

# Reguły dopisane do EDITORIAL_RULES z content-refresher – dotyczą tylko
# pisania od zera.
WRITER_RULES = """Pisanie nowego artykułu dla bloga agencji (grupa-icea.pl):
- W treści nie ma linków zewnętrznych ani przypisów – źródła trafią na koniec
  wpisu osobnym krokiem, jako lista.
- Nie wstawiaj linków wewnętrznych – dobierze je osobny krok z katalogu serwisu.
- Nie cytuj ekspertów ani osób z zespołu – cytat eksperta dodaje redaktor.
- Nie reklamuj oferty agencji i nie wstawiaj wezwań do kontaktu – blok CTA
  dodaje redaktor. Wzmianka o marce, jeśli potrzebna, to apozycja w mianowniku:
  „iCEA, agencja specjalizująca się w…”, nigdy półpauza z dopełniaczem.
- Liczby, daty, nazwy narzędzi i cytaty wolno podać wyłącznie wtedy, gdy stoją
  w dostarczonym materiale. Jeśli konkret by się przydał, a go nie ma – napisz
  zdanie ogólniej albo dopisz brak do `unsupported`. Zmyślona liczba jest gorsza
  niż jej brak."""
