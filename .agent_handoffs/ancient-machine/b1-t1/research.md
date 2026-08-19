---
feature: ancient-machine
task: b1-t1
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
ADVERSARIAL (assumptions were provided)

## Verdict on assumptions
VALIDATED
- "vitest+jsdom+@testing-library/react is the runner to stand up": confirmed. No runner, config,
  setup file, or `test` script exists (grep: no `*.test.*`, no `vitest*`, scripts = dev/build/preview
  only). Versions resolved against React 19 + Vite 6 + Node 24: vitest 4.1.11, jsdom 30.0.1,
  @testing-library/react 16.3.2 (peer requires `@testing-library/dom` installed explicitly -> add
  @testing-library/dom 10.4.1), @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.5.
  RTL peer `react ^18||^19` satisfied. jsdom renders `data-*` attributes and dispatches clicks
  (later tasks + b5-t2 both host on it) — standard, no second harness needed.
- One correction folded into the plan (not a refutation): the harness needs a vitest config block +
  a jest-dom setup file, and those files are NOT in the task's TOUCHES list (which names only
  model/Clue/FaceSurface/css/tests/package.json). This is a TOUCHES omission, not scope creep — the
  DELIVERABLE ("npm test runs and passes") cannot be met without them. Added to FILES below and
  flagged in the gap note.

## Blueprint
APPROACH:
Create `paulmartin.dev/src/machine/` holding four source modules + two tests, and stand up the
vitest harness. Everything is new; no existing code is refactored.

1. model.js — the single source of truth.
   - `MOVES`: array of 6 entries `{ order, direction, faceId }`, the ONLY place direction strings
     are typed: {1,'Up','V'},{2,'Right','III'},{3,'Left','II'},{4,'Up','I'},{5,'Down','IV'},
     {6,'Left','III'}. (faceId III legitimately owns two entries: order 2 and order 6.)
   - `SEQUENCE`: DERIVED — `[...MOVES].sort((a,b)=>a.order-b.order).map(m=>m.direction)` =>
     ['Up','Right','Left','Up','Down','Left']. Never written as a literal array.
   - `RESUME_URL`: 'https://drive.google.com/file/d/1utBX7U7q98kJ-Uqrk-3AnSkR2xn6BEXH/view?usp=sharing'
     (exact value currently duplicated at Landing.jsx:9-10 / ProjectDetail.jsx:7-8; this becomes the
     one source, imported by face I in b4-t1).
   - `moveByOrder(order)`: returns the MOVES entry for that order; THROWS on unknown order (fail-fast
     so a bad `order` can never silently render an empty clue).

2. Clue.jsx — the hoisted clue-integrity MECHANISM (keyed by move ORDER). See "clue-integrity" note.
   - Signature: `Clue({ order /* REQUIRED */, variant = 'plain', children, className, ...rest })`.
   - Derives `entry = moveByOrder(order)` (throws if order missing -> a caller cannot render a clue
     without a valid MOVES-backed order; there is no way to pass a direction in).
   - Renders one wrapper `<span class={`clue clue--${variant} ${className}`}
     data-clue-order={entry.order} data-clue-direction={entry.direction} {...rest}>` — the hooks are
     ALWAYS emitted here, from the single entry, so glyph and hook cannot come from different sources.
   - Glyph is DERIVED from the entry, never re-typed by callers. Presentation lookups live in this
     module keyed BY the direction value that came out of MOVES: `DIRECTION_GLYPH` ('Up'->'↑' etc.)
     and `directionLetter` ('Up'->'u','Down'->'d','Left'->'l','Right'->'r'); order glyph defaults to
     `String(entry.order)`.
   - Two consumption forms, BOTH derive-only (this is how later face tasks style their clue WITHOUT
     editing Clue.jsx — none of their TOUCHES include Clue.jsx):
       (a) built-in `variant` (styling class only: e.g. 'plain','underline','tint','tally','seam',
           'seven-seg') — Clue renders the default derived glyph (orderGlyph + directionGlyph) under
           that class.
       (b) render-prop `children` — called as `children({ order: entry.order, direction:
           entry.direction, directionGlyph, directionLetter, orderGlyph })` so exotic faces (III
           colored chars in blurbs, III seam half-glyphs, IV five-stroke tally, I underlined 'u',
           II seven-segment) compose their own visual FROM derived values, while Clue still owns the
           data-clue-* emission. A face can never hand-type "Right"/"5".
   - Accessibility: the wrapper carries NO aria-label and is `aria-hidden="true"` by default (the
     glyph is deliberately a visual puzzle; hooks are test-only, must not announce the answer to AT).

