"""Tests for source article fetching."""

import io
import sys
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import source_fetcher


class _Response:
    def __init__(self, url: str, body: str):
        self._url = url
        self._body = body.encode("utf-8")

    def geturl(self):
        return self._url

    def read(self, *args):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class TestResolveSourceUrl:
    def test_przekierowanie_poza_google_zwraca_adres_docelowy(self):
        with mock.patch.object(
            source_fetcher.urllib.request, "urlopen",
            return_value=_Response("https://moto.pl/artykul", "<html></html>"),
        ):
            assert source_fetcher.resolve_source_url("https://news.google.com/rss/articles/x") \
                == "https://moto.pl/artykul"

    def test_strona_posrednia_google_oddaje_link_z_data_n_au(self):
        html = '<c-wiz data-n-au="https://moto.pl/artykul"></c-wiz>'
        with mock.patch.object(
            source_fetcher.urllib.request, "urlopen",
            return_value=_Response("https://news.google.com/rss/articles/x", html),
        ):
            assert source_fetcher.resolve_source_url("https://news.google.com/rss/articles/x") \
                == "https://moto.pl/artykul"

    def test_blad_sieci_zwraca_none(self):
        with mock.patch.object(
            source_fetcher.urllib.request, "urlopen", side_effect=OSError("boom"),
        ):
            assert source_fetcher.resolve_source_url("https://news.google.com/x") is None


class TestFetchSourceText:
    def test_za_krotka_tresc_to_sciana_zgod(self):
        with mock.patch.object(source_fetcher, "resolve_source_url", return_value="https://moto.pl/a"), \
             mock.patch.object(
                 source_fetcher.urllib.request, "urlopen",
                 return_value=_Response("https://r.jina.ai/x", "Zaakceptuj cookies"),
             ):
            assert source_fetcher.fetch_source_text("https://news.google.com/x") is None

    def test_tresc_jest_przycinana_i_wraca_z_adresem(self):
        body = "Fakty o busach. " * 500
        with mock.patch.object(source_fetcher, "resolve_source_url", return_value="https://moto.pl/a"), \
             mock.patch.object(
                 source_fetcher.urllib.request, "urlopen",
                 return_value=_Response("https://r.jina.ai/x", body),
             ):
            result = source_fetcher.fetch_source_text("https://news.google.com/x")
        assert result["url"] == "https://moto.pl/a"
        assert len(result["text"]) == source_fetcher.MAX_SOURCE_CHARS
