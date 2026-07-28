"""Budżet zadania – zapytania do SERP-u i tokeny LLM.

Zasada: limit sprawdzamy PRZED krokiem, nie po. Zadanie, któremu zabraknie
budżetu, kończy się stanem `budget_exceeded` z częściowym wynikiem, zamiast
zatrzymywać się w połowie researchu bez śladu.

Frazy (Senuto) nie mają licznika – abonament nie rozlicza pojedynczych zapytań.
Limitujemy tylko SerpData, bo to jedyne płatne per-request źródło researchu.
"""
from config import BUDGET_SERP_REQUESTS_PER_JOB, BUDGET_TOKENS_PER_JOB


class BudgetExceeded(RuntimeError):
    def __init__(self, resource: str, spent: int, limit: int):
        super().__init__(
            f"Budżet wyczerpany ({resource}): zużyto {spent} z {limit}."
        )
        self.resource = resource
        self.spent = spent
        self.limit = limit


class Budget:
    def __init__(self, serp_requests: int = BUDGET_SERP_REQUESTS_PER_JOB,
                 tokens: int = BUDGET_TOKENS_PER_JOB):
        self.limits = {"serp_requests": serp_requests, "tokens": tokens}
        self.spent = {"serp_requests": 0, "senuto_requests": 0, "tokens_in": 0, "tokens_out": 0}

    @property
    def tokens(self) -> int:
        return self.spent["tokens_in"] + self.spent["tokens_out"]

    def check(self, resource: str, estimate: int = 0) -> None:
        """Rzuca BudgetExceeded, jeśli krok nie zmieści się w limicie."""
        spent = self.spent["serp_requests"] if resource == "serp_requests" else self.tokens
        if spent + estimate > self.limits[resource]:
            raise BudgetExceeded(resource, spent, self.limits[resource])

    def add_serp(self, requests: int = 1) -> None:
        self.spent["serp_requests"] += max(0, int(requests or 0))

    def add_senuto(self, requests: int = 1) -> None:
        """Licznik informacyjny – Senuto nie ma limitu per zapytanie."""
        self.spent["senuto_requests"] += max(0, int(requests or 0))

    def add_tokens(self, tokens_in: int, tokens_out: int) -> None:
        self.spent["tokens_in"] += max(0, int(tokens_in or 0))
        self.spent["tokens_out"] += max(0, int(tokens_out or 0))

    def snapshot(self) -> dict:
        return {**self.spent, "tokens_total": self.tokens, "limits": dict(self.limits)}
