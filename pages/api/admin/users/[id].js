import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../../lib/session';
import { query } from '../../../../lib/db';

export default async function adminUserIdHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (Number(id) === user.id && user.role === 'admin' && role !== 'admin') {
        try {
            const { rows: adminCount } = await query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
            if (parseInt(adminCount[0].count, 10) <= 1) {
                return res.status(400).json({ message: 'Cannot demote the only admin.' });
            }
        } catch (error) {
            console.error('Admin count error:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    try {
      const { rows } = await query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
        [role, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Admin PUT user error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