3. FaceSurface.jsx — shared stone-placeholder primitive (b5-t1 later skins it).
   - `FaceSurface({ children, className, ...rest })` -> `<section class={`face-surface ${className}`}
     {...rest}><div class="face-surface__content">{children}</div></section>`. Bordered panel with a
     chiseled bevel (machine.css), a content slot, and pass-through props (so the shell can add
     aria-label/region semantics in b1-t3). Flat placeholder only — no procedural texture here.

4. machine.css — design tokens (namespaced to avoid colliding with index.css's live galaxy tokens,
   which Moonlight + /projects still use): `--m-sandstone`, `--m-buff`, `--m-ochre`, `--m-moss`,
   `--m-crevice` (deep shadow), `--m-brass`, `--m-accent` (one warm accent). Plus `.face-surface`
   (border + inset/bevel shadows using the tokens) and base `.clue` styling. Imported via
   `import './machine.css'` from FaceSurface.jsx (and Clue.jsx) so Vite bundles it.

5. Harness:
   - package.json: add `"test": "vitest run"`; devDependencies vitest, jsdom, @testing-library/react,
     @testing-library/dom, @testing-library/jest-dom, @testing-library/user-event (user-event pre-added
     for later interactive faces).
   - vite.config.js: switch import to `vitest/config` (re-exports vite defineConfig, `vite build`
     unaffected) and add `test: { environment: 'jsdom', globals: true, setupFiles: './vitest.setup.js',
     css: true }`. Reuses the existing `react()` plugin for JSX in tests.
   - vitest.setup.js (new): `import '@testing-library/jest-dom/vitest'` — one setup every later test
     suite inherits.

INTERFACES:
- model.js: `export const MOVES` ({order:number,direction:'Up'|'Down'|'Left'|'Right',faceId:string}[]),
  `export const SEQUENCE` (string[]), `export const RESUME_URL` (string),
  `export function moveByOrder(order): MoveEntry` (throws on miss).
- Clue.jsx: `export default function Clue({ order, variant?, children?, className?, ...rest })`; also
  `export const DIRECTION_GLYPH`, `export function directionLetter(direction)` for reuse.
- FaceSurface.jsx: `export default function FaceSurface({ children, className?, ...rest })`.

DATA_FLOW:
MOVES (typed once) -> SEQUENCE derives by order; moveByOrder(order) -> Clue derives glyph + emits
data-clue-order/direction from that one entry -> (b5-t2) collects the six rendered data-clue-* across
faces, sorts by data-clue-order, reconstructs SEQUENCE, drives face V lock. Faces consume Clue by
`order` only; direction never re-enters user code as a literal.

FILES_NEW:
- paulmartin.dev/src/machine/model.js
- paulmartin.dev/src/machine/Clue.jsx
- paulmartin.dev/src/machine/FaceSurface.jsx
- paulmartin.dev/src/machine/machine.css
- paulmartin.dev/src/machine/model.test.js
- paulmartin.dev/src/machine/Clue.test.jsx
- paulmartin.dev/vitest.setup.js            # NOT in task TOUCHES — required by DELIVERABLE (see gap)
FILES_EDIT:
- paulmartin.dev/package.json               # add test script + test devDependencies
- paulmartin.dev/vite.config.js             # NOT in task TOUCHES — add vitest test block (see gap)

## Duplicate / reuse check
EXISTING:
- RESUME_URL literal: paulmartin.dev/src/pages/Landing.jsx:9-10 and
  paulmartin.dev/src/pages/ProjectDetail.jsx:7-8. model.js becomes the single source; do NOT edit
  those legacy files in this task (out of TOUCHES; Landing is de-routed by b1-t3, ProjectDetail
  untouched this run). Residual duplication logged in tasks.md `## DEFECTS` (LOW, OWNER unassigned).
- No existing MOVES/SEQUENCE/data-clue/moveByOrder anywhere (grep clean). Old maze solve logic is
  explicitly NOT reused (spec). No existing test harness of any kind (grep clean).
- No existing component imports a plain .css (global index.css only); madebymoonlight uses .module.css.
  machine.css is a plain global stylesheet imported from the component — valid Vite pattern, matches
  the task's stated file (machine.css, not a module).
