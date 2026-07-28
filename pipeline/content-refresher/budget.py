"""Budżet zadania – jednostki Ahrefs i tokeny LLM.

Zasada: limit sprawdzamy PRZED krokiem, nie po. Zadanie, któremu zabraknie
budżetu, kończy się stanem `budget_exceeded` z częściowym wynikiem, zamiast
zatrzymywać się w połowie researchu bez śladu.
"""
from config import BUDGET_AHREFS_UNITS_PER_JOB, BUDGET_TOKENS_PER_JOB


class BudgetExceeded(RuntimeError):
    def __init__(self, resource: str, spent: int, limit: int):
        super().__init__(
            f"Budżet wyczerpany ({resource}): zużyto {spent} z {limit}."
        )
        self.resource = resource
        self.spent = spent
        self.limit = limit


class Budget:
    def __init__(self, ahrefs_units: int = BUDGET_AHREFS_UNITS_PER_JOB,
                 tokens: int = BUDGET_TOKENS_PER_JOB):
        self.limits = {"ahrefs_units": ahrefs_units, "tokens": tokens}
        self.spent = {"ahrefs_units": 0, "tokens_in": 0, "tokens_out": 0}

    @property
    def tokens(self) -> int:
        return self.spent["tokens_in"] + self.spent["tokens_out"]

    def check(self, resource: str, estimate: int = 0) -> None:
        """Rzuca BudgetExceeded, jeśli krok nie zmieści się w limicie."""
        spent = self.spent["ahrefs_units"] if resource == "ahrefs_units" else self.tokens
        if spent + estimate > self.limits[resource]:
            raise BudgetExceeded(resource, spent, self.limits[resource])

    def add_ahrefs(self, units: int) -> None:
        self.spent["ahrefs_units"] += max(0, int(units or 0))

    def add_tokens(self, tokens_in: int, tokens_out: int) -> None:
        self.spent["tokens_in"] += max(0, int(tokens_in or 0))
        self.spent["tokens_out"] += max(0, int(tokens_out or 0))

    def snapshot(self) -> dict:
        return {**self.spent, "tokens_total": self.tokens, "limits": dict(self.limits)}
