"""Zgłoszenie porażki przebiegu do dashboardu (krok `if: failure()`).

Runner potrafi paść w sposób, którego sam pipeline nie obsłuży: OOM, timeout
całego joba, anulowanie z poziomu GitHuba. Bez tego callbacku zadanie wisiałoby
w stanie „running" do wygaśnięcia dzierżawy.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from client import CallbackError, client_from_env  # noqa: E402


def main() -> int:
    job_id = os.environ.get("JOB_ID", "").strip()
    if not job_id:
        print("brak JOB_ID – nie ma czego zgłaszać")
        return 0
    status = os.environ.get("JOB_STATUS", "failure").strip()
    client = client_from_env(job_id)
    try:
        client.finish(
            "cancelled" if status == "cancelled" else "failed",
            error=f"Przebieg GitHub Actions zakończył się statusem „{status}”.",
        )
    except CallbackError as err:
        # Dashboard mógł już zamknąć zadanie (np. ręczne anulowanie) – to nie
        # jest powód, żeby wywracać workflow.
        print(f"callback odrzucony: {err}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
