import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { query } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

export default async function adminUsersHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  if (req.method === 'GET') {
    try {
      const { rows: users } = await query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
      res.status(200).json(users);
    } catch (error) {
      console.error('Admin GET users error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required' });
    }
    if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
      const existingUsers = await query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUsers.rows.length > 0) {
        return res.status(409).json({ message: 'Username already taken' });
      }

      const passwordHash = await hashPassword(password);
      const { rows } = await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, passwordHash, role]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Admin POST user error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
