// Owner: Member 5 -- the tabbed design panel. Pure: it edits a draft and reports changes through onChange.
import { useState } from 'react';
import { OPTIONS } from '../../theme/themeConfig';
import { Group, Segmented, TextInput, Toggle } from './Controls';
import { ColorPanel, FontPicker, PresetGallery, TemplatePicker } from './DesignPickers';
import { BannerPicker, LogoPicker } from './ImagePicker';
import SectionManager from './SectionManager';
import ContentEditor from './ContentEditor';
import { clearPreset, setIn } from './studioDraft';

export const STUDIO_TABS = [
  ['look', 'Look'],
  ['brand', 'Brand'],
  ['layout', 'Layout'],
  ['sections', 'Sections'],
  ['content', 'Content'],
  ['store', 'Store info'],
];

function LayoutPanel({ draft, onChange }) {
  const t = draft.theme;
  const set = (key, value) => onChange(clearPreset(setIn(draft, `theme.${key}`, value)));
  const opt = (key, label) => <Segmented label={label} options={OPTIONS[key]} value={t[key]} onChange={(v) => set(key, v)} />;
  return (
    <>
      <Group title="Page">
        {opt('mode', 'Color mode')}
        {opt('pattern', 'Background texture')}
        {opt('animation', 'Motion')}
      </Group>
      <Group title="Hero">
        {opt('heroLayout', 'Hero layout')}
        {opt('heroHeight', 'Hero height')}
      </Group>
      <Group title="Navigation">
        {opt('navStyle', 'Logo position')}
        <Toggle label="Sticky menu" hint="Keep the menu visible while scrolling" checked={t.stickyNav} onChange={(v) => set('stickyNav', v)} />
      </Group>
      <Group title="Shapes">
        {opt('radius', 'Corners')}
        {opt('buttonStyle', 'Buttons')}
        {opt('cardStyle', 'Product cards')}
      </Group>
      <Group title="Product grid">
        {opt('imageRatio', 'Image shape')}
        <Segmented label="Columns on desktop" options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]} value={Number(t.gridColumns) || 4} onChange={(v) => set('gridColumns', v)} />
        <Segmented label="Columns on phones" options={[[1, '1'], [2, '2']]} value={Number(t.mobileColumns) || 2} onChange={(v) => set('mobileColumns', v)} />
      </Group>
    </>
  );
}

function StoreInfoPanel({ draft, onChange }) {
  const set = (path, value) => onChange(setIn(draft, path, value));
  return (
    <>
      <Group title="Contact" text="Shown in your store footer.">
        <TextInput label="Email" type="email" value={draft.contact.email} onChange={(v) => set('contact.email', v)} />
        <TextInput label="Phone" type="tel" value={draft.contact.phone} onChange={(v) => set('contact.phone', v)} />
        <TextInput label="Address" value={draft.contact.address} onChange={(v) => set('contact.address', v)} />
      </Group>
      <Group title="Social links" text="Handles or full links.">
        {['instagram', 'facebook', 'twitter', 'youtube', 'whatsapp'].map((k) => (
          <TextInput key={k} label={k === 'twitter' ? 'X / Twitter' : k.charAt(0).toUpperCase() + k.slice(1)} placeholder={k === 'whatsapp' ? '+91 98765 43210' : '@yourbrand'} value={draft.social[k]} onChange={(v) => set(`social.${k}`, v)} />
        ))}
      </Group>
      <Group title="Features">
        <Toggle label="Wishlist" hint="Shoppers can save products with a heart" checked={draft.features.wishlist} onChange={(v) => set('features.wishlist', v)} />
        <Toggle label="Star ratings" hint="Show ratings on product cards" checked={draft.features.reviews} onChange={(v) => set('features.reviews', v)} />
      </Group>
    </>
  );
}

export default function StudioEditor({ draft, onChange, initialTab = 'look' }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div className="st-editor">
      <nav className="st-tabs" role="tablist" aria-label="Studio sections">
        {STUDIO_TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="st-panel" role="tabpanel">
        {tab === 'look' && (
          <>
            <Group title="Start from a look" text="One click sets colors, fonts, shapes and layout. Tweak anything after.">
              <PresetGallery draft={draft} onChange={onChange} />
            </Group>
            <Group title="Template">
              <TemplatePicker draft={draft} onChange={onChange} />
            </Group>
          </>
        )}
        {tab === 'brand' && (
          <>
            <Group title="Logo"><LogoPicker draft={draft} onChange={onChange} /></Group>
            <Group title="Colors"><ColorPanel draft={draft} onChange={onChange} /></Group>
            <Group title="Typography"><FontPicker draft={draft} onChange={onChange} /></Group>
            <Group title="Banner images" text="The first image leads your hero; the rest rotate in the slideshow layout.">
              <BannerPicker draft={draft} onChange={onChange} />
            </Group>
          </>
        )}
        {tab === 'layout' && <LayoutPanel draft={draft} onChange={onChange} />}
        {tab === 'sections' && (
          <Group title="Homepage sections" text="Switch sections on or off and change their order.">
            <SectionManager draft={draft} onChange={onChange} />
          </Group>
        )}
        {tab === 'content' && <ContentEditor draft={draft} onChange={onChange} />}
        {tab === 'store' && <StoreInfoPanel draft={draft} onChange={onChange} />}
      </div>
    </div>
  );
}
