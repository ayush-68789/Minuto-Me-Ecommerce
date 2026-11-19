import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { AUTH_TEMPLATE_FILES, exportStore } from '../src/controllers/storeExportController.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const output = path.join(root, 'server', '.export-verification');
const tierFeatures = {
  Free: { adminReports: false, inventory: false, checkout: false, attackDemo: false, rateLimiting: false },
  Basic: { adminReports: true, inventory: false, checkout: false, attackDemo: false, rateLimiting: false },
  Plus: { adminReports: true, inventory: true, checkout: false, attackDemo: false, rateLimiting: false },
  Pro: { adminReports: true, inventory: true, checkout: true, attackDemo: true, rateLimiting: true },
};

function readZip(archive) {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.notEqual(end, -1, 'ZIP end record exists');
  const count = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  const files = new Map();
  for (let index = 0; index < count; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50, 'central directory record exists');
    const compressedSize = archive.readUInt32LE(offset + 20);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString('utf8', offset + 46, offset + 46 + nameLength);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const payloadStart = localOffset + 30 + localNameLength + localExtraLength;
    files.set(name, inflateRawSync(archive.subarray(payloadStart, payloadStart + compressedSize)));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

async function generate(plan) {
  let archive;
  const headers = {};
  const response = {
    set(values) { Object.assign(headers, values); return this; },
    status(code) { assert.equal(code, 200); return this; },
    send(buffer) { archive = buffer; return this; },
  };
  await exportStore({ body: {
    storeName: `Test ${plan}`, slug: `test-${plan.toLowerCase()}`, plan,
    category: 'Other', layout: 'Showcase', features: tierFeatures[plan],
    products: [{ name: 'Sample product', price: 24.5, description: 'Test description', stock: 7 }],
  } }, response, (error) => { throw error; });
  assert.ok(Buffer.isBuffer(archive), `${plan} returns a ZIP buffer`);
  return { archive, headers };
}

await mkdir(output, { recursive: true });

test('Store Studio runs the same auth module that the template ships', async () => {
  const studioApp = await readFile(path.join(root, 'server', 'src', 'app.js'), 'utf8');
  assert.match(studioApp, /app\.use\('\/api\/auth', authRoutes\)/);
});

for (const [plan, features] of Object.entries(tierFeatures)) {
  test(`${plan} export contains the matching backend and storefront`, async () => {
    const { archive, headers } = await generate(plan);
    const files = readZip(archive);
    const base = `minuto-mein-ecommerce-test-${plan.toLowerCase()}`;
    const read = (relative) => {
      const value = files.get(`${base}/${relative}`);
      assert.ok(value, `${relative} exists in ${plan} ZIP`);
      return value.toString('utf8');
    };
    const config = JSON.parse(read('backend/config/store-config.json'));
    const env = read('backend/.env.example');
    const app = read('backend/src/app.js');
    const frontend = read('frontend/src/Storefront.jsx');
    const frontendConfig = JSON.parse(read('frontend/src/store-config.json'));
    const frontendPackage = JSON.parse(read('frontend/package.json'));
    const frontendStyles = read('frontend/src/styles.css');
    await mkdir(path.join(output, plan), { recursive: true });
    await writeFile(path.join(output, plan, 'package.json'), read('backend/package.json'));

    assert.equal(config.plan, plan);
    assert.equal(config.layout, 'Showcase');
    assert.equal(headers['X-Store-Plan'], plan);
    assert.equal(headers['X-Store-Layout'], 'Showcase');
    assert.deepEqual(JSON.parse(headers['X-Store-Features']), { auth: true, orders: true, ...features });
    assert.equal(frontendConfig.layout, 'Showcase');
    assert.equal(frontendPackage.devDependencies.vite, '^6.4.6');
    assert.match(frontendStyles, /layout-showcase/);
    assert.deepEqual(config.features, { auth: true, orders: true, ...features });
    assert.match(config.products[0].id, /^[a-f\d]{24}$/i);
    assert.ok(read('backend/src/routes/productRoutes.js'));
    assert.match(app, /\/api\/admin\/products/);
    assert.match(app, /ADMIN_REPORTS_ENABLED/);
    assert.match(app, /INVENTORY_ENABLED/);
    assert.match(app, /CHECKOUT_ENABLED/);
    if (features.attackDemo) assert.ok(read('backend/scripts/attacks/attack.js'));
    assert.ok(read('backend/server.js').includes('seedConfiguredProducts'));
    assert.match(read('backend/compose.yaml'), /--replSet/);
    assert.doesNotMatch(app, /storeExportRoutes|\/api\/store-builder/);
    assert.match(app, /app\.use\('\/api\/auth', authRoutes\)/);
    for (const authFile of AUTH_TEMPLATE_FILES) {
      assert.equal(read(`backend/${authFile}`), await readFile(path.join(root, 'server', authFile), 'utf8'), `${authFile} ships unchanged in ${plan}`);
    }
    assert.match(frontend, /x-tenant-id/);
    // The storefront source is a template literal, which silently drops single backslashes.
    assert.ok(frontend.includes('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/'), 'storefront email check keeps its regex escapes');
    assert.match(frontend, /error\?\.details/, 'storefront shows validation details from the API');
    assert.match(env, new RegExp(`ADMIN_REPORTS_ENABLED=${features.adminReports}`));
    assert.match(env, new RegExp(`INVENTORY_ENABLED=${features.inventory}`));
    assert.match(env, new RegExp(`CHECKOUT_ENABLED=${features.checkout}`));
    assert.match(env, new RegExp(`ATTACK_DEMO_ENABLED=${features.attackDemo}`));
    assert.match(env, new RegExp(`RATE_LIMITING_ENABLED=${features.rateLimiting}`));
    assert.match(env, new RegExp(`RATE_LIMIT_PLAN=${plan.toLowerCase()}`));
    assert.equal(/\n  redis:\n/.test(read('backend/compose.yaml')), features.rateLimiting);

    assert.match(frontend, /store\.features\.inventory/);
    assert.match(frontend, /store\.features\.checkout/);
    if (features.adminReports) assert.match(app, /ADMIN_REPORTS_ENABLED/);
    if (features.attackDemo) assert.match(app, /ATTACK_DEMO_ENABLED/);

    for (const [file, contents] of files) {
      if (file.startsWith(`${base}/backend/`) && file.endsWith('.js')) {
        const relative = file.slice(`${base}/backend/`.length);
        await mkdir(path.dirname(path.join(output, plan, relative)), { recursive: true });
        await writeFile(path.join(output, plan, relative), contents);
      }
    }
    await import(pathToFileURL(path.join(output, plan, 'src', 'app.js')).href);
    await writeFile(path.join(output, `${plan}.zip`), archive);
  });
}
