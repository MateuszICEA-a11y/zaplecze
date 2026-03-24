"""
Serp Scraper v2.1 - STANDALONE VERSION
=====================================================
- Główny cel: Zawsze pobiera top 7 wyników z Google.
- Uzupełnienie: Próbuje dodać 3 unikalne wyniki z Bing i 2 z DuckDuckGo.
- Niezawodność: Bing i DuckDuckGo są opcjonalne; skrypt nie zawiedzie, jeśli nie zwrócą wyników.
- Logika: Minimum 7 URL-i (z Google), maksimum ~12.
- Filtrowanie: PDFy i YouTube są nadal odrzucane.
- Output: Zapis do pliku txt zamiast bazy danych.
"""

import os
import time
import json
import requests
import asyncio
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler

print("✅ Biblioteki zaimportowane")

# =============================================================================
# KONFIGURACJA
# =============================================================================

KEYWORD = "jak obniżyć kortyzol"
LANGUAGE = "pl"  # pl, en, de, etc

TARGET_URLS = 12  # Maksymalna liczba URLi do zebrania
OUTPUT_FILE = "serp_urls.txt"  # Nazwa pliku wyjściowego

# Opcjonalnie: klucz API Senuto (jeśli pusty, użyje crawl4AI)
SENUTO_API_KEY = os.environ.get('SENUTO_API_KEY_TEST', '')

# =============================================================================

print(f"🔑 Keyword: {KEYWORD}")
print(f"🌐 Język: {LANGUAGE}")
print(f"📄 Plik wyjściowy: {OUTPUT_FILE}")


# ===== FUNKCJE POMOCNICZE =====

def is_valid_url(url):
    """Sprawdza, czy URL jest odpowiedni (nie PDF, nie YouTube, etc.)"""
    if not url or not url.startswith('http'):
        return False

    # Odrzuć popularne formaty plików
    excluded_extensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.jpg', '.png']
    if any(url.lower().endswith(ext) for ext in excluded_extensions):
        print(f"      ⛔ Pomijam plik: {url[:60]}...")
        return False

    # Odrzuć domeny wideo/social media
    excluded_domains = ['youtube.com', 'youtu.be', 'vimeo.com', 'facebook.com', 'twitter.com', 'instagram.com', 'pinterest.com']
    if any(domain in url.lower() for domain in excluded_domains):
        print(f"      ⛔ Pomijam domenę (wideo/social): {url[:60]}...")
        return False

    return True


# ===== ŹRÓDŁA DANYCH (GOOGLE, BING, DUCKDUCKGO) =====

def get_urls_from_google_senuto(keyword: str, lang: str, max_results: int = 10):
    """Pobiera top URLs z Google przez API Senuto."""
    if not SENUTO_API_KEY:
        print("   ⚠️ Brak klucza API Senuto, ta metoda zostanie pominięta.")
        return []

    print("   🔍 Pobieranie z Google (Senuto)...")
    url = "https://fugu.senuto.com/api/"
    payload = {"key": SENUTO_API_KEY, "action": "crawl-serp", "keyword": keyword, "country": lang}

    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200 and response.json().get("success"):
            data = response.json()["data"]
            results = [
                {'url': item["url"], 'title': item.get('title', ''), 'snippet': item.get('description', ''), 'source': 'google'}
                for item in data[:max_results] if is_valid_url(item.get("url"))
            ]
            print(f"   ✅ Senuto: Znalaziono {len(results)} prawidłowych wyników.")
            return results
        else:
            print(f"   ⚠️ Błąd API Senuto: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"   ❌ Błąd podczas pobierania z Senuto: {e}")
        return []


async def get_urls_from_google_crawl4ai(keyword: str, lang: str, num_results: int = 10):
    """Pobiera URLs z Google używając crawl4AI."""
    print("   🔍 Pobieranie z Google (crawl4AI)...")
    search_url = f"https://www.google.com/search?q={quote_plus(keyword)}&hl={lang}&num={num_results}"

    try:
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=search_url)
            if not result.success or not result.html:
                print("   ⚠️ crawl4AI: Nie udało się pobrać HTML z Google.")
                return []

        soup = BeautifulSoup(result.html, 'html.parser')
        results = []
        for div in soup.select('div.g'):
            link_elem = div.select_one('a[href]')
            title_elem = div.select_one('h3')
            if link_elem and title_elem:
                url = link_elem.get('href', '')
                if is_valid_url(url):
                    snippet_elem = div.select_one('div.VwiC3b')
                    results.append({
                        'url': url,
                        'title': title_elem.get_text(strip=True),
                        'snippet': snippet_elem.get_text(strip=True) if snippet_elem else '',
                        'source': 'google'
                    })
        print(f"   ✅ crawl4AI: Znaleziono {len(results)} prawidłowych wyników z Google.")
        return results
    except Exception as e:
        print(f"   ❌ Błąd Google (crawl4AI): {e}")
        return []


