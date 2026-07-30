"""Konfiguracja pipeline'u reoptymalizacji treści.

Wersje są częścią wyniku: każdy krok zapisuje `PIPELINE_VERSION` i wersję
promptu, żeby dało się odtworzyć, dlaczego dwa przejazdy tego samego wpisu dały
różne propozycje.
"""

PIPELINE_VERSION = "1.0.0"

# Kolejność kroków. `gaps`, `expert`, `sources`, `internal_links` są opcjonalne
# i zależą od pakietu ulepszeń wybranego w dashboardzie.
STEPS = [
    "fetch",
    "keywords_own",
    "serp",
    "competitors",
    "keywords_competitors",
    "brief",
    "rewrite",
    "expert",
    "sources",
    "internal_links",
    "diff",
]

OPTIONAL_STEPS = {
    "rewrite": "gaps",
    "expert": "expert",
    "sources": "sources",
    "internal_links": "internal_links",
}

# --- modele ---
# Research i szukanie źródeł wymagają dostępu do sieci; przepisywanie treści
# jest zadaniem językowym, więc model dobrany pod polszczyznę.
MODEL_RESEARCH = "perplexity/sonar-pro"
MODEL_WRITER = "anthropic/claude-sonnet-5"
MODEL_FALLBACK = "google/gemini-3-flash-preview"

# --- budżety (twarde, sprawdzane przed krokiem) ---
# Frazy pochodzą z Senuto (rozliczane abonamentem, nie jednostkami), więc jedynym
# limitowanym zasobem researchu jest odpytanie żywego SERP-u przez SerpData.
BUDGET_SERP_REQUESTS_PER_JOB = 2
BUDGET_TOKENS_PER_JOB = 400_000
COMPETITOR_LIMIT = 5
COMPETITOR_KEYWORDS_LIMIT = 60
# Frazy konkurentów bierzemy z pozycjami: dalej niż druga strona wyników fraza
# rzadko opisuje temat strony, a przy 300 frazach z adresu i tak nic więcej nie
# wnosi. Lustro KEYWORDS_PAGES / RIVAL_POSITION_MAX z dashboard/app/cw-serp.js.
COMPETITOR_KEYWORDS_PAGES = 3
COMPETITOR_POSITION_MAX = 20
OWN_KEYWORDS_LIMIT = 50

# --- Senuto ---
# Baza Słów Kluczowych nie obsługuje bazy 2.0 (country_id 200) – tam jest „1".
# Analiza Widoczności odwrotnie: 200 to baza znana z aplikacji.
SENUTO_KEYWORDS_COUNTRY_ID = 1
SENUTO_POSITIONS_COUNTRY_ID = 200

# --- SerpData ---
SERPDATA_TIMEOUT_S = 120  # pojedyncze zapytanie potrafi iść 30–45 s

# --- pobieranie stron konkurencji ---
FETCH_TIMEOUT_S = 15
FETCH_MAX_BYTES = 2 * 1024 * 1024
FETCH_MAX_REDIRECTS = 3
# Wyłącznie ASCII: nagłówki HTTP idą jako latin-1, a polskie znaki w User-Agencie
# wywalały każde pobranie strony konkurencji wyjątkiem kodowania.
USER_AGENT = (
    "ICEA-ContentWatcher/1.0 (+https://www.grupa-icea.pl; analiza SERP na potrzeby "
    "reoptymalizacji wlasnych tresci)"
)

# --- struktura ACF ---
ACF_SLOTS = 30
SLOT_TITLE = "page_title_h2_{n}"
SLOT_TEXT = "page_text_{n}"

# Reguły redakcyjne wspólne dla wszystkich promptów piszących.
EDITORIAL_RULES = """Zasady redakcyjne, których musisz przestrzegać:
- Półpauza (–), nigdy myślnik em (—).
- Przed listą stawiaj dwukropek, nie półpauzę.
- W listach nie stosuj wzorca „**Pogrubienie:** opis" – pisz „**Termin** – opis".
- Anchor linku ma być zgodny gramatycznie ze zdaniem, w którym stoi.
- Nie obiecuj efektów, których nie da się potwierdzić danymi.
- Zachowaj polską interpunkcję i pełne znaki diakrytyczne.
- Nie zmieniaj sensu zdań, które są poprawne merytorycznie.

Frazy kluczowe – tak się ich używa:
- Odmieniaj je zgodnie ze zdaniem. „zlecę pozycjonowanie" ma prawo wystąpić jako
  „zlecając pozycjonowanie" czy „zlecenie pozycjonowania" – liczy się naturalne
  polskie zdanie, nie dosłowny zapis frazy.
- Nie upychaj. Fraza wchodzi tylko tam, gdzie zdanie i tak by ją zawierało.
  Jeśli nie da się jej wpleść bez sztucznego zdania, kalectwa składniowego albo
  powtórzenia tej samej myśli – POMIŃ JĄ. Brak frazy jest lepszy niż zdanie,
  którego nikt tak nie napisze.
- Jedna fraza to najwyżej dwa wystąpienia w sekcji. Powtórka „dla pewności"
  psuje tekst i nic nie daje.
- Wystąpienie w nagłówku H2 liczy się tak samo jak w akapicie – jeśli fraza
  pasuje do tematu sekcji, jej miejsce jest w nagłówku, nie w doklejonym zdaniu.
- Nie zbieraj fraz w listy ani w zdania typu „W tym artykule omówimy X, Y i Z"."""
