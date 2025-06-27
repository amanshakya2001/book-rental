import { useState } from 'react';
import { 
  Container, 
  Form, 
  Button, 
  Alert, 
  Card, 
  Image, 
  Row, 
  Col, 
  Spinner,
  Badge,
  Stack
} from 'react-bootstrap';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../lib/session';
import { query } from '../lib/db';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function ProfilePage({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    instagram_url: user.instagram_url || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio);
      // Normalize Instagram URL
      let igUrl = formData.instagram_url.trim();
      if (igUrl && !igUrl.startsWith('http')) {
        igUrl = `https://instagram.com/${igUrl.replace(/^@/, '')}`;
      }
      formDataToSend.append('instagram_url', igUrl);
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update the user in the session and update previewUrl if avatar changed
      if (data.user) {
        setUser(data.user);
        setFormData({
          bio: data.user.bio || '',
          instagram_url: data.user.instagram_url || '',
        });
        if (data.user.avatar_url) {
          setPreviewUrl(data.user.avatar_url);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'danger', text: error.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>My Profile | BookRental</title>
        <style>
          {`
            .bg-gradient-primary {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            }
            .fw-500 {
              font-weight: 500 !important;
            }
            .fw-600 {
              font-weight: 600 !important;
            }
            .avatar-upload-btn:hover {
              transform: translate(8px, -8px) scale(1.05) !important;
            }
            .avatar-upload-input {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0,0,0,0);
              border: 0;
            }
          `}
        </style>
      </Head>
      
      <div className="py-5 bg-gradient-primary">
        <Container>
          <div className="d-flex flex-column align-items-center text-center">
            <div className="profile-avatar-container position-relative mb-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  className="profile-avatar rounded-circle"
                  alt={user.username || 'User'}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    border: '4px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div 
                  className="profile-avatar rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '42px',
                    border: '4px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <label 
                className="avatar-upload-btn"
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                title="Change profile picture"
                style={{
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #f3f4f6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 2,
                  transition: 'transform 0.2s',
                  transform: 'translate(8px, -8px)'
                }}
              >
                <i className="bi bi-camera-fill" style={{ color: '#6366f1', fontSize: '1.1rem' }}></i>
                <input
                  type="file"
                  accept="image/*"
                  className="avatar-upload-input d-none"
                  onChange={handleFileChange}
                  aria-label="Upload profile picture"
                />
              </label>
            </div>
            <div className="text-white">
              <h2 className="mb-1 fw-bold">{user.username}</h2>
              <div className="opacity-75 mb-2">
                <i className="bi bi-calendar-check me-2"></i>
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </div>
              {user.role === 'admin' && (
                <Badge bg="light" text="primary" className="fw-500 px-3">Admin</Badge>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container className="mb-5" style={{ marginTop: '-30px' }}>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0 fw-600">Profile Settings</h4>
                </div>
                
                {message.text && (
                  <Alert 
                    variant={message.type} 
                    className="mb-4 d-flex align-items-center"
                    onClose={() => setMessage({ type: '', text: '' })} 
                    dismissible
                  >
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i>
                    <div>{message.text}</div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <div className="p-4 bg-light rounded-3 mb-4">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-500 mb-3">Username</Form.Label>
                      <div className="d-flex align-items-center">
                        <Form.Control
                          type="text"
                          value={user.username}
                          disabled
                          className="bg-white border-0 shadow-none"
                          style={{ maxWidth: '300px' }}
                        />
                        <span className="ms-3 text-muted small">Cannot be changed</span>
                      </div>
                    </Form.Group>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-500 mb-3">Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      className="border-0 bg-light"
                      style={{ resize: 'none' }}
                    />
                    <Form.Text className="text-muted mt-2">
                      A short bio about yourself (max 200 characters)
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-500 mb-3">Social Links</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0">
                        <i className="bi bi-instagram text-danger"></i>
                      </span>
                      <Form.Control
                        type="text"
                        name="instagram_url"
                        value={formData.instagram_url}
                        onChange={handleInputChange}
                        placeholder="Enter your Instagram username or full URL"
                        className="bg-light border-0 shadow-none"
                      />
                    </div>
                    {formData.instagram_url && (
                      <div className="d-flex align-items-center mt-2">
                        <i className="bi bi-link-45deg text-muted me-2"></i>
                        <a 
                          href={formData.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary small text-decoration-none"
                        >
                          {formData.instagram_url}
                        </a>
                      </div>
                    )}
                  </Form.Group>

                  <div className="d-flex justify-content-end pt-3 border-top">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={isLoading}
                      className="rounded-pill px-4 py-2"
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4 fw-600">Account Actions</h5>
                <Stack gap={3}>
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                    <div>
                      <h6 className="mb-1 fw-500">Change Password</h6>
                      <p className="small text-muted mb-0">Update your account password</p>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="rounded-pill px-3"
                      href="/change-password"
                    >
                      Change
                    </Button>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                    <div>
                      <h6 className="mb-1 fw-500">Delete Account</h6>
                      <p className="small text-muted mb-0">Permanently delete your account and all data</p>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="rounded-pill px-3"
                      disabled
                    >
                      Delete
                    </Button>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}

export const getServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  
  if (!session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Get the latest user data
  const result = await query('SELECT * FROM users WHERE id = $1', [session.user.id]);
  const user = result.rows[0];

  return {
    props: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url || null,
        bio: user.bio || '',
        instagram_url: user.instagram_url || '',
      },
    },
  };
};
