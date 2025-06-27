import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPassword(password) {
  const passwordHash = await bcrypt.hash(password, saltRounds);
  return passwordHash;
}

export async function verifyPassword(password, hash) {
  const match = await bcrypt.compare(password, hash);
  return match;
}
