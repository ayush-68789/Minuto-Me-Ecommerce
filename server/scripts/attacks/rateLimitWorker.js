import express from 'express';
import { createTokenBucketLimiter } from '../../src/middleware/tokenBucketRateLimit.js';

const app = express();
const name = process.env.RATE_LIMIT_ATTACK_NAME;
const capacity = Number(process.env.RATE_LIMIT_ATTACK_CAPACITY || 60);
const rateLimit = createTokenBucketLimiter({
  name,
  config: { capacity, refillRate: 0.000001, maxActiveKeys: 20 },
  keyGenerator: (req) => req.ip,
});

app.get('/ready', (_req, res) => res.sendStatus(204));
app.get('/limited', rateLimit, (_req, res) => res.sendStatus(204));

const server = app.listen(0, '127.0.0.1', () => {
  process.stdout.write(`READY:${server.address().port}\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
