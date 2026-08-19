# Open defects

Repo-tracked register of measured defects with no owning task in their originating feature run.
`.agent_handoffs/` is gitignored, so unassigned defects are duplicated here to survive across sessions.

- LOW — [feature: ancient-machine] Unused reference asset ships in the production build.
  paulmartin.dev/public/machine/sandstone-ref.png (1,062,308 bytes) is referenced nowhere in
  paulmartin.dev/src/ (grep: zero hits) but Vite copies it into dist/machine/sandstone-ref.png on
  every build (verified ~1.06 MB shipped). It is a palette-grounding reference only; the stone skin is
  procedural (SVG feTurbulence + gradients), so the asset is dead weight in production. Surfaced during
  b5-t1 validation. OWNER: unassigned — no planned task prunes unused public/machine reference assets
  before release. Fix: delete the reference PNG(s) from public/machine before release, or move
  references outside the served public/ tree.
