// Owner: Member 5 -- the words on the storefront. Empty fields fall back to category-aware defaults.
import { defaultContent } from '../../theme/themeConfig';
import { Group, TextInput, Toggle } from './Controls';
import { setIn } from './studioDraft';

const MAX_TESTIMONIALS = 6;

export default function ContentEditor({ draft, onChange }) {
  const content = draft.theme.content || {};
  const defaults = defaultContent(draft);
  const set = (key, value) => onChange(setIn(draft, `theme.content.${key}`, value));
  const field = (key, label, extra = {}) => (
    <TextInput label={label} value={content[key] ?? ''} placeholder={key === 'heroTitle' ? draft.businessName || defaults._fallbackTitle : key === 'heroSubtitle' ? draft.description || defaults._fallbackSub : defaults[key]} onChange={(v) => set(key, v)} {...extra} />
  );

  const reviews = Array.isArray(content.testimonials) && content.testimonials.length ? content.testimonials : defaults.testimonials;
  const setReviews = (next) => set('testimonials', next);
  const editReview = (i, key, value) => setReviews(reviews.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <>
      <Group title="Hero" text="The first thing shoppers read.">
        {field('heroTitle', 'Headline', { maxLength: 80 })}
        {field('heroSubtitle', 'Subheading', { multiline: true, maxLength: 200 })}
        {field('ctaText', 'Button text', { maxLength: 30 })}
      </Group>

      <Group title="Announcement bar">
        <Toggle label="Show announcement bar" hint="A thin strip above the menu" checked={draft.theme.showAnnouncement} onChange={(v) => onChange(setIn(draft, 'theme.showAnnouncement', v))} />
        {draft.theme.showAnnouncement && field('announcement', 'Announcement', { maxLength: 120 })}
        {field('marquee', 'Scrolling ticker', { hint: 'Separate messages with •', maxLength: 240 })}
      </Group>

      <Group title="Sale banner">
        {field('promoTitle', 'Title', { maxLength: 60 })}
        {field('promoText', 'Text', { multiline: true, maxLength: 200 })}
      </Group>

      <Group title="Our story">
        {field('aboutTitle', 'Title', { maxLength: 80 })}
        {field('aboutText', 'Story', { multiline: true, maxLength: 1200 })}
        {field('newsletterTitle', 'Newsletter headline', { maxLength: 80 })}
      </Group>

      <Group title="Testimonials" text="Use real quotes from your customers.">
        {reviews.map((r, i) => (
          <div key={i} className="st-review">
            <div className="st-review-row">
              <input className="st-input" aria-label="Customer name" placeholder="Customer name" value={r.name || ''} maxLength={40} onChange={(e) => editReview(i, 'name', e.target.value)} />
              <select className="st-input" aria-label="Rating" value={r.rating || 5} onChange={(e) => editReview(i, 'rating', Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
              <button type="button" className="st-icon-btn" aria-label="Remove testimonial" onClick={() => setReviews(reviews.filter((_, j) => j !== i))}>✕</button>
            </div>
            <textarea className="st-input" aria-label="Quote" rows={2} placeholder="What did they say?" value={r.text || ''} maxLength={300} onChange={(e) => editReview(i, 'text', e.target.value)} />
          </div>
        ))}
        {reviews.length < MAX_TESTIMONIALS && (
          <button type="button" className="st-btn st-btn-ghost st-btn-sm" onClick={() => setReviews([...reviews, { name: '', text: '', rating: 5 }])}>
            + Add testimonial
          </button>
        )}
      </Group>
    </>
  );
}
