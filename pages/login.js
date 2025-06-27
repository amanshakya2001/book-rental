import { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../lib/session';
import Layout from '../components/Layout';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout user={null}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <section className="bg-white p-5 rounded-3 shadow-lg">
            <h2 className="text-primary mb-4 border-bottom pb-2 text-center">Log In</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="rounded-pill" />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-pill" />
              </Form.Group>
              <div className="d-grid">
                <Button type="submit" variant="primary" className="rounded-pill py-2 shadow-sm">Log In</Button>
              </div>
            </Form>
            <div className="text-center mt-4">
              <Link href="/signup" legacyBehavior><a className="text-muted">Need an account? Sign Up</a></Link>
            </div>
          </section>
        </Col>
      </Row>
    </Layout>
  );
}

export const getServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (session.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  return { props: {} };
};
