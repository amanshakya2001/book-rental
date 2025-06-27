import { useState, useEffect } from 'react';
import { Table, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setApiLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      setSuccess(`Successfully updated role for user ${data.username}.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setApiLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setApiLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add user');
      setSuccess(`Successfully added user ${data.username}.`);
      setNewUser({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setApiLoading(false);
    }
  };

  const handleInputChange = (e) => setNewUser({ ...newUser, [e.target.name]: e.target.value });

  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      <section className="bg-white p-5 rounded-3 shadow-lg mb-5">
        <h2 className="text-primary mb-4 border-bottom pb-2">Add New User</h2>
        <Form onSubmit={handleAddUser}>
          <Row className="g-3 align-items-end">
            <Col md={4}><Form.Group><Form.Label>Username</Form.Label><Form.Control className="rounded-pill" type="text" name="username" value={newUser.username} onChange={handleInputChange} required /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Password</Form.Label><Form.Control className="rounded-pill" type="password" name="password" value={newUser.password} onChange={handleInputChange} required /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Role</Form.Label><Form.Select className="rounded-pill" name="role" value={newUser.role} onChange={handleInputChange}><option value="user">User</option><option value="admin">Admin</option></Form.Select></Form.Group></Col>
            <Col md={1}><Button type="submit" variant="primary" className="rounded-pill w-100 py-2 shadow-sm" disabled={apiLoading}>{apiLoading ? <Spinner size="sm" /> : 'Add'}</Button></Col>
          </Row>
        </Form>
      </section>

      <section className="bg-white p-5 rounded-3 shadow-lg">
        <h2 className="text-primary mb-4 border-bottom pb-2">Manage Users</h2>
        <div className="table-responsive">
          <Table striped hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Current Role</th>
                <th scope="col" style={{ width: '200px' }}>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="fw-bold font-monospace">{user.username}</td>
                  <td><span className={`badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}`}>{user.role}</span></td>
                  <td>
                    <Form.Select
                      className="rounded-pill"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={apiLoading || user.username === 'admin'}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </>
  );
}
