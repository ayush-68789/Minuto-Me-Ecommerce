import { getPlan } from './planCatalog.js';
import { buildStoreZip } from '../../shared/api/storeExport.js';

const validSlug = /^[a-z0-9][a-z0-9-]{1,47}$/;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validLayouts = ['Editorial', 'Grid', 'Showcase', 'Minimal'];
const validStyles = ['Natural', 'Modern', 'Luxury', 'Colorful', 'Professional', 'Dark'];
const planModules = {
  Free: ['Product CRUD, authentication, protected orders and health checks'],
  Basic: ['Admin user and order reports'],
  Plus: ['Atomic inventory reservations and expiry'],
  Pro: ['Idempotent checkout and verified payment webhooks', 'Concurrency attack demo'],
};

function check(id, title, detail, status) { return { id, title, detail, status }; }

function validateStore(store) {
  const checks = [];
  const brandErrors = [];
  if (!String(store.storeName || '').trim()) brandErrors.push('Add a store name.');
  if (!validSlug.test(String(store.slug || ''))) brandErrors.push('Use a 2–48 character URL slug starting with a letter or number.');
  if (store.contactEmail && !validEmail.test(store.contactEmail)) brandErrors.push('Enter a valid contact email address.');
  checks.push(check('brand', 'Store identity', brandErrors.join(' ') || `${store.storeName} has a valid name, URL slug and contact address.`, brandErrors.length ? 'failed' : 'passed'));

  const layoutErrors = [];
  if (!validLayouts.includes(store.layout)) layoutErrors.push('Choose one of the supported storefront layouts.');
  if (!validStyles.includes(store.style)) layoutErrors.push('Choose one of the supported visual styles.');
  if (!/^#[0-9a-f]{6}$/i.test(store.accent || '')) layoutErrors.push('Choose a valid accent color.');
  checks.push(check('design', 'Layout and visual style', layoutErrors.join(' ') || `${store.layout} layout and ${store.style} style are ready to export.`, layoutErrors.length ? 'failed' : 'passed'));

  const productErrors = [];
  const products = Array.isArray(store.products) ? store.products : [];
  if (!Array.isArray(store.products)) productErrors.push('The product list is invalid.');
  else {
    if (products.length > 100) productErrors.push('A store export supports up to 100 products.');
    products.forEach((product, index) => {
      if (!String(product.name || '').trim()) productErrors.push(`Product ${index + 1} needs a name.`);
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) productErrors.push(`Product ${index + 1} needs a valid non-negative price.`);
      const stock = Number(product.stock || 0);
      if (!Number.isSafeInteger(stock) || stock < 0) productErrors.push(`Product ${index + 1} needs a whole-number stock value.`);
      if (product.imageUrl) {
        try { if (!['http:', 'https:'].includes(new URL(product.imageUrl).protocol)) throw new Error(); }
        catch { productErrors.push(`Product ${index + 1} image must use a public HTTP or HTTPS URL.`); }
      }
    });
  }
  const productDetail = productErrors.join(' ') || (products.length ? `${products.length} product${products.length === 1 ? '' : 's'} passed the catalog checks.` : 'Your catalog is empty. The storefront can still be exported and products can be added later.');
  checks.push(check('products', 'Product catalog', productDetail, productErrors.length ? 'failed' : products.length ? 'passed' : 'warning'));

  const plan = getPlan(store.plan);
  const planErrors = [];
  for (const feature of ['adminReports', 'inventory', 'checkout', 'attackDemo']) {
    if (store.features?.[feature] && !plan.features[feature]) planErrors.push(`${feature} is not included with ${plan.name}.`);
  }
  checks.push(check('plan', `${plan.name} plan configuration`, planErrors.join(' ') || `${plan.name} includes only modules available to that tier.`, planErrors.length ? 'failed' : 'passed'));
  return checks;
}

function inspectZip(bytes) {
  if (bytes.length < 22) throw new Error('The generated ZIP is too small to be a valid archive.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) throw new Error('The ZIP local file header is missing.');
  const minEnd = Math.max(0, bytes.length - 22 - 0xffff);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= minEnd; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error('The ZIP end-of-directory record is missing.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = new Set();
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('The ZIP directory is incomplete.');
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    entries.add(decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function checkBackend() {
  const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Backend health check returned HTTP ${response.status}.`);
  const health = await response.json();
  if (health.status !== 'ok') throw new Error('The backend did not report an OK health status.');
  return health;
}

export function getPlanChecks(planName) {
  const modules = planModules[planName] || planModules.Free;
  return modules.map((module) => ({ title: module, plan: planName }));
}

export async function runPreExportChecks(store) {
  const checks = validateStore(store);
  if (checks.some((item) => item.status === 'failed')) return { passed: false, checks, archive: null };

  try {
    const health = await checkBackend();
    checks.push(check('backend', 'Backend health', `${health.service || 'API'} responded with status OK.`, 'passed'));
  } catch (error) {
    checks.push(check('backend', 'Backend health', `${error.message} Start the API and Redis, then run checks again.`, 'failed'));
    return { passed: false, checks, archive: null };
  }

  try {
    const archive = await buildStoreZip(store);
    const expectedFeatures = {
      auth: store.features?.auth !== false,
      orders: store.features?.orders !== false,
      ...Object.fromEntries(['adminReports', 'inventory', 'checkout', 'attackDemo'].map((key) => [key, Boolean(getPlan(store.plan).features[key] && store.features?.[key] !== false)])),
    };
    if (archive.plan !== store.plan) throw new Error(`The API packaged ${archive.plan || 'an unknown'} plan instead of ${store.plan}.`);
    if (archive.layout !== store.layout) throw new Error(`The API packaged ${archive.layout || 'an unknown'} layout instead of ${store.layout}.`);
    let actualFeatures;
    try { actualFeatures = JSON.parse(archive.features); }
    catch { throw new Error('The API did not return verifiable plan feature metadata.'); }
    if (Object.keys(expectedFeatures).some((key) => actualFeatures?.[key] !== expectedFeatures[key])) throw new Error('The exported backend feature set does not match the selected plan.');
    const bytes = new Uint8Array(await archive.blob.arrayBuffer());
    const entries = inspectZip(bytes);
    const root = `minuto-mein-ecommerce-${store.slug}`;
    for (const path of [`${root}/README.md`, `${root}/backend/src/app.js`, `${root}/frontend/src/Storefront.jsx`, `${root}/frontend/src/styles.css`]) {
      if (!entries.has(path)) throw new Error(`The generated ZIP is missing ${path.slice(root.length + 1)}.`);
    }
    checks.push(check('plan-modules', `${store.plan} modules`, `${getPlanChecks(store.plan).map((item) => item.title).join('; ')} are represented in the selected plan package.`, 'passed'));
    checks.push(check('archive', 'Generated ZIP integrity', `${entries.size} project files are present, with the selected plan, features and ${store.layout} layout.`, 'passed'));
    return { passed: true, checks, archive };
  } catch (error) {
    checks.push(check('archive', 'Generated ZIP verification', error.message || 'The export could not be verified.', 'failed'));
    return { passed: false, checks, archive: null };
  }
}
