import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../lib/session';
import { query } from '../../lib/db';

export default async function booksHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      const { rows: books } = await query('SELECT * FROM books ORDER BY created_at DESC');
      res.status(200).json(books);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, author, price_per_day } = req.body;
      const result = await query(
        'INSERT INTO books (title, author, price_per_day, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, author, price_per_day, user.id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
