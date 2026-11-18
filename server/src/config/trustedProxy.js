// Trust only explicitly configured proxy addresses/CIDRs. Hop-count trust can
// accept attacker-supplied X-Forwarded-For when the app is reached directly.
export function parseTrustedProxyCidrs(value = process.env.TRUST_PROXY_CIDRS || '') {
  const cidrs = String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return cidrs.length ? cidrs : false;
}

export function configureTrustedProxy(app, value = process.env.TRUST_PROXY_CIDRS || '') {
  const cidrs = parseTrustedProxyCidrs(value);
  app.set('trust proxy', cidrs);
  return cidrs;
}
