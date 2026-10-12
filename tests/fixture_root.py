"""Path to the small fixed test dataset (#248). Build it with scripts/make_fixture.py; tests read this, never live data."""
import pathlib
FIX = pathlib.Path(__file__).resolve().parent / 'fixtures' / 'root'
