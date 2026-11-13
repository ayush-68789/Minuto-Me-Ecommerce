export async function exportStoreZip(store) {
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${store.slug || 'commerceforge-store'}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
