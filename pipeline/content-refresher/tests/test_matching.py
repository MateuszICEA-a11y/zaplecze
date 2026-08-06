"""Testy dopasowania fraz – muszą trzymać się w parze z matcherem edytora.

Przypadki wzięte z realnego przejazdu wpisu „Pozycjonowanie w branży
fotowoltaicznej": pokrycie fraz pokazywało 3/7, choć część fraz padała w tekście
w naturalnej odmianie.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import matching  # noqa: E402

TEXT = (
    "Ciepłe leady na fotowoltaikę są najcenniejsze. Jak pozyskać klientów na fotowoltaikę "
    "bez przepalania budżetu? Gdzie szukać klientów na fotowoltaikę – zaczynamy od SEO. "
    "Darmowe leady w fotowoltaice to mit, ale leady sprzedażowe w fotowoltaice da się "
    "pozyskiwać taniej. Pozyskiwanie klientów na fotowoltaikę wymaga planu."
)


class TestPhraseMatching(unittest.TestCase):
    def test_fraza_z_wyszukiwarki_trafia_w_odmiane_z_przyimkiem(self):
        self.assertTrue(matching.has_phrase(TEXT, "leady fotowoltaika"))
        self.assertEqual(matching.phrase_variant(TEXT, "pozyskiwanie klientów fotowoltaika"),
                         "Pozyskiwanie klientów na fotowoltaikę")

    def test_miejscownik_z_wymiana_spolgloski(self):
        """„fotowoltaika" → „w fotowoltaice" (k→c) i „droga" → „na drodze" (g→dz)."""
        self.assertTrue(matching.has_phrase(TEXT, "darmowe leady fotowoltaiką"))
        self.assertTrue(matching.has_phrase(TEXT, "leady sprzedażowe fotowoltaika"))
        self.assertTrue(matching.has_phrase("Reklama na drodze do klienta.", "reklama droga"))

    def test_sam_przymiotnik_nie_pokrywa_frazy(self):
        """„w branży fotowoltaicznej" to nie „fotowoltaika" – tego model nadużywał."""
        self.assertFalse(matching.has_phrase("Leady w branży fotowoltaicznej.", "leady fotowoltaika"))

    def test_slowa_musza_stac_blisko_siebie(self):
        far = "Leady bywają drogie, a cała reszta rynku instalacji paneli to fotowoltaika."
        self.assertFalse(matching.has_phrase(far, "leady fotowoltaika"))

    def test_coverage_dzieli_frazy_i_liczy_stosunek(self):
        result = matching.coverage(TEXT, [
            "leady fotowoltaika", "gdzie szukać klientów na fotowoltaikę", "agencja seo warszawa",
        ])
        self.assertEqual(result["missing"], ["agencja seo warszawa"])
        self.assertAlmostEqual(result["ratio"], 2 / 3)
        self.assertIn("leady na fotowoltaikę", result["variants"].values())

    def test_pusta_lista_to_pelne_pokrycie(self):
        self.assertEqual(matching.coverage(TEXT, [])["ratio"], 1.0)


if __name__ == "__main__":
    unittest.main()
