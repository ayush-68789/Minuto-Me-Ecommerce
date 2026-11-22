// Owner: Member 5 -- /create-store: five-step wizard with a live storefront preview.
// The draft is kept in localStorage per account, so a refresh or a later visit picks up where the merchant left off.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { createStore, storeErrorMessage } from '../../api/storeApi';
import { isValidEmail } from '../../utils/validators';
import Loader from '../../components/common/Loader';
import { BrandStep, BusinessStep, DetailsStep, LaunchStep, LookStep, Stepper, useSlugStatus } from '../../components/onboarding';
import { DeviceToggle, StudioPreview, draftToPayload, emptyDraft } from '../../components/studio';

const STEPS = [
  { id: 'business', label: 'Basics' },
  { id: 'look', label: 'Look' },
  { id: 'brand', label: 'Brand' },
  { id: 'details', label: 'Details' },
  { id: 'launch', label: 'Launch' },
];

const draftKey = (user) => `minuto_onboarding_${user?._id || user?.id || 'guest'}`;

function readSaved(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(user)) || 'null');
    if (saved?.draft?.branding && saved?.draft?.theme) return saved;
  } catch {
    /* corrupt or blocked storage: start fresh */
  }
  return null;
}

function validateStep(step, draft, slugStatus) {
  const errors = {};
  if (step === 0) {
    if (!draft.businessName.trim()) errors.businessName = 'Give your store a name';
    if (!draft.slug || draft.slug.length < 3) errors.slug = 'Choose an address with at least 3 characters';
    else if (slugStatus === 'taken') errors.slug = 'That address is taken. Pick another one.';
  }
  if (step === 3 && draft.contact.email && !isValidEmail(draft.contact.email)) {
    errors.email = 'Enter a valid email address';
  }
  return errors;
}

export default function CreateStore() {
  const { user, loading, refresh } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace state={{ from: '/create-store' }} />;
  if (user.store) return <Navigate to="/studio" replace />;
  return <Wizard user={user} refresh={refresh} />;
}

function Wizard({ user, refresh }) {
  const navigate = useNavigate();
  const saved = useMemo(() => readSaved(user), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(() => saved?.draft || emptyDraft(user));
  const [step, setStep] = useState(() => Math.min(saved?.step || 0, STEPS.length - 1));
  const [slugTouched, setSlugTouched] = useState(Boolean(saved?.slugTouched));
  const [errors, setErrors] = useState({});
  const [device, setDevice] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const scroller = useRef(null);
  const slugState = useSlugStatus(draft.slug);

  // Autosave the draft
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(user), JSON.stringify({ draft, step, slugTouched }));
    } catch {
      /* storage blocked: the wizard still works, it just won't resume */
    }
  }, [draft, step, slugTouched, user]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step]);

  const change = (next) => {
    setDraft(next);
    if (Object.keys(errors).length) setErrors({});
  };

  const goTo = (target) => {
    // Moving forward validates every step in between
    for (let s = step; s < target; s++) {
      const e = validateStep(s, draft, slugState.status);
      if (Object.keys(e).length) {
        setStep(s);
        setErrors(e);
        return;
      }
    }
    setErrors({});
    setStep(target);
  };

  const launch = async () => {
    for (let s = 0; s < STEPS.length; s++) {
      const e = validateStep(s, draft, slugState.status);
      if (Object.keys(e).length) {
        setStep(s);
        setErrors(e);
        return;
      }
    }
    setLaunching(true);
    setLaunchError('');
    try {
      const store = await createStore({ ...draftToPayload(draft), onboardingComplete: true });
      try {
        localStorage.setItem('minuto_store_id', store._id);
        localStorage.removeItem(draftKey(user));
      } catch {
        /* ignore */
      }
      await refresh().catch(() => {});
      navigate('/dashboard', { replace: true, state: { welcome: true, storeSlug: store.slug } });
    } catch (err) {
      const message = storeErrorMessage(err, 'We couldn’t create your store. Please try again.');
      if (err?.response?.status === 409) {
        setStep(0);
        setErrors({ slug: message });
      } else {
        setLaunchError(message);
      }
      setLaunching(false);
    }
  };

  const last = step === STEPS.length - 1;
  const stepProps = { draft, onChange: change, errors };

  return (
    <div className="ob">
      <aside className="ob-side">
        <div className="ob-top">
          <Link to="/" className="ob-brand"><i aria-hidden="true" /> Minuto Me</Link>
          <span className="ob-saved">Draft saved on this device</span>
          <button type="button" className="st-btn st-btn-ghost st-btn-sm ob-mobile-preview" onClick={() => setShowPreview(true)}>Preview</button>
        </div>
        <div className="ob-scroll" ref={scroller}>
          <Stepper steps={STEPS} current={step} onStep={goTo} />
          {launchError && <p className="ob-alert" role="alert">{launchError}</p>}
          {step === 0 && <BusinessStep {...stepProps} slugState={slugState} slugTouched={slugTouched} onSlugTouched={() => setSlugTouched(true)} />}
          {step === 1 && <LookStep {...stepProps} />}
          {step === 2 && <BrandStep {...stepProps} />}
          {step === 3 && <DetailsStep {...stepProps} />}
          {step === 4 && <LaunchStep draft={draft} onEdit={(s) => setStep(s)} />}
        </div>
        <div className="ob-foot">
          {step > 0 ? (
            <button type="button" className="st-btn st-btn-ghost" onClick={() => setStep(step - 1)} disabled={launching}>Back</button>
          ) : <span />}
          {last ? (
            <button type="button" className="st-btn st-btn-lg" onClick={launch} disabled={launching || slugState.status === 'checking'}>
              {launching ? 'Launching…' : 'Launch my store'}
            </button>
          ) : (
            <button type="button" className="st-btn" onClick={() => goTo(step + 1)} disabled={step === 0 && slugState.status === 'checking'}>
              Continue
            </button>
          )}
        </div>
      </aside>

      <section className={`ob-stage${showPreview ? ' open' : ''}`} aria-label="Live preview">
        <div className="ob-stage-bar">
          <strong>Live preview</strong>
          <DeviceToggle device={device} onChange={setDevice} />
          {showPreview && <button type="button" className="st-btn st-btn-sm" onClick={() => setShowPreview(false)}>Done</button>}
        </div>
        <StudioPreview draft={draft} device={device} />
      </section>
    </div>
  );
}
