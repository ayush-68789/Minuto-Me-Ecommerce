import { getRateLimitMetrics } from '../middleware/tokenBucketRateLimit.js';
import { getAiUsageMetrics } from '../services/aiProviderGovernor.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function readRateLimitMetrics(_req, res, next) {
  try {
    const [rateLimits, aiUsage] = await Promise.all([getRateLimitMetrics(), getAiUsageMetrics()]);
    return res.status(200).json({ rateLimits, aiUsage });
  } catch {
    return next(new HttpError(503, 'rate_limit_metrics_unavailable', 'Rate-limit metrics are temporarily unavailable'));
  }
}
