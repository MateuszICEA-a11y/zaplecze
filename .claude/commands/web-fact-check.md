Web fact-checker treści o modelach AI. Read and follow the full skill at `pipeline/web-fact-checker/SKILL.md`.

Dwa silniki: WebSearch (Claude) + GPT-5.5 z web_search (przez `pipeline/web-fact-checker/scripts/web_verify.py`).
Klucz OpenAI: załaduj do env wg `pipeline/web-fact-checker/README.md`. NIGDY nie hardkoduj.

$ARGUMENTS to ścieżka do pliku, katalog lub glob (np. "portals/widocznosc.ai/src/content/blog/modele-llm/*.md").
Jeśli $ARGUMENTS puste – zapytaj, które treści sprawdzić.

Dla wielu plików: tryb batch (sekwencyjnie). Skill NIE commituje – na końcu pokaż git diff do akceptacji.
