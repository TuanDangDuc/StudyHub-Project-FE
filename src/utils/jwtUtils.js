export function decodeJwt(token) {
  try {
    let cleanToken = token;
    if (token && token.startsWith('Bearer ')) cleanToken = token.slice(7);
    return JSON.parse(atob(cleanToken.split('.')[1]));
  } catch {
    return null;
  }
}

export function getTokenTtlSeconds(token) {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp === 'undefined') return Infinity;
  let exp = payload.exp;
  if (exp > 1000000000000) exp = Math.floor(exp / 1000);
  return exp - Math.floor(Date.now() / 1000);
}

export function isTokenExpired(token) {
  if (!token) return true;
  const ttl = getTokenTtlSeconds(token);
  if (ttl === Infinity) return false;
  return ttl <= 0;
}
