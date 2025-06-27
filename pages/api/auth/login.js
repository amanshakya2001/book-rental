import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { verifyPassword } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function loginHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const session = await getIronSession(req, res, sessionOptions);
    session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    await session.save();

    res.status(200).json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
}
