import { useMemo, useState } from 'react'
import Artifact from '../artifact/Artifact.jsx'
import { DEFAULT_CONFIG, LAYERS } from '../artifact/artifactLayers.js'

const GLOW_SLUGS = LAYERS.filter((l) => l.kind === 'glow').map((l) => l.slug)

// Dev-only tuning bench for the artifact. Sliders drive the live config; the
// preview updates in real time. "Copy config" dumps the current values so a
// tuned look can be pasted back into DEFAULT_CONFIG (or passed as a prop when
// the artifact drops under lid 5).
const CONTROLS = [
  { group: 'Fore gears (Gear_01, Gear_02)' },
  { key: 'foreOrbit', label: 'Orbit speed', min: -120, max: 120, step: 1, unit: 'deg/s' },
  { key: 'foreSpin', label: 'Local spin', min: -180, max: 180, step: 1, unit: 'deg/s' },
  { key: 'foreRadius', label: 'Orbit radius', min: 0, max: 1.8, step: 0.02, unit: 'x' },
  { group: 'Central gear (Gear_03)' },
  { key: 'centralOrbit', label: 'Orbit speed', min: -120, max: 120, step: 1, unit: 'deg/s' },
  { key: 'centralSpin', label: 'Local spin', min: -180, max: 180, step: 1, unit: 'deg/s' },
  { key: 'centralRadius', label: 'Orbit radius', min: 0, max: 1.8, step: 0.02, unit: 'x' },
  { group: 'Back gears (Back_Gear, Gear_04-08)' },
  { key: 'backSpin', label: 'Local spin', min: -180, max: 180, step: 1, unit: 'deg/s' },
  { group: 'Glows (synchronised)' },
  { key: 'glowMode', label: 'Pulse mode', choices: ['whole', 'out', 'in'] },
  { key: 'glowTail', label: 'Radial tail', min: 0, max: 80, step: 1, unit: '%' },
  { key: 'glowPeriod', label: 'Period', min: 0.3, max: 8, step: 0.1, unit: 's' },
  { key: 'glowGain', label: 'Gain', min: 1, max: 5, step: 0.1, unit: 'x' },
  { group: 'Perlin shimmer (blue things)' },
  { key: 'perlinOpacity', label: 'Opacity', min: 0, max: 1, step: 0.01, unit: 'x' },
  { key: 'perlinScale', label: 'Tile size', min: 5, max: 120, step: 1, unit: '%' },
  { key: 'perlinSpeed', label: 'Scroll speed', min: -150, max: 150, step: 1, unit: '%/s' },
]

const GROUNDS = ['#12100c', '#e7ddc7', '#1a2a33', '#000000']