CLEANLINESS:
- "One rule, one place" enumeration for the clue mechanism: grep for existing construction of the
  guarded construct returns ZERO sites today (`rg -n 'data-clue|<Clue' src` = none; src/machine does
  not exist yet). The FUTURE call sites that MUST route through Clue (from tasks.md faceId->moves):
  face I order 4 (b4-t1), face II order 3 (b2-t2), face III orders 2 & 6 (b3-t2 seam, b3-t1 colored),
  face IV order 5 (b4-t2), face V order 1 (b4-t3). Enforcement baked into the mechanism now: `order`
  is a REQUIRED param with no default and direction is UNREACHABLE from caller code — the only inputs
  are `order` + styling, so a face physically cannot emit a hand-typed direction through Clue. Each
  face task's own test asserts its data-clue-* == MOVES[order]; b5-t2 is the whole-machine backstop.
- Namespace machine tokens (`--m-*`) so they never clobber index.css galaxy tokens still consumed by
  Moonlight / project pages.
- Token names, warm palette, and co-located component CSS follow the spec's "Assets > Procedural" and
  the repo's existing token-in-:root convention (index.css:1-30).

## Spec vs task-block note (resolved, no action)
Spec "Clue integrity" is internally inconsistent: it defines MOVES as "keyed by move order 1..6" AND
says faces render "FROM MOVES[faceId]". MOVES[faceId] is impossible as written (face III has two
entries, orders 2 and 6). The authoritative structural definition (keyed by order) wins; the task
block and plan-review.md:33 both resolve to key by ORDER with faceId as a field. Blueprint follows
the spec's primary definition: Clue is keyed by `order`. Not a task-contradicts-spec case.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- model: SEQUENCE === ['Up','Right','Left','Up','Down','Left'] and is DERIVED (equals MOVES sorted by
  order mapped to direction); MOVES has 6 entries with unique orders 1..6 and the exact
  order->direction/faceId mapping; RESUME_URL is the exact drive URL; moveByOrder(order) returns the
  entry and throws on an unknown order.
- Clue: for every order 1..6, renders data-clue-order===order and data-clue-direction===
  MOVES[order].direction, plus a glyph DERIVED from that entry (contains the derived arrow/letter/
  digit, not an independently typed literal); `order` required (throws/errors when omitted); `variant`
  changes only the class, not the hooks; render-prop `children` receives derived {order,direction,
  directionGlyph,directionLetter,orderGlyph}; the wrapper exposes NO aria-label and does not put the
  direction word in accessible text (hooks are test-only, not announced).
- FaceSurface: renders its children inside a `.face-surface__content` slot within a bordered
  `.face-surface` panel; passes through className/rest props. (Visual bevel = screenshot evidence.)
SUGGESTED_TESTS:
- model.test.js:
  - SEQUENCE equals [Up,Right,Left,Up,Down,Left]
  - SEQUENCE is derived (deep-equals MOVES sorted-by-order mapped to direction), not a standalone literal
  - MOVES has 6 entries, orders {1..6} unique, mapping 1/Up/V,2/Right/III,3/Left/II,4/Up/I,5/Down/IV,6/Left/III
  - RESUME_URL === the exact drive URL string
  - moveByOrder(3) returns the order-3 entry; moveByOrder(9) throws
- Clue.test.jsx:
  - for each order 1..6: rendered data-clue-order/data-clue-direction equal MOVES[order]
  - rendered glyph reflects the derived direction (e.g. contains DIRECTION_GLYPH/letter for that entry)
  - omitting `order` throws (fail-fast)
  - two different `variant`s for the same order emit identical data-clue-* (styling doesn't touch hooks)
  - render-prop children is called with derived direction/order (no hand-typed value needed)
  - wrapper has null aria-label and the direction word is absent from accessible text (not announced)
  - FaceSurface: renders children in the content slot and exposes the bordered panel element
- Behavioral (screenshot evidence, not an assertion): FaceSurface renders a visible bordered stone
  placeholder panel; captured by the code/validator step per the task's BEHAVIORAL flag.

## Provenance
none — derived independently. First task in the feature; no sibling research.md exists (feature dir
holds only tasks.md + plan-review.md). Every fact above (versions, grep results, RESUME_URL value,
file tree, token collision) was verified directly in this run.

## Gap flagged to orchestrator
The task's TOUCHES omits `vite.config.js` and a vitest setup file, both required to satisfy the
DELIVERABLE "npm test runs and passes". They are included in FILES_EDIT/FILES_NEW as part of the
harness this task explicitly owns. No new functionality beyond the task's stated scope.

STATUS: IMPLEMENT
