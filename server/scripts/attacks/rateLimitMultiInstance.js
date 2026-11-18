// M2 distributed-bucket proof: two independent Node processes share one Redis bucket.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import Redis from 'ioredis';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const worker = path.join(root, 'scripts', 'attacks', 'rateLimitWorker.js');
const name = `m2-burst-${process.pid}-${Date.now()}`;
const capacity = 60;
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, connectTimeout: 1000, maxRetriesPerRequest: 1, retryStrategy: () => null });
const children = [];

function startWorker() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker], {
      cwd: root,
      env: { ...process.env, RATE_LIMIT_ATTACK_NAME: name, RATE_LIMIT_ATTACK_CAPACITY: String(capacity) },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    children.push(child);
    let stdout = '';
    let stderr = '';
    const startupTimer = setTimeout(() => reject(new Error(`Worker did not start. ${stderr}`)), 10000);
    child.stdout.on('data', async (chunk) => {
      stdout += chunk.toString();
      const match = stdout.match(/READY:(\d+)/);
      if (!match) return;
      clearTimeout(startupTimer);
      const url = `http://127.0.0.1:${match[1]}`;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          await axios.get(`${url}/ready`, { timeout: 500 });
          return resolve(url);
        } catch { await sleep(50); }
      }
      reject(new Error(`Worker did not become ready. ${stderr}`));
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code && code !== 0) reject(new Error(`Worker exited with code ${code}. ${stderr}`));
    });
  });
}

try {
  await redis.connect();
  await redis.ping();
  const [first, second] = await Promise.all([startWorker(), startWorker()]);
  const results = await Promise.all(Array.from({ length: 200 }, (_, index) =>
    axios.get(`${index % 2 ? first : second}/limited`, { validateStatus: () => true, timeout: 5000 }),
  ));
  const allowed = results.filter((response) => response.status === 204).length;
  const rejected = results.filter((response) => response.status === 429).length;
  if (allowed !== capacity || rejected !== 200 - capacity) {
    throw new Error(`Expected ${capacity} allowed and ${200 - capacity} rejected; got ${allowed} allowed and ${rejected} rejected`);
  }
  console.log(`PASS: 2 Node processes sharing Redis allowed ${allowed}/200 requests and rejected ${rejected}.`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const child of children) child.kill('SIGTERM');
  if (redis.status === 'ready') {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `commerceforge:rate-limit:*${name}*`, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
    await redis.hdel('commerceforge:rate-limit:metrics', ...['active', 'requests', 'allowed', 'rejected', 'overflow'].map((field) => `${field}:${name}`));
    await redis.quit();
  } else {
    redis.disconnect();
  }
}
