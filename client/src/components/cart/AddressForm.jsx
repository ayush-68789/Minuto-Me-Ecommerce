// Owner: M5
// Controlled form for customer contact + shipping address.
// value: { customerInfo: {...}, shippingAddress: {...} }
export const emptyAddress = {
  customerInfo: { name: '', email: '', phone: '' },
  shippingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' },
};

const fields = [
  ['customerInfo', 'name', 'Full name', 'text', 'name'],
  ['customerInfo', 'email', 'Email', 'email', 'email'],
  ['customerInfo', 'phone', 'Phone', 'tel', 'tel'],
  ['shippingAddress', 'line1', 'Address line 1', 'text', 'address-line1'],
  ['shippingAddress', 'line2', 'Address line 2 (optional)', 'text', 'address-line2'],
  ['shippingAddress', 'city', 'City', 'text', 'address-level2'],
  ['shippingAddress', 'state', 'State', 'text', 'address-level1'],
  ['shippingAddress', 'postalCode', 'Postal code', 'text', 'postal-code'],
  ['shippingAddress', 'country', 'Country', 'text', 'country-name'],
];

export function validateAddress({ customerInfo: c, shippingAddress: a }) {
  const errors = {};
  if (c.name.trim().length < 2) errors.name = 'Enter your name';
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) errors.email = 'Enter a valid email';
  if (!/^\+?[\d\s-]{7,15}$/.test(c.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (a.line1.trim().length < 3) errors.line1 = 'Enter your address';
  if (a.city.trim().length < 2) errors.city = 'Enter your city';
  if (a.state.trim().length < 2) errors.state = 'Enter your state';
  if (!/^[A-Za-z\d\s-]{3,10}$/.test(a.postalCode.trim())) errors.postalCode = 'Enter a valid postal code';
  if (a.country.trim().length < 2) errors.country = 'Enter your country';
  return errors;
}

export default function AddressForm({ value, onChange, errors = {} }) {
  const set = (group, key, v) => onChange({ ...value, [group]: { ...value[group], [key]: v } });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {fields.map(([group, key, label, type, autoComplete]) => (
        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
          {label}
          <input
            type={type}
            autoComplete={autoComplete}
            value={value[group][key]}
            onChange={(e) => set(group, key, e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${errors[key] ? '#dc2626' : '#d1d5db'}`,
              fontSize: 15,
            }}
          />
          {errors[key] && <span style={{ color: '#dc2626', fontSize: 12 }}>{errors[key]}</span>}
        </label>
      ))}
    </div>
  );
}
