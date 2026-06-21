// ─────────────────────────────────────────────
// JWT utility helpers (không phụ thuộc React)
// ─────────────────────────────────────────────

/**
 * Decode JWT payload (không verify signature).
 * @param {string} token
 * @returns {object|null}
 */
export function decodeJwt(token) {
  try {
    let cleanToken = token;
    if (token && token.startsWith('Bearer ')) cleanToken = token.slice(7);
    return JSON.parse(atob(cleanToken.split('.')[1]));
  } catch {
    return null;
  }
}

/**
 * Trả về số giây còn lại của token.
 * Kết quả âm = đã hết hạn.
 * @param {string} token
 * @returns {number}
 */
export function getTokenTtlSeconds(token) {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp === 'undefined') return Infinity; // Không có exp -> coi như không hết hạn
  let exp = payload.exp;
  if (exp > 1000000000000) exp = Math.floor(exp / 1000); // Đổi từ milisec sang sec nếu cần
  return exp - Math.floor(Date.now() / 1000);
}

/**
 * Kiểm tra token đã hết hạn chưa.
 * @param {string|null} token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  if (!token) return true;
  const ttl = getTokenTtlSeconds(token);
  if (ttl === Infinity) return false;
  return ttl <= 0;
}