export default function ArtifactLab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [ground, setGround] = useState(GROUNDS[0])
  const [size, setSize] = useState(820)
  const set = (key, v) => setConfig((c) => ({ ...c, [key]: v }))
  const setGlowMax = (slug, v) =>
    setConfig((c) => ({ ...c, glowMax: { ...c.glowMax, [slug]: v } }))
  const setGlowConstant = (slug, v) =>
    setConfig((c) => ({ ...c, glowConstant: { ...c.glowConstant, [slug]: v } }))
  const setGlowMin = (slug, v) =>
    setConfig((c) => ({ ...c, glowMin: { ...c.glowMin, [slug]: v } }))
  const json = useMemo(() => JSON.stringify(config, null, 2), [config])

  return (
    <div style={S.page}>
      <div style={{ ...S.stage, background: ground }}>
        <div style={{ width: size, maxWidth: '90%' }}>
          <Artifact config={config} />
        </div>
      </div>

      <aside style={S.panel}>
        <h1 style={S.h1}>Artifact lab</h1>

        <div style={S.row}>
          <span style={S.small}>Ground</span>
          {GROUNDS.map((g) => (
            <button
              key={g}
              onClick={() => setGround(g)}
              style={{ ...S.swatch, background: g, outline: g === ground ? '2px solid #6cf' : 'none' }}
              aria-label={`ground ${g}`}
            />
          ))}
        </div>
        <label style={S.field}>
          <span style={S.label}>Preview size <b>{size}px</b></span>
          <input type="range" min={200} max={820} step={10} value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>

        {CONTROLS.map((c) =>
          c.group ? (
            <h2 key={c.group} style={S.h2}>{c.group}</h2>
          ) : c.choices ? (
            <div key={c.key} style={S.field}>
              <span style={S.label}>{c.label}</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {c.choices.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => set(c.key, opt)}
                    style={{ ...S.btn, ...(config[c.key] === opt ? S.btnOn : null) }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <label key={c.key} style={S.field}>
              <span style={S.label}>
                {c.label} <b>{fmt(config[c.key])}{c.unit ? ` ${c.unit}` : ''}</b>
              </span>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={config[c.key]}
                onChange={(e) => set(c.key, +e.target.value)}
              />
            </label>
          ),
        )}

        <h2 style={S.h2}>Per-glow floor / max (debug)</h2>
        {GLOW_SLUGS.map((slug) => {
          const mx = config.glowMax?.[slug] ?? 1
          const mn = config.glowMin?.[slug] ?? 0.5
          const isConst = !!config.glowConstant?.[slug]
          return (
            <div key={slug} style={{ ...S.field, borderTop: '1px solid #262220', paddingTop: '0.4rem' }}>
              <span style={S.label}>
                {slug}
                <label style={{ float: 'right', fontWeight: 400, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isConst}
                    onChange={(e) => setGlowConstant(slug, e.target.checked)}
                  />{' '}
                  constant
                </label>
              </span>
              <span style={S.small}>floor <b>{fmt(mn)}</b></span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mn}
                disabled={isConst}
                onChange={(e) => setGlowMin(slug, +e.target.value)}
              />
              <span style={S.small}>max <b>{fmt(mx)}</b></span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mx}
                onChange={(e) => setGlowMax(slug, +e.target.value)}
              />
            </div>
          )
        })}

        <div style={S.actions}>
          <button style={S.btn} onClick={() => setConfig(DEFAULT_CONFIG)}>Reset</button>
          <button style={S.btn} onClick={() => navigator.clipboard?.writeText(json)}>Copy config</button>
        </div>
        <pre style={S.json}>{json}</pre>
      </aside>
    </div>
  )
}

function fmt(v) {
  return Number.isInteger(v) ? v : Math.round(v * 100) / 100
}

const S = {
  page: { display: 'flex', height: '100vh', width: '100%', fontFamily: 'system-ui, sans-serif', color: '#e8e4da', background: '#0c0b09' },
  stage: { flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  panel: { width: 320, flex: '0 0 320px', overflowY: 'auto', padding: '1rem 1.1rem', background: '#171512', borderLeft: '1px solid #2a2620' },
  h1: { fontSize: '1rem', margin: '0 0 0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#cfc8b8' },
  h2: { fontSize: '0.72rem', margin: '1.1rem 0 0.3rem', color: '#8fd0e6', letterSpacing: '0.03em', textTransform: 'uppercase' },
  field: { display: 'block', margin: '0.5rem 0' },
  label: { display: 'block', fontSize: '0.75rem', color: '#b8b1a2', marginBottom: '0.2rem' },
  small: { fontSize: '0.75rem', color: '#b8b1a2', marginRight: '0.4rem' },
  row: { display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.3rem 0 0.6rem' },
  swatch: { width: 22, height: 22, borderRadius: 4, border: '1px solid #3a352c', cursor: 'pointer' },
  actions: { display: 'flex', gap: '0.5rem', margin: '0.9rem 0 0.6rem' },
  btn: { flex: 1, padding: '0.45rem', background: '#2a2620', color: '#e8e4da', border: '1px solid #3a352c', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' },
  btnOn: { background: '#2f6d86', border: '1px solid #6cf', color: '#fff' },
  json: { fontSize: '0.68rem', lineHeight: 1.4, background: '#0c0b09', border: '1px solid #2a2620', borderRadius: 6, padding: '0.6rem', color: '#9fb8c2', whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' },
}
