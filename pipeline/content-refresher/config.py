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
BUDGET_AHREFS_UNITS_PER_JOB = 1500
BUDGET_TOKENS_PER_JOB = 400_000
COMPETITOR_LIMIT = 5
COMPETITOR_KEYWORDS_LIMIT = 30
OWN_KEYWORDS_LIMIT = 50

# --- pobieranie stron konkurencji ---
FETCH_TIMEOUT_S = 15
FETCH_MAX_BYTES = 2 * 1024 * 1024
FETCH_MAX_REDIRECTS = 3
USER_AGENT = (
    "ICEA-ContentWatcher/1.0 (+https://www.grupa-icea.pl; analiza SERP na potrzeby "
    "reoptymalizacji własnych treści)"
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
- Nie zmieniaj sensu zdań, które są poprawne merytorycznie."""
