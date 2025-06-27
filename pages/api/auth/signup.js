import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { hashPassword } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function signupHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existingUsers = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUsers.rows.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, passwordHash, 'user']
    );
    const user = result.rows[0];

    const session = await getIronSession(req, res, sessionOptions);
    session.user = user;
    await session.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred during signup' });
  }
}
