---
feature: ancient-machine
task: b4-t1
agent: tdd-validator
updated: 2026-08-19T16:44:00-04:00
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
  - vitest run: Test Files 10 passed (10) / Tests 93 passed (93)
  - vite build: 95 modules transformed, built in 578ms, no errors

## Behavioral evidence
EXERCISED: Task is BEHAVIORAL but tests were WROTE (not SKIPPED), so gate is sufficient.
FaceI.test.jsx (5 cases, all green in jsdom) exercises every deliverable behavior:
  - name-is-h1: exactly one <h1> "Paul Martin" (getByRole heading level 1)
  - resume-href: link href === shared RESUME_URL export, target=_blank, rel includes noopener
  - resume-underline-tell: per-char spans spell "resume"; tell/underline class lands only on
    index MOVES-face-I.order-1 ('u'), derived not hardcoded
  - clue-hook: exactly one [data-clue-order]; order=4, direction=Up equal MOVES face I entry
  - contact-rotates-to-IV: click Contact calls spied rotateTo with faceIndex('IV')
Visual tell confirmed via FaceI.css: .face1-resume__clue.clue--underline neutralizes the
wrapper underline; only .face1-resume__tell ('u') is underlined (m-brass) — the distinct
tell from face III's tint.

## Simplification review
BLOCKING: none
ADVISORY:
  - FaceI.jsx:23-40 — the render-prop fail-fast throw is slightly clever, but justified: it
    turns a MOVES/word divergence into a render-time crash instead of a silently mis-underlined
    word. Keep. No action.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (93 tests + build). FaceI wires the four blueprint seams
correctly — single h1, shared RESUME_URL import (no re-declared literal), the move-4 clue routed
through the b1-t1 Clue mechanism (data-clue-order/direction derived from MOVES, underline tell on
the derived index with a fail-fast integrity check), and Contact->rotateTo(faceIndex('IV')) with
no local audio call (snap inherited from rotateTo-on-settle). No sibling call-site left half-fixed.
The two Machine.test.jsx tests that keyed off FaceI's old stub text were correctly updated in this
same cycle by the test-writer (this task legitimately removed that text), not left stale. Code is
small, clean, no duplication, no blocking findings.

STATUS: GREEN
