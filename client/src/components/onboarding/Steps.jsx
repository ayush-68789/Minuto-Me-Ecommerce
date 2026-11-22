// Owner: Member 5 -- the five onboarding steps. Each step edits the shared draft through onChange.
import { OPTIONS, TEMPLATES } from '../../theme/themeConfig';
import { Field, Group, Segmented, TextInput } from '../studio/Controls';
import { ColorPanel, FontPicker, PresetGallery } from '../studio/DesignPickers';
import { BannerPicker, LogoPicker } from '../studio/ImagePicker';
import { CATEGORIES, CURRENCIES, clearPreset, setIn, slugify } from '../studio/studioDraft';
import SlugField from './SlugField';

function StepHead({ eyebrow, title, text }) {
  return (
    <header className="ob-head">
      <span className="ob-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </header>
  );
}

export function BusinessStep({ draft, onChange, errors, slugState, slugTouched, onSlugTouched }) {
  const setName = (name) => {
    let next = { ...draft, businessName: name };
    // Keep the address in step with the name until the merchant edits it themselves
    if (!slugTouched) next = { ...next, slug: slugify(name) };
    onChange(next);
  };
  return (
    <>
      <StepHead eyebrow="Step 1 · Basics" title="Let’s name your store" text="You can change any of this later from your dashboard." />
      <TextInput label="Store name" value={draft.businessName} onChange={setName} error={errors.businessName} placeholder="e.g. Nova Lifestyle" maxLength={100} autoFocus />
      <SlugField
        value={draft.slug}
        onChange={(slug) => {
          onSlugTouched();
          onChange({ ...draft, slug });
        }}
        status={slugState.status}
        suggestion={slugState.suggestion}
        error={errors.slug}
      />
      <Field label="What do you sell?">
        <div className="ob-chips" role="radiogroup" aria-label="Store category">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={draft.category === c} className={draft.category === c ? 'on' : ''} onClick={() => onChange({ ...draft, category: c })}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Currency">
        <select className="st-input" value={draft.currency} onChange={(e) => onChange({ ...draft, currency: e.target.value })} aria-label="Currency">
          {CURRENCIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </Field>
      <TextInput label="Short description" hint="One or two lines. Used on your homepage and in search results." multiline value={draft.description} onChange={(v) => onChange({ ...draft, description: v })} maxLength={500} placeholder="Handpicked sneakers and streetwear, shipped across India." />
    </>
  );
}

export function LookStep({ draft, onChange }) {
  return (
    <>
      <StepHead eyebrow="Step 2 · Look" title="Pick a starting look" text="Each look sets colors, fonts, shapes and layout in one click. Watch the preview change." />
      <PresetGallery draft={draft} onChange={onChange} />
      <Group title="Fine-tune">
        <Field label="Template">
          <select className="st-input" value={draft.template} onChange={(e) => onChange(clearPreset({ ...draft, template: e.target.value }))} aria-label="Template">
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.text}</option>)}
          </select>
        </Field>
        <Segmented label="Color mode" options={OPTIONS.mode} value={draft.theme.mode} onChange={(v) => onChange(clearPreset(setIn(draft, 'theme.mode', v)))} />
        <Segmented label="Hero layout" options={OPTIONS.heroLayout} value={draft.theme.heroLayout} onChange={(v) => onChange(clearPreset(setIn(draft, 'theme.heroLayout', v)))} />
      </Group>
    </>
  );
}

export function BrandStep({ draft, onChange }) {
  return (
    <>
      <StepHead eyebrow="Step 3 · Brand" title="Make it yours" text="Add your logo, colors and a banner photo. Everything is optional." />
      <Group title="Logo"><LogoPicker draft={draft} onChange={onChange} /></Group>
      <Group title="Colors"><ColorPanel draft={draft} onChange={onChange} /></Group>
      <Group title="Font"><FontPicker draft={draft} onChange={onChange} /></Group>
      <Group title="Banner images"><BannerPicker draft={draft} onChange={onChange} /></Group>
    </>
  );
}

export function DetailsStep({ draft, onChange, errors }) {
  const set = (path, value) => onChange(setIn(draft, path, value));
  return (
    <>
      <StepHead eyebrow="Step 4 · Details" title="How can shoppers reach you?" text="Shown in your store footer. Skip anything you don’t want public." />
      <TextInput label="Support email" type="email" value={draft.contact.email} onChange={(v) => set('contact.email', v)} error={errors.email} />
      <TextInput label="Phone" type="tel" value={draft.contact.phone} onChange={(v) => set('contact.phone', v)} placeholder="+91 98765 43210" />
      <TextInput label="Address or city" value={draft.contact.address} onChange={(v) => set('contact.address', v)} placeholder="Bengaluru, India" />
      <Group title="Social">
        <div className="ob-two">
          <TextInput label="Instagram" value={draft.social.instagram} onChange={(v) => set('social.instagram', v)} placeholder="@yourbrand" />
          <TextInput label="WhatsApp" value={draft.social.whatsapp} onChange={(v) => set('social.whatsapp', v)} placeholder="+91 98765 43210" />
          <TextInput label="Facebook" value={draft.social.facebook} onChange={(v) => set('social.facebook', v)} placeholder="yourbrand" />
          <TextInput label="X / Twitter" value={draft.social.twitter} onChange={(v) => set('social.twitter', v)} placeholder="@yourbrand" />
        </div>
      </Group>
    </>
  );
}

export function LaunchStep({ draft, onEdit }) {
  const t = TEMPLATES.find((x) => x.id === draft.template);
  const rows = [
    ['Store', draft.businessName, 0],
    ['Address', `minuto.me/store/${draft.slug}`, 0],
    ['Category', `${draft.category} · ${draft.currency}`, 0],
    ['Look', `${t?.name || 'Modern'} template · ${draft.theme.mode} mode`, 1],
    ['Brand', `${draft.branding.logo ? 'Logo added' : 'Initial as logo'} · ${draft.branding.banners.length} banner${draft.branding.banners.length === 1 ? '' : 's'}`, 2],
    ['Contact', [draft.contact.email, draft.contact.phone].filter(Boolean).join(' · ') || 'Not added', 3],
  ];
  return (
    <>
      <StepHead eyebrow="Step 5 · Launch" title="Ready to go live?" text="Your store opens right away. Next you’ll add products from the dashboard." />
      <dl className="ob-summary">
        {rows.map(([k, v, step]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
            <button type="button" className="st-link" onClick={() => onEdit(step)}>Edit</button>
          </div>
        ))}
      </dl>
      <p className="st-hint">Everything here, plus sections and page text, can be changed any time in the Studio.</p>
    </>
  );
}
