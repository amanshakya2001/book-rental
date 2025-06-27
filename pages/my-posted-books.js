import { useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Alert, Spinner } from 'react-bootstrap';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../lib/session';
import { query } from '../lib/db';
import Layout from '../components/Layout';

export default function MyPostedBooks({ user, initialBooks }) {
  const [books, setBooks] = useState(initialBooks || []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, action: null, book: null, title: '', body: '' });

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books'); // Fetches all books, then we filter
      if (!res.ok) throw new Error('Failed to fetch books');
      const allBooks = await res.json();
      setBooks(allBooks.filter(b => b.owner_id === user.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBookAction = async (bookId, method, body) => {
    setApiLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/books/${bookId}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');
      setSuccess('Action successful!');
      fetchBooks();
    } catch (err) { setError(err.message); }
    finally { setApiLoading(false); closeModal(); }
  };

  const openModal = (action, book) => setModal({ show: true, action, book, title: `Confirm ${action.replace(/_/g, ' ')}`, body: `Are you sure you want to ${action.replace(/_/g, ' ')} "${book.title}"?` });
  const closeModal = () => setModal({ show: false, action: null, book: null, title: '', body: '' });

  const confirmAction = () => {
    const { action, book } = modal;
    if (!action || !book) return;
    action === 'delete' ? handleBookAction(book.id, 'DELETE') : handleBookAction(book.id, 'PUT', { action });
  };

  const renderMyBookCard = (book) => (
    <Col key={book.id}>
      <Card className="h-100 border-0 shadow-sm rounded-3">
        <Card.Body className="d-flex flex-column p-4">
          <Card.Title className="text-dark fw-bold">{book.title}</Card.Title>
          <Card.Text className="text-muted">by {book.author}</Card.Text>
          <div className="mt-3">
            {book.is_available
              ? <p><span className="text-success fw-semibold">Available</span></p>
              : <p><span className="text-warning fw-semibold">Rented</span> by: <span className="font-monospace text-break">{book.renter_id}</span></p>}
          </div>
          <div className="d-grid gap-2 mt-auto pt-2">
            {!book.is_available && <Button variant="info" className="rounded-pill py-2 shadow-sm" onClick={() => openModal('mark_available', book)}>Mark as Available</Button>}
            <Button variant="danger" className="rounded-pill py-2 shadow-sm" onClick={() => openModal('delete', book)}>Delete Book</Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Layout user={user}>
      <section className="bg-white p-5 rounded-3 shadow-lg">
        <h2 className="text-primary mb-4 border-bottom pb-2">My Posted Books</h2>
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
          {books.length > 0 ? books.map(renderMyBookCard) : <Col><p className="text-muted fst-italic">You haven't posted any books yet.</p></Col>}
        </Row>
      </section>

      <Modal show={modal.show} onHide={closeModal} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{modal.title}</Modal.Title></Modal.Header>
        <Modal.Body><p className="text-secondary">{modal.body}</p></Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={closeModal} disabled={apiLoading}>Cancel</Button>
          <Button variant="primary" className="rounded-pill px-4" onClick={confirmAction} disabled={apiLoading}>{apiLoading ? <Spinner size="sm" /> : 'Confirm'}</Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}

export const getServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  const { user } = session;

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { rows: books } = await query('SELECT * FROM books WHERE owner_id = $1 ORDER BY created_at DESC', [user.id]);

  return {
    props: {
      user,
      initialBooks: JSON.parse(JSON.stringify(books)) || [],
    },
  };
};