async def get_urls_from_bing(keyword: str, lang: str, max_results: int = 5):
    """Pobiera top URLs z Bing."""
    print("   🔍 Próba pobrania z Bing...")
    mkt = {'pl': 'pl-PL', 'en': 'en-US', 'de': 'de-DE'}.get(lang, 'en-US')
    search_url = f"https://www.bing.com/search?q={quote_plus(keyword)}&mkt={mkt}"

    try:
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=search_url)
            if not result.success or not result.html:
                print("   ⚠️ Bing: Nie udało się pobrać wyników.")
                return []

        soup = BeautifulSoup(result.html, 'html.parser')
        results = []
        for item in soup.select('li.b_algo'):
            link_elem = item.select_one('h2 a')
            if link_elem:
                url = link_elem.get('href')
                if is_valid_url(url):
                    snippet_elem = item.select_one('p')
                    results.append({
                        'url': url,
                        'title': link_elem.get_text(strip=True),
                        'snippet': snippet_elem.get_text(strip=True) if snippet_elem else '',
                        'source': 'bing'
                    })
                    if len(results) >= max_results:
                        break
        print(f"   ✅ Bing: Znalaziono {len(results)} prawidłowych wyników.")
        return results
    except Exception as e:
        print(f"   ❌ Błąd Bing: {e}")
        return []


async def get_urls_from_duckduckgo(keyword: str, lang: str, max_results: int = 5):
    """Pobiera top URLs z DuckDuckGo."""
    print("   🔍 Próba pobrania z DuckDuckGo...")
    region = {'pl': 'pl-pl', 'en': 'us-en', 'de': 'de-de'}.get(lang, 'us-en')
    search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(keyword)}&kl={region}"

    try:
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=search_url)
            if not result.success or not result.html:
                print("   ⚠️ DuckDuckGo: Nie udało się pobrać wyników.")
                return []

        soup = BeautifulSoup(result.html, 'html.parser')
        results = []
        for item in soup.select('div.result'):
            link_elem = item.select_one('a.result__a')
            if link_elem:
                url = link_elem.get('href')
                if is_valid_url(url):
                    snippet_elem = item.select_one('.result__snippet')
                    results.append({
                        'url': url,
                        'title': link_elem.get_text(strip=True),
                        'snippet': snippet_elem.get_text(strip=True) if snippet_elem else '',
                        'source': 'duckduckgo'
                    })
                    if len(results) >= max_results:
                        break
        print(f"   ✅ DuckDuckGo: Znalaziono {len(results)} prawidłowych wyników.")
        return results
    except Exception as e:
        print(f"   ❌ Błąd DuckDuckGo: {e}")
        return []


# ===== ZAPIS DO PLIKU =====

