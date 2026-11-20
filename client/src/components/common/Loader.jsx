export default function Loader({ label = 'Loading…', full = false }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 12, padding: 48, minHeight: full ? '100vh' : undefined, color: 'var(--muted)', fontSize: 14 }}>
      <div className="spinner" />
      {label}
    </div>
  );
}
