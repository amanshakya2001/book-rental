import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { query } from '../../../lib/db';

export default async function bookIdHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const { action } = req.body;

      const bookResult = await query('SELECT * FROM books WHERE id = $1', [id]);
      if (bookResult.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }
      const book = bookResult.rows[0];

      let updatedBook;

      if (action === 'rent') {
        if (!book.is_available || book.owner_id === user.id) {
          return res.status(400).json({ message: 'Cannot rent this book' });
        }
        const result = await query(
          'UPDATE books SET is_available = false, renter_id = $1, rented_until = NOW() + INTERVAL \'7 days\' WHERE id = $2 RETURNING *',
          [user.id, id]
        );
        updatedBook = result.rows[0];
      } else if (action === 'return') {
        if (book.renter_id !== user.id) {
          return res.status(403).json({ message: 'You are not the renter of this book' });
        }
        const result = await query(
          'UPDATE books SET is_available = true, renter_id = NULL, rented_until = NULL WHERE id = $1 RETURNING *',
          [id]
        );
        updatedBook = result.rows[0];
      } else if (action === 'mark_available') {
        if (book.owner_id !== user.id && user.role !== 'admin') {
          return res.status(403).json({ message: 'You are not the owner of this book' });
        }
        const result = await query(
          'UPDATE books SET is_available = true, renter_id = NULL, rented_until = NULL WHERE id = $1 RETURNING *',
          [id]
        );
        updatedBook = result.rows[0];
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }
      res.status(200).json(updatedBook);
    } else if (req.method === 'DELETE') {
      const bookResult = await query('SELECT owner_id FROM books WHERE id = $1', [id]);
      if (bookResult.rows.length === 0) {
        return res.status(404).json({ message: 'Book not found' });
      }

      if (bookResult.rows[0].owner_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not the owner of this book' });
      }

      await query('DELETE FROM books WHERE id = $1', [id]);
      res.status(204).end();
    } else {
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
