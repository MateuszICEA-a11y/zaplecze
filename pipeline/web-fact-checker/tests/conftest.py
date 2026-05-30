"""Dodaje katalog web-fact-checker/ do sys.path, tak by 'import scripts.web_verify' działał."""
import sys
import pathlib

# Katalog zawierający 'scripts/' package
ROOT = pathlib.Path(__file__).parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
