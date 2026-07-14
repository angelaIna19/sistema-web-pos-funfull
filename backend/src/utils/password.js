const crypto = require("crypto");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, hash] = storedHash.split(":");
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

module.exports = { hashPassword, verifyPassword };
