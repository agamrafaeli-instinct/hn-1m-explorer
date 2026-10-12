#!/usr/bin/env python3
"""Make a film card and everything it needs from one JSON spec (#249). See scripts/card_tools.py for the fields.
  python3 scripts/new_card.py spec.json      (or: new_card.py - < spec.json)
Exits 1 when the Honor scorecard fails the new card."""
import json, sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
import card_tools
spec = json.load(sys.stdin if sys.argv[1] == '-' else open(sys.argv[1]))
card_tools.report(card_tools.create(spec))
