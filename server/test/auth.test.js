// Owner: Member 1 — auth and authorization checks, including the live demo attacks.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import userModel, { ROLES } from '../src/models/User.js';

let server;
let baseUrl;

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function registerCustomer(name) {
  const email = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const { status, body } = await api('POST', '/api/auth/register', {
    body: { name, email, password: 'correct-horse-battery' },
  });
  assert.equal(status, 201);
  return { ...body, email };
}

async function placeOrder(token) {
  const { status, body } = await api('POST', '/api/orders', {
    token,
    body: { items: [{ productId: 'sku-1', quantity: 2 }] },
  });
  assert.equal(status, 201);
  return body.order;
}

async function signInAdmin() {
  const email = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await userModel.create({ name: 'Admin', email, password: 'admin-password-1', role: ROLES.ADMIN });
  const { body } = await api('POST', '/api/auth/login', { body: { email, password: 'admin-password-1' } });
  return body.token;
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('register returns a customer and never exposes the password hash', async () => {
  const { user, token } = await registerCustomer('alice');
  assert.equal(user.role, 'customer');
  assert.ok(token);
  assert.deepEqual(Object.keys(user).sort(), ['createdAt', 'email', 'id', 'name', 'role']);
});

test('register ignores a role supplied by the client', async () => {
  const { status, body } = await api('POST', '/api/auth/register', {
    body: { name: 'Mallory', email: `mallory-${Date.now()}@example.com`, password: 'long-enough-pw', role: 'admin' },
  });
  assert.equal(status, 201);
  assert.equal(body.user.role, 'customer');
  assert.equal((await api('GET', '/api/admin/users', { token: body.token })).status, 403);
});

test('register rejects invalid input and duplicate emails', async () => {
  const invalid = await api('POST', '/api/auth/register', { body: { name: '', email: 'nope', password: 'short' } });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.details.length, 3);

  const { email } = await registerCustomer('dupe');
  const duplicate = await api('POST', '/api/auth/register', {
    body: { name: 'Dupe', email: email.toUpperCase(), password: 'correct-horse-battery' },
  });
  assert.equal(duplicate.status, 409);
});

test('login accepts correct credentials and gives one answer for every failure', async () => {
  const { email } = await registerCustomer('bob');
  const ok = await api('POST', '/api/auth/login', { body: { email, password: 'correct-horse-battery' } });
  assert.equal(ok.status, 200);
  assert.equal((await api('GET', '/api/auth/me', { token: ok.body.token })).body.user.email, email);

  const wrongPassword = await api('POST', '/api/auth/login', { body: { email, password: 'wrong-password' } });
  const unknownEmail = await api('POST', '/api/auth/login', {
    body: { email: 'nobody@example.com', password: 'wrong-password' },
  });
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
});

test('protected routes reject missing, malformed and forged tokens', async () => {
  for (const path of ['/api/auth/me', '/api/orders', '/api/orders/1', '/api/admin/users', '/api/admin/orders']) {
    assert.equal((await api('GET', path)).status, 401, `${path} without a token`);
    assert.equal((await api('GET', path, { token: 'forged-token' })).status, 401, `${path} with a forged token`);
  }
  const basic = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: 'Basic abc' } });
  assert.equal(basic.status, 401);
});

test('logout revokes the token', async () => {
  const { token } = await registerCustomer('carol');
  assert.equal((await api('POST', '/api/auth/logout', { token })).status, 204);
  assert.equal((await api('GET', '/api/auth/me', { token })).status, 401);
});

test('attack: swapping the order ID returns 404 for another customer', async () => {
  const alice = await registerCustomer('alice');
  const eve = await registerCustomer('eve');
  const aliceOrder = await placeOrder(alice.token);
  const eveOrder = await placeOrder(eve.token);

  assert.equal((await api('GET', `/api/orders/${eveOrder.id}`, { token: eve.token })).status, 200);

  const stolen = await api('GET', `/api/orders/${aliceOrder.id}`, { token: eve.token });
  const missing = await api('GET', '/api/orders/999999', { token: eve.token });
  assert.equal(stolen.status, 404);
  assert.deepEqual(stolen.body, missing.body, 'a foreign order must look exactly like a missing one');

  const listed = await api('GET', '/api/orders', { token: eve.token });
  assert.deepEqual(listed.body.orders.map((order) => order.id), [eveOrder.id]);
});

test('attack: an order cannot be created on behalf of another customer', async () => {
  const alice = await registerCustomer('alice');
  const eve = await registerCustomer('eve');
  const { body } = await api('POST', '/api/orders', {
    token: eve.token,
    body: { customerId: alice.user.id, items: [{ productId: 'sku-1', quantity: 1 }] },
  });
  assert.equal(body.order.customerId, eve.user.id);
});

test('attack: a customer calling admin routes gets 403', async () => {
  const { token } = await registerCustomer('eve');
  for (const path of ['/api/admin/users', '/api/admin/orders', '/api/admin/anything-else']) {
    assert.equal((await api('GET', path, { token })).status, 403, path);
  }
});

test('admin can use admin routes and read any order', async () => {
  const alice = await registerCustomer('alice');
  const aliceOrder = await placeOrder(alice.token);
  const adminToken = await signInAdmin();

  const users = await api('GET', '/api/admin/users', { token: adminToken });
  assert.equal(users.status, 200);
  assert.ok(users.body.users.every((user) => !('passwordHash' in user)));

  const orders = await api('GET', '/api/admin/orders', { token: adminToken });
  assert.ok(orders.body.orders.some((order) => order.id === aliceOrder.id));
  assert.equal((await api('GET', `/api/orders/${aliceOrder.id}`, { token: adminToken })).status, 200);
});

test('errors use the shared JSON shape', async () => {
  const unknown = await api('GET', '/api/does-not-exist');
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error.code, 'not_found');

  const badJson = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.equal(badJson.status, 400);
  assert.equal((await badJson.json()).error.code, 'invalid_json');
});
