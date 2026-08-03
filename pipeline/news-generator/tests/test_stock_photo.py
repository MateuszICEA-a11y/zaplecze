"""Tests for stock photo sourcing (licencje + mapowanie kandydatów)."""

import sys
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import stock_photo


class TestLicencje:
    def test_komercyjne_przechodza(self):
        for name in ("CC BY-SA 4.0", "CC BY 2.0", "CC0", "Public domain", "PD-self"):
            assert stock_photo._commons_license_ok(name), name

    def test_nc_i_nd_odpadaja(self):
        for name in ("CC BY-NC 2.0", "CC BY-ND 4.0", "CC BY-NC-SA 3.0", ""):
            assert not stock_photo._commons_license_ok(name), name


class TestSearchWikimedia:
    def test_filtruje_licencje_i_male_obrazy(self):
        payload = {"query": {"pages": {
            "1": {"title": "File:Transit.jpg", "imageinfo": [{
                "thumburl": "https://upload.wikimedia.org/transit.jpg", "width": 1600,
                "extmetadata": {"LicenseShortName": {"value": "CC BY-SA 4.0"},
                                "Artist": {"value": "<a href='#'>Jan Foto</a>"}},
            }]},
            "2": {"title": "File:Zakaz.jpg", "imageinfo": [{
                "thumburl": "https://upload.wikimedia.org/nc.jpg", "width": 1600,
                "extmetadata": {"LicenseShortName": {"value": "CC BY-NC 2.0"}},
            }]},
            "3": {"title": "File:Male.jpg", "imageinfo": [{
                "thumburl": "https://upload.wikimedia.org/male.jpg", "width": 400,
                "extmetadata": {"LicenseShortName": {"value": "CC0"}},
            }]},
        }}}
        with mock.patch.object(stock_photo, "_get_json", return_value=payload):
            results = stock_photo.search_wikimedia("ford transit")
        assert len(results) == 1
        assert results[0]["creator"] == "Jan Foto"
        assert results[0]["source"] == "Wikimedia Commons"


class TestSearchOpenverse:
    def test_mapuje_kandydatow(self):
        payload = {"results": [
            {"url": "https://img/1.jpg", "title": "Camper", "creator": "Anna",
             "license": "by-sa", "license_version": "4.0", "source": "flickr", "width": 1200},
            {"url": "https://img/2.jpg", "title": "Small", "creator": "X",
             "license": "cc0", "license_version": "", "source": "flickr", "width": 500},
        ]}
        with mock.patch.object(stock_photo, "_get_json", return_value=payload):
            results = stock_photo.search_openverse("camper")
        assert len(results) == 1
        assert results[0]["license"] == "CC BY-SA 4.0"


class TestFindStockPhoto:
    def test_odrzucony_kandydat_nie_zostawia_pliku_i_wraca_none(self, tmp_path):
        candidate = {"url": "https://img/1.jpg", "title": "T", "creator": "A",
                     "license": "CC0", "source": "Wikimedia Commons"}
        with mock.patch.object(stock_photo, "search_wikimedia", return_value=[candidate]), \
             mock.patch.object(stock_photo, "search_openverse", return_value=[]), \
             mock.patch("image_generator._download_and_optimize"), \
             mock.patch("image_generator._validate_image", return_value=(False, "nie ten pojazd")):
            result = stock_photo.find_stock_photo(
                queries=["ford transit"], title="Ford Transit", slug="test",
                static_dir=tmp_path,
            )
        assert result is None

    def test_przyjety_kandydat_wraca_z_atrybucja(self, tmp_path):
        candidate = {"url": "https://img/1.jpg", "title": "T", "creator": "Jan Foto",
                     "license": "CC BY-SA 4.0", "source": "Wikimedia Commons"}
        with mock.patch.object(stock_photo, "search_wikimedia", return_value=[candidate]), \
             mock.patch.object(stock_photo, "search_openverse", return_value=[]), \
             mock.patch("image_generator._download_and_optimize"), \
             mock.patch("image_generator._validate_image", return_value=(True, "ok")):
            result = stock_photo.find_stock_photo(
                queries=["ford transit"], title="Ford Transit", slug="test",
                static_dir=tmp_path,
            )
        assert result["hero_url"] == "/images/news/test.webp"
        assert result["credit"] == "Fot. Jan Foto / CC BY-SA 4.0, via Wikimedia Commons"
