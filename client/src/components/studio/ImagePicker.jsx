// Owner: Member 5 -- logo + banner images: upload (Cloudinary/disk via the API), paste a URL, or pick a stock photo
import { useRef, useState } from 'react';
import { BANNERS } from '../../theme/themeConfig';
import { storeErrorMessage, uploadStoreImage } from '../../api/storeApi';
import { isValidUrl } from '../../utils/validators';
import { setIn } from './studioDraft';

const MAX_BANNERS = 6;
const MAX_BYTES = 5 * 1024 * 1024;

function useUploader(onDone) {
  const [state, setState] = useState({ busy: false, progress: 0, error: '' });
  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setState({ busy: false, progress: 0, error: 'Please choose an image file' });
    if (file.size > MAX_BYTES) return setState({ busy: false, progress: 0, error: 'Images must be 5 MB or smaller' });
    setState({ busy: true, progress: 0, error: '' });
    try {
      const url = await uploadStoreImage(file, (progress) => setState((s) => ({ ...s, progress })));
      setState({ busy: false, progress: 0, error: '' });
      onDone(url);
    } catch (err) {
      setState({ busy: false, progress: 0, error: storeErrorMessage(err, 'Upload failed. Try again or paste an image URL.') });
    }
    return undefined;
  };
  return [state, upload];
}

function UploadButton({ label, onFile, busy, progress }) {
  const input = useRef(null);
  return (
    <>
      <button type="button" className="st-btn st-btn-ghost st-btn-sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? `Uploading… ${progress}%` : label}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}

export function LogoPicker({ draft, onChange }) {
  const logo = draft.branding.logo;
  const [state, upload] = useUploader((url) => onChange(setIn(draft, 'branding.logo', url)));
  const initial = (draft.businessName || 'S').charAt(0).toUpperCase();
  return (
    <div className="st-logo">
      <span className="st-logo-box" style={{ background: logo ? '#fff' : draft.branding.primaryColor }}>
        {logo ? <img src={logo} alt="Store logo" /> : initial}
      </span>
      <div>
        <div className="st-row">
          <UploadButton label={logo ? 'Replace logo' : 'Upload logo'} onFile={upload} busy={state.busy} progress={state.progress} />
          {logo && (
            <button type="button" className="st-link" onClick={() => onChange(setIn(draft, 'branding.logo', ''))}>Remove</button>
          )}
        </div>
        {state.error ? <p className="st-error">{state.error}</p> : <p className="st-hint">Square PNG or SVG works best. No logo? We use your initial.</p>}
      </div>
    </div>
  );
}

export function BannerPicker({ draft, onChange }) {
  const banners = draft.branding.banners || [];
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const save = (next) => onChange(setIn(draft, 'branding.banners', next.slice(0, MAX_BANNERS)));
  const add = (src) => !banners.includes(src) && save([...banners, src]);
  const [state, upload] = useUploader(add);
  const full = banners.length >= MAX_BANNERS;

  const addUrl = () => {
    if (!isValidUrl(url.trim())) return setUrlError('Enter a full image link starting with https://');
    add(url.trim());
    setUrl('');
    setUrlError('');
    return undefined;
  };
  const makeMain = (i) => save([banners[i], ...banners.filter((_, j) => j !== i)]);

  return (
    <div className="st-banners">
      {banners.length > 0 ? (
        <div className="st-thumbs">
          {banners.map((src, i) => (
            <figure key={src} className={i === 0 ? 'main' : ''}>
              <img src={src} alt="" loading="lazy" />
              <figcaption>
                {i === 0 ? <span>Main</span> : <button type="button" onClick={() => makeMain(i)}>Make main</button>}
                <button type="button" aria-label="Remove banner" onClick={() => save(banners.filter((_, j) => j !== i))}>✕</button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="st-hint">No banners yet. The hero will use a default photo.</p>
      )}

      {!full && (
        <>
          <div className="st-row">
            <UploadButton label="Upload image" onFile={upload} busy={state.busy} progress={state.progress} />
            <input className="st-input" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} aria-label="Image URL" />
            <button type="button" className="st-btn st-btn-ghost st-btn-sm" onClick={addUrl} disabled={!url.trim()}>Add</button>
          </div>
          {(state.error || urlError) && <p className="st-error">{state.error || urlError}</p>}
          <p className="st-label" style={{ marginTop: 14 }}>Free stock photos</p>
          <div className="st-stock">
            {BANNERS.map((src) => (
              <button key={src} type="button" className={banners.includes(src) ? 'on' : ''} onClick={() => (banners.includes(src) ? save(banners.filter((b) => b !== src)) : add(src))} aria-pressed={banners.includes(src)} aria-label="Stock banner photo">
                <img src={src.replace('w=1800', 'w=400')} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
