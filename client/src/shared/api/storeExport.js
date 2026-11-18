export async function buildStoreZip(store) {
  const response = await fetch('/api/store-builder/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(store),
  });
  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try { message = (await response.json())?.error?.message || message; } catch { /* Keep the status message. */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  return {
    blob,
    filename: `${store.slug || 'minuto-mein-ecommerce-store'}.zip`,
    plan: response.headers.get('X-Store-Plan'),
    layout: response.headers.get('X-Store-Layout'),
    features: response.headers.get('X-Store-Features'),
  };
}

export function downloadStoreZip(archive, filename) {
  const { blob } = archive;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || archive.filename || 'minuto-mein-ecommerce-store.zip';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportStoreZip(store) {
  const archive = await buildStoreZip(store);
  downloadStoreZip(archive);
  return archive;
}
