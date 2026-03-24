# =========================================
# DataForSEO v3: Top10 organic URLs
# Google + Bing (pomija wyszukiwarki bez wsparcia języka)
# Colab-ready
# =========================================

import requests
from requests.auth import HTTPBasicAuth
from getpass import getpass
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

# ---------
# USTAWIENIA
# ---------
KEYWORD = "jak obniżyć kortyzol"
LANGUAGE_CODE = "pl"   # np. "en", "pl"
COUNTRY_CODE = "pl"    # do pobrania location_code (np. "us", "de", "pl")

API_BASE = "https://api.dataforseo.com"

# W Colab najbezpieczniej podać login/hasło interaktywnie
DFS_LOGIN = "mch@adinspire.com"
DFS_PASSWORD = ""  # Zostaw puste - zostaniesz poproszony o hasło

# Które wyszukiwarki sprawdzać
SEARCH_ENGINES = ["google", "bing"]


@dataclass
class SERPResult:
    """Wynik SERP dla danej wyszukiwarki"""
    search_engine: str
    keyword: str
    urls: List[str]
    location_code: int
    skipped: bool = False
    skip_reason: str = ""
    raw_response: Optional[dict] = None


def get_supported_languages(search_engine: str, auth: HTTPBasicAuth) -> Dict[str, str]:
    """
    Pobiera listę wspieranych języków dla danej wyszukiwarki.
    Zwraca dict: language_code -> language_name
    """
    url = f"{API_BASE}/v3/serp/{search_engine}/languages"
    try:
        r = requests.get(url, auth=auth, timeout=60)
        r.raise_for_status()
        data = r.json()
        
        if data.get("status_code") != 20000:
            return {}
        
        languages = {}
        for lang in data["tasks"][0].get("result", []):
            languages[lang["language_code"]] = lang["language_name"]
        
        return languages
    except Exception as e:
        print(f"  ⚠️ Nie można pobrać listy języków: {e}")
        return {}


def get_location_code(search_engine: str, country_code: str, auth: HTTPBasicAuth) -> int:
    """
    Pobiera location_code dla kraju z odpowiedniego endpointu lokalizacji.
    """
    url = f"{API_BASE}/v3/serp/{search_engine}/locations/{country_code.lower()}"
    r = requests.get(url, auth=auth, timeout=60)
    r.raise_for_status()
    data = r.json()

    if data.get("status_code") != 20000:
        raise RuntimeError(f"DataForSEO error ({search_engine}): {data.get('status_message')}")

    locations = data["tasks"][0]["result"]
    
    for loc in locations:
        if loc.get("location_type") == "Country" and loc.get("country_iso_code", "").lower() == country_code.lower():
            return loc["location_code"]

    if locations:
        return locations[0]["location_code"]

    raise RuntimeError(f"No locations found for {search_engine}, country={country_code}")


def fetch_top10_organic_urls(
    search_engine: str,
    keyword: str,
    language_code: str,
    location_code: int,
    auth: HTTPBasicAuth
) -> Tuple[List[str], dict]:
    """
    Pobiera SERP z endpointu live/regular dla danej wyszukiwarki.
    """
    endpoint = f"{API_BASE}/v3/serp/{search_engine}/organic/live/regular"
    
    payload = [{
        "keyword": keyword,
        "language_code": language_code,
        "location_code": location_code,
        "depth": 10,
        "device": "desktop"
    }]

    r = requests.post(endpoint, json=payload, auth=auth, timeout=120)
    r.raise_for_status()
    data = r.json()

    if data.get("status_code") != 20000:
        raise RuntimeError(f"DataForSEO error ({search_engine}): {data.get('status_message')}")

    result = data["tasks"][0]["result"][0]
    items = result.get("items", [])

    urls = []
    for item in items:
        if item.get("type") == "organic" and item.get("url"):
            urls.append(item["url"])

    return urls[:10], data


