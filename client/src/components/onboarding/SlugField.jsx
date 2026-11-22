// Owner: Member 5 -- store address input with a debounced availability check against the API
import { useEffect, useId, useState } from 'react';
import { checkSlug } from '../../api/storeApi';
import { slugify } from '../studio/studioDraft';

const DEBOUNCE_MS = 400;

/** status: idle | checking | available | taken | invalid | error */
export function useSlugStatus(slug, storeId) {
  const [state, setState] = useState({ status: 'idle', suggestion: '' });

  useEffect(() => {
    if (!slug) return setState({ status: 'idle', suggestion: '' });
    if (slug.length < 3) return setState({ status: 'invalid', suggestion: '' });
    let cancelled = false;
    setState({ status: 'checking', suggestion: '' });
    const id = setTimeout(() => {
      checkSlug(slug, storeId)
        .then((r) => !cancelled && setState({ status: r.available ? 'available' : 'taken', suggestion: r.suggestion }))
        .catch(() => !cancelled && setState({ status: 'error', suggestion: '' }));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [slug, storeId]);

  return state;
}

export default function SlugField({ value, onChange, status, suggestion, error }) {
  const id = useId();
  const message = {
    checking: ['Checking…', ''],
    available: ['✓ Available', 'ok'],
    taken: ['That address is taken', 'bad'],
    invalid: ['Use at least 3 letters or numbers', 'bad'],
    error: ['Couldn’t check right now. We’ll confirm when you launch.', ''],
  }[status];

  return (
    <div className={`st-field${error ? ' has-error' : ''}`}>
      <label className="st-label" htmlFor={id}>Store address</label>
      <div className="ob-slug">
        <span>minuto.me/store/</span>
        <input id={id} value={value} maxLength={60} onChange={(e) => onChange(slugify(e.target.value))} placeholder="your-store" autoComplete="off" spellCheck={false} aria-describedby={`${id}-msg`} />
      </div>
      <p id={`${id}-msg`} className={`ob-slug-msg ${error ? 'bad' : message?.[1] || ''}`} aria-live="polite">
        {error || message?.[0] || 'Lowercase letters, numbers and hyphens.'}
        {status === 'taken' && suggestion && (
          <>
            {' '}Try <button type="button" className="st-link" onClick={() => onChange(suggestion)}>{suggestion}</button>
          </>
        )}
      </p>
    </div>
  );
}
