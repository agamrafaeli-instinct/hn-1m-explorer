# Scoreboard: what counts as a verdict flip

Status: proposed. Waiting on the owner (issue #80).

## Proposed rule

- A verdict is one of supported, refuted or inconclusive.
- A **flip** is a change from one of those three to another between one deploy and the next.
- A move between strong and weak confidence with the same verdict is a **shift**. It is shown, but not counted as a flip.
- Cards on fixed windows are never flagged, because their data does not move.
- The scoreboard counts flips per card and in total, with the date of each.

## Why

A flip is the part of the scoreboard a reader cares about: the data changed an answer. Counting small confidence moves would bury those.

## Open item

Needs a yes or no from the owner on this rule. The answer is then written here as a Decision line.