def fetch_all_serps(
    keyword: str,
    language_code: str,
    country_code: str,
    search_engines: List[str],
    auth: HTTPBasicAuth
) -> Dict[str, SERPResult]:
    """
    Pobiera wyniki SERP dla wszystkich wybranych wyszukiwarek.
    Pomija wyszukiwarki, które nie wspierają danego języka.
    """
    results = {}
    
    for se in search_engines:
        print(f"\n{'='*50}")
        print(f"Sprawdzanie: {se.upper()}")
        print('='*50)
        
        # 1. Sprawdź wspierane języki
        supported_langs = get_supported_languages(se, auth)
        
        if supported_langs:
            print(f"  Wspierane języki: {', '.join(sorted(supported_langs.keys()))}")
            
            if language_code not in supported_langs:
                print(f"  ❌ Język '{language_code}' NIE jest wspierany - POMIJAM {se.upper()}")
                results[se] = SERPResult(
                    search_engine=se,
                    keyword=keyword,
                    urls=[],
                    location_code=0,
                    skipped=True,
                    skip_reason=f"Język '{language_code}' nie jest wspierany. Dostępne: {', '.join(sorted(supported_langs.keys()))}"
                )
                continue
            else:
                print(f"  ✓ Język '{language_code}' jest wspierany")
        
        # 2. Pobierz location_code
        try:
            location_code = get_location_code(se, country_code, auth)
            print(f"  Location code: {location_code}")
        except Exception as e:
            print(f"  ❌ Błąd lokalizacji: {e}")
            results[se] = SERPResult(
                search_engine=se,
                keyword=keyword,
                urls=[],
                location_code=0,
                skipped=True,
                skip_reason=f"Błąd lokalizacji: {str(e)}"
            )
            continue
        
        # 3. Pobierz wyniki SERP
        try:
            urls, raw = fetch_top10_organic_urls(se, keyword, language_code, location_code, auth)
            print(f"  ✓ Znaleziono {len(urls)} wyników organic")
            
            results[se] = SERPResult(
                search_engine=se,
                keyword=keyword,
                urls=urls,
                location_code=location_code,
                raw_response=raw
            )
        except Exception as e:
            print(f"  ❌ Błąd pobierania SERP: {e}")
            results[se] = SERPResult(
                search_engine=se,
                keyword=keyword,
                urls=[],
                location_code=location_code,
                skipped=True,
                skip_reason=f"Błąd SERP: {str(e)}"
            )
    
    return results


def print_results(results: Dict[str, SERPResult]):
    """Wyświetla wyniki w czytelnej formie."""
    print("\n" + "="*70)
    print("PODSUMOWANIE WYNIKÓW")
    print("="*70)
    
    for se, result in results.items():
        print(f"\n{'─'*50}")
        print(f"🔍 {se.upper()}")
        print('─'*50)
        
        if result.skipped:
            print(f"  ⏭️ POMINIĘTO: {result.skip_reason}")
        elif result.urls:
            print(f"  Top {len(result.urls)} organic URLs:")
            for i, url in enumerate(result.urls, 1):
                print(f"  {i:02d}. {url}")
        else:
            print("  (brak wyników)")


def save_results(results: Dict[str, SERPResult], base_filename: str = "serp_list"):
    """Zapisuje wyniki do plików (tylko dla wyszukiwarek z wynikami)."""
    saved_files = []
    all_urls = []
    
    for se, result in results.items():
        if result.skipped or not result.urls:
            continue
            
        filename = f"{base_filename}_{se}.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write("\n".join(result.urls) + "\n")
        print(f"Zapisano: {filename} ({len(result.urls)} URLs)")
        saved_files.append(filename)
        all_urls.extend(result.urls)
    
    if all_urls:
        unique_urls = list(dict.fromkeys(all_urls))
        combined_filename = f"{base_filename}_all.txt"
        with open(combined_filename, "w", encoding="utf-8") as f:
            f.write("\n".join(unique_urls) + "\n")
        print(f"Zapisano: {combined_filename} ({len(unique_urls)} unikalnych URLs)")
        saved_files.append(combined_filename)
    
    return saved_files


# --------------
# WYKONANIE
# --------------
if __name__ == "__main__":
    print("="*70)
    print("DataForSEO SERP Fetcher - Google + Bing")
    print("="*70)
    print("\n⚠️  UWAGA: DuckDuckGo NIE jest wspierane przez DataForSEO API.")
    print("    Wyszukiwarki bez wsparcia dla wybranego języka będą pominięte.")
    print()
    
    password = DFS_PASSWORD
    if not password:
        password = getpass(f"Podaj hasło DataForSEO dla {DFS_LOGIN}: ")
    
    auth = HTTPBasicAuth(DFS_LOGIN, password)
    
    print(f"\nKeyword: {KEYWORD}")
    print(f"Language: {LANGUAGE_CODE}")
    print(f"Country: {COUNTRY_CODE}")
    print(f"Search engines: {', '.join(SEARCH_ENGINES)}")
    
    # Pobierz wyniki
    results = fetch_all_serps(
        keyword=KEYWORD,
        language_code=LANGUAGE_CODE,
        country_code=COUNTRY_CODE,
        search_engines=SEARCH_ENGINES,
        auth=auth
    )
    
    # Wyświetl wyniki
    print_results(results)
    
    # Podsumowanie
    active = [se for se, r in results.items() if not r.skipped and r.urls]
    skipped = [se for se, r in results.items() if r.skipped]
    
    print("\n" + "="*70)
    print("PODSUMOWANIE")
    print("="*70)
    print(f"✓ Aktywne wyszukiwarki: {', '.join(active) if active else 'brak'}")
    print(f"⏭️ Pominięte wyszukiwarki: {', '.join(skipped) if skipped else 'brak'}")
    
    # Zapisz do plików
    if active:
        print("\n" + "="*70)
        print("ZAPISYWANIE PLIKÓW")
        print("="*70)
        saved_files = save_results(results)
        
        try:
            from google.colab import files
            for f in saved_files:
                files.download(f)
        except:
            pass
    
    print("\n✅ Gotowe!")