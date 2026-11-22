// Owner: Member 5 -- small form controls shared by the studio and the onboarding wizard
import { useId } from 'react';

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className={`st-field${error ? ' has-error' : ''}`}>
      {label && <label className="st-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <p className="st-error">{error}</p> : hint ? <p className="st-hint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ label, hint, error, value, onChange, multiline = false, ...rest }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <Tag id={id} className="st-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} rows={multiline ? 3 : undefined} {...rest} />
    </Field>
  );
}

/** Segmented control for one themeConfig OPTIONS list: [[value, label], ...] */
export function Segmented({ label, options, value, onChange }) {
  return (
    <Field label={label}>
      <div className="st-seg" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <label className={`st-toggle${disabled ? ' disabled' : ''}`}>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function ColorInput({ label, value, onChange }) {
  const id = useId();
  return (
    <div className="st-color">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <label htmlFor={id}>
        <strong>{label}</strong>
        <code>{value}</code>
      </label>
    </div>
  );
}

export function Group({ title, text, children }) {
  return (
    <section className="st-group">
      {(title || text) && (
        <header>
          {title && <h3>{title}</h3>}
          {text && <p>{text}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
