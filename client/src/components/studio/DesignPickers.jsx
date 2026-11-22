// Owner: Member 5 -- preset looks, templates, colors and fonts
import { useEffect } from 'react';
import { FONTS, PALETTES, PRESETS, TEMPLATES, applyPreset } from '../../theme/themeConfig';
import { loadFonts } from '../../hooks/useStoreTheme';
import { ColorInput } from './Controls';
import { clearPreset, setIn } from './studioDraft';

export function PresetGallery({ draft, onChange, limit }) {
  const list = limit ? PRESETS.slice(0, limit) : PRESETS;
  useEffect(() => loadFonts(list.map((p) => p.theme.font)), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="st-presets">
      {list.map((p) => {
        const [primary, secondary, accent] = p.colors;
        const dark = p.theme.mode === 'dark';
        const on = draft.theme.preset === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`st-preset${on ? ' on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(applyPreset(draft, p))}
          >
            <span className="st-preset-art" style={{ background: dark ? secondary : `linear-gradient(135deg, ${secondary}, #fff)`, fontFamily: `'${FONTS[p.theme.font].heading}', system-ui` }}>
              <b style={{ color: dark ? '#fff' : '#0f172a' }}>Aa</b>
              <i style={{ background: primary, borderRadius: p.theme.radius === 'pill' ? 99 : p.theme.radius === 'sharp' ? 0 : 6 }} />
              <i style={{ background: accent }} />
            </span>
            <span className="st-preset-meta">
              <strong>{p.name}</strong>
              <small>{p.tag}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TemplatePicker({ draft, onChange }) {
  return (
    <div className="st-cards">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`st-card${draft.template === t.id ? ' on' : ''}`}
          aria-pressed={draft.template === t.id}
          onClick={() => onChange(clearPreset({ ...draft, template: t.id }))}
        >
          <strong>{t.name}</strong>
          <small>{t.text}</small>
        </button>
      ))}
    </div>
  );
}

export function ColorPanel({ draft, onChange }) {
  const b = draft.branding;
  const set = (key, value) => onChange(clearPreset(setIn(draft, `branding.${key}`, value)));
  return (
    <>
      <div className="st-palettes">
        {PALETTES.map(([name, p, s, a]) => {
          const on = b.primaryColor === p && b.secondaryColor === s && b.accentColor === a;
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={`${name} palette`}
              aria-pressed={on}
              className={`st-palette${on ? ' on' : ''}`}
              onClick={() => onChange(clearPreset({ ...draft, branding: { ...b, primaryColor: p, secondaryColor: s, accentColor: a } }))}
            >
              <i style={{ background: p }} />
              <i style={{ background: s }} />
              <i style={{ background: a }} />
            </button>
          );
        })}
      </div>
      <div className="st-colors">
        <ColorInput label="Brand" value={b.primaryColor} onChange={(v) => set('primaryColor', v)} />
        <ColorInput label="Background" value={b.secondaryColor} onChange={(v) => set('secondaryColor', v)} />
        <ColorInput label="Accent" value={b.accentColor} onChange={(v) => set('accentColor', v)} />
      </div>
    </>
  );
}

export function FontPicker({ draft, onChange }) {
  const keys = Object.keys(FONTS);
  useEffect(() => loadFonts(keys), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="st-fonts">
      {keys.map((k) => {
        const f = FONTS[k];
        const on = draft.theme.font === k;
        return (
          <button key={k} type="button" className={`st-font${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onChange(clearPreset(setIn(draft, 'theme.font', k)))}>
            <b style={{ fontFamily: `'${f.heading}', system-ui` }}>Aa</b>
            <span>
              <strong>{f.label}</strong>
              <small>{f.vibe}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
