"""Word lists for the weekly snapshot (schema v2). The lists live in data/lists.json (one file with a list version). This module loads it and keeps the same names.
Every snapshot records LIST_VERSION. Matching is whole words, case-insensitive, on text split into [a-z0-9_] words,
which is the same as a regex \\b match. Stories: title plus text. Comments: text. A phrase is matched as lowercase text.
See docs/WEEKLY_SPEC.md for what each list is for and its limits."""
import json, pathlib
_D = json.loads((pathlib.Path(__file__).resolve().parent.parent / "data" / "lists.json").read_text())
LIST_VERSION = _D["list_version"]

def T(words=(), phrases=()): return {"words": tuple(words), "phrases": tuple(phrases)}

def _t(v):
    if isinstance(v, dict) and set(v) == {"words", "phrases"}: return T(v["words"], v["phrases"])
    if isinstance(v, dict): return {k: _t(x) for k, x in v.items()}
    return v

AI_CODING = _t(_D["ai_coding"])
AI_CORE = _t(_D["ai_core"])
AI_INFRA = _t(_D["ai_infra"])
BASELINE = _t(_D["baseline"])
CASE_SENSITIVE = set(_D["case_sensitive"])
DEAL_WORDS = _t(_D["deal_words"])
HIRING_SKILLS = _t(_D["hiring_skills"])
LANGUAGES = _t(_D["languages"])
PRESS = _D["press"]
PRIMARY = _D["primary"]
READING = _t(_D["reading"])
THEMES = _t(_D["themes"])
TOOLS = _t(_D["tools"])
WATCHLIST = _D["watchlist"]