def save_urls_to_file(urls_data: list, filename: str):
    """Zapisuje zebrane URLs do pliku tekstowego."""
    with open(filename, 'w', encoding='utf-8') as f:
        # Nagłówek
        f.write(f"# SERP Results for: {KEYWORD}\n")
        f.write(f"# Language: {LANGUAGE}\n")
        f.write(f"# Total URLs: {len(urls_data)}\n")
        f.write("#" + "="*60 + "\n\n")
        
        # Lista URL-i
        for i, item in enumerate(urls_data, 1):
            f.write(f"{item['url']}\n")
        
        f.write("\n# " + "="*60 + "\n")
        f.write("# DETAILED INFO:\n")
        f.write("# " + "="*60 + "\n\n")
        
        # Szczegóły
        for i, item in enumerate(urls_data, 1):
            f.write(f"[{i}] {item['source'].upper()}\n")
            f.write(f"    URL: {item['url']}\n")
            f.write(f"    Title: {item.get('title', 'N/A')}\n")
            f.write(f"    Snippet: {item.get('snippet', 'N/A')[:150]}...\n\n")
    
    print(f"   💾 Zapisano {len(urls_data)} URLs do pliku: {filename}")


# ===== GŁÓWNA FUNKCJA PROCESOWANIA =====

async def process_serp():
    """Główna funkcja pobierająca wyniki SERP."""
    print(f"\n{'='*60}")
    print(f"🔄 Przetwarzanie: {KEYWORD}")
    print('='*60)

    # Krok 1: Zawsze pobieraj z Google jako głównego źródła
    if SENUTO_API_KEY:
        google_urls = get_urls_from_google_senuto(KEYWORD, LANGUAGE, max_results=10)
    else:
        google_urls = await get_urls_from_google_crawl4ai(KEYWORD, LANGUAGE, num_results=10)

    # Bierzemy top 7 z Google
    final_urls = google_urls[:7]
    seen_urls = {item['url'] for item in final_urls}
    print(f"   🎯 Baza z Google: {len(final_urls)} URL-i.")

    # Krok 2: Spróbuj uzupełnić z Bing (opcjonalnie)
    bing_urls = await get_urls_from_bing(KEYWORD, LANGUAGE, max_results=5)
    bing_added = 0
    for item in bing_urls:
        if item['url'] not in seen_urls:
            final_urls.append(item)
            seen_urls.add(item['url'])
            bing_added += 1
            if bing_added >= 3:
                break
    if bing_added > 0:
        print(f"   + Uzupełniono z Bing: {bing_added} URL-i.")

    # Krok 3: Spróbuj uzupełnić z DuckDuckGo (opcjonalnie)
    ddg_urls = await get_urls_from_duckduckgo(KEYWORD, LANGUAGE, max_results=5)
    ddg_added = 0
    for item in ddg_urls:
        if item['url'] not in seen_urls:
            final_urls.append(item)
            seen_urls.add(item['url'])
            ddg_added += 1
            if ddg_added >= 2:
                break
    if ddg_added > 0:
        print(f"   + Uzupełniono z DuckDuckGo: {ddg_added} URL-i.")

    # Krok 4: Ostateczne ograniczenie i zapis
    final_urls = final_urls[:TARGET_URLS]

    print(f"\n   📊 Finalnie zebrano {len(final_urls)} unikalnych URL-i.")

    if final_urls:
        save_urls_to_file(final_urls, OUTPUT_FILE)
        
        # Podsumowanie źródeł
        sources = {}
        for item in final_urls:
            src = item['source']
            sources[src] = sources.get(src, 0) + 1
        
        print(f"\n   📈 Podsumowanie źródeł:")
        for src, count in sources.items():
            print(f"      - {src}: {count}")
    else:
        print("   ❌ Nie udało się zebrać żadnych URL-i.")

    return final_urls


# ===== GŁÓWNA FUNKCJA URUCHAMIAJĄCA =====

async def main():
    print("\n🚀 Rozpoczynam pobieranie URL-i z SERP...")
    print("="*60)
    
    urls = await process_serp()
    
    print("\n" + "="*60)
    print("✅ ZAKOŃCZONO!")
    print("="*60)
    
    if urls:
        print(f"\n📄 Wyniki zapisane w: {OUTPUT_FILE}")
        print(f"   Łącznie URL-i: {len(urls)}")


# Uruchomienie skryptu
if __name__ == "__main__":
    try:
        # Sprawdzenie, czy działamy w Colab/Jupyter
        if 'get_ipython' in globals():
            import nest_asyncio
            nest_asyncio.apply()
        asyncio.run(main())
    except Exception as e:
        print(f"\n❌ Wystąpił błąd krytyczny: {e}")