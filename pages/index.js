import { useState } from 'react';
import { Row, Col, Card, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../lib/session';
import { query } from '../lib/db';
import Layout from '../components/Layout';

export default function Home({ user, initialBooks }) {
  const [books, setBooks] = useState(initialBooks || []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, action: null, book: null, title: '', body: '' });
  const [newBook, setNewBook] = useState({ title: '', author: '', price_per_day: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error('Failed to fetch books');
      setBooks(await res.json());
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

  const handleAddBook = async (e) => {
    e.preventDefault();
    setApiLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newBook, price_per_day: parseFloat(newBook.price_per_day) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add book');
      setSuccess(`Successfully added "${data.title}"`);
      setNewBook({ title: '', author: '', price_per_day: '' });
      fetchBooks();
    } catch (err) { setError(err.message); }
    finally { setApiLoading(false); }
  };

  const handleInputChange = (e) => setNewBook({ ...newBook, [e.target.name]: e.target.value });
  const openModal = (action, book) => setModal({ show: true, action, book, title: `Confirm ${action.replace(/_/g, ' ')}`, body: `Are you sure you want to ${action.replace(/_/g, ' ')} "${book.title}"?` });
  const closeModal = () => setModal({ show: false, action: null, book: null, title: '', body: '' });

  const confirmAction = () => {
    const { action, book } = modal;
    if (!action || !book) return;
    if (action === 'rent' && user) {
      handleBookAction(book.id, 'PUT', { action });
    }
  };

  const renderBookCard = (book) => (
    <Col key={book.id}>
      <Card className="h-100 border-0 shadow-sm rounded-3">
        <Card.Body className="d-flex flex-column p-4">
          <Card.Title className="text-dark fw-bold">{book.title}</Card.Title>
          <Card.Text className="text-muted">by {book.author}</Card.Text>
          <Card.Text className="fs-5 fw-bold text-success my-2">${parseFloat(book.price_per_day).toFixed(2)} <small className="fw-normal">/ day</small></Card.Text>
          <Card.Text className="text-muted small">Posted by: <span className="font-monospace text-break">{user && book.owner_id === user.id ? 'You' : book.owner_username}</span></Card.Text>
          <div className="mt-auto pt-3">
            {user && book.owner_id === user.id
              ? <div className="d-block text-center py-2 text-primary bg-primary bg-opacity-10 rounded-pill fw-bold">Your Book</div>
              : book.is_available
                ? <Button variant="success" className="rounded-pill w-100 py-2 shadow-sm" onClick={() => openModal('rent', book)} disabled={!user}>Rent This Book</Button>
                : <div className="d-block text-center py-2 text-warning bg-warning bg-opacity-10 rounded-pill fw-bold">Rented</div>
            }
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.author.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!user) {
    return (
      <Layout user={null}>
        <section className="bg-white p-5 rounded-3 shadow-lg text-center">
          <h1 className="text-primary">Welcome to Book Rental!</h1>
          <p className="lead text-muted">The best place to rent and share books online.</p>
          <Button variant="primary" href="/login" className="rounded-pill px-4 py-2">Login to Get Started</Button>
        </section>
        <section className="mt-5">
          <h2 className="text-primary mb-4 border-bottom pb-2">Available Now</h2>
          <Form.Group className="mb-4">
            <Form.Control type="text" placeholder="Search by title or author..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rounded-pill" />
          </Form.Group>
          <Row xs={1} md={2} lg={3} xl={4} className="g-4">
            {filteredBooks.filter(b => b.is_available).length > 0
              ? filteredBooks.filter(b => b.is_available).map(renderBookCard)
              : <Col><p className="text-muted fst-italic">No books found.</p></Col>}
          </Row>
        </section>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      <section className="bg-white p-5 rounded-3 shadow-lg mb-5">
        <h2 className="text-primary mb-4 border-bottom pb-2">Add New Book</h2>
        <Form onSubmit={handleAddBook}>
          <Row className="g-3 align-items-end">
            <Col md={5}><Form.Group><Form.Label>Book Title</Form.Label><Form.Control className="rounded-pill" type="text" name="title" value={newBook.title} onChange={handleInputChange} required /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Author</Form.Label><Form.Control className="rounded-pill" type="text" name="author" value={newBook.author} onChange={handleInputChange} required /></Form.Group></Col>
            <Col md={2}><Form.Group><Form.Label>Price/Day ($)</Form.Label><Form.Control className="rounded-pill" type="number" name="price_per_day" value={newBook.price_per_day} onChange={handleInputChange} required min="0.01" step="0.01" /></Form.Group></Col>
            <Col md={1}><Button type="submit" variant="primary" className="rounded-pill w-100 py-2 shadow-sm" disabled={apiLoading}>{apiLoading ? <Spinner size="sm" /> : 'Add'}</Button></Col>
          </Row>
        </Form>
      </section>

      <section className="bg-white p-5 rounded-3 shadow-lg">
        <h2 className="text-primary mb-4 border-bottom pb-2">All Books For Rent</h2>
        <Form.Group className="mb-4">
          <Form.Control type="text" placeholder="Search by title or author..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rounded-pill" />
        </Form.Group>
        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
          {filteredBooks.length > 0
            ? filteredBooks.map(renderBookCard)
            : <Col><p className="text-muted fst-italic">No books found.</p></Col>}
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
  const { rows: books } = await query(`
    SELECT b.*, u.username as owner_username
    FROM books b
    JOIN users u ON b.owner_id = u.id
    ORDER BY b.created_at DESC
  `);
  return {
    props: {
      user: user || null,
      initialBooks: JSON.parse(JSON.stringify(books)) || [],
    },
  };
};
