// Owner: Member 5 -- turn storefront sections on/off and reorder them (stored in theme.sections)
import { SECTIONS, resolveTheme } from '../../theme/themeConfig';
import { setIn } from './studioDraft';

export default function SectionManager({ draft, onChange }) {
  const sections = resolveTheme(draft).sections;
  const save = (next) => onChange(setIn(draft, 'theme.sections', next));

  const toggle = (key) => save(sections.map((s) => (s.key === key && !SECTIONS[key].locked ? { ...s, on: !s.on } : s)));
  const move = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[index], next[to]] = [next[to], next[index]];
    save(next);
  };

  return (
    <ol className="st-sections">
      {sections.map((s, i) => {
        const meta = SECTIONS[s.key];
        return (
          <li key={s.key} className={s.on ? 'on' : ''}>
            <span className="st-sec-icon" aria-hidden="true">{meta.icon}</span>
            <span className="st-sec-text">
              <strong>{meta.label}</strong>
              <small>{meta.text}</small>
            </span>
            <span className="st-sec-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${meta.label} up`}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label={`Move ${meta.label} down`}>↓</button>
              <label className="st-switch" title={meta.locked ? 'Always shown' : undefined}>
                <input type="checkbox" checked={s.on} disabled={meta.locked} onChange={() => toggle(s.key)} aria-label={`Show ${meta.label}`} />
                <i aria-hidden="true" />
              </label>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
