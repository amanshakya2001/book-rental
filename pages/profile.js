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
              min-height: 300px;
              position: relative;
            }
            .fw-500 {
              font-weight: 500 !important;
            }
            .fw-600 {
              font-weight: 600 !important;
            }
            .profile-avatar-container {
              position: relative;
              display: inline-block;
            }
            .avatar-upload-btn {
              position: absolute;
              bottom: 8px;
              right: 8px;
              width: 40px;
              height: 40px;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              z-index: 10;
            }
            .avatar-upload-btn:hover {
              transform: scale(1.1);
              background: #f8f9fa;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
              opacity: 0;
            }
            .profile-card {
              margin-top: -60px;
              position: relative;
              z-index: 5;
            }
            .form-section {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
              border: 1px solid #e9ecef;
            }
            .social-preview {
              background: white;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 12px;
              margin-top: 8px;
            }
          `}
        </style>
      </Head>
      
      <div className="py-5 bg-gradient-primary">
        <Container>
          <div className="d-flex flex-column align-items-center text-center py-4">
            <div className="profile-avatar-container mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  className="rounded-circle"
                  alt={user.username || 'User'}
                  style={{
                    width: '140px',
                    height: '140px',
                    objectFit: 'cover',
                    border: '5px solid white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '140px',
                    height: '140px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '48px',
                    border: '5px solid white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }}
                >
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <label 
                className="avatar-upload-btn"
                title="Change profile picture"
              >
                <i className="bi bi-camera-fill" style={{ color: '#6366f1', fontSize: '1.2rem' }}></i>
                <input
                  type="file"
                  accept="image/*"
                  className="avatar-upload-input"
                  onChange={handleFileChange}
                  aria-label="Upload profile picture"
                />
              </label>
            </div>
            <div className="text-white">
              <h1 className="mb-2 fw-bold h2">{user.username}</h1>
              <p className="mb-3 opacity-75">
                <i className="bi bi-calendar-check me-2"></i>
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
              {user.role === 'admin' && (
                <Badge bg="light" text="primary" className="fw-500 px-3 py-2">
                  <i className="bi bi-shield-check me-1"></i>
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container className="mb-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <Card className="profile-card border-0 shadow-lg">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h3 className="mb-1 fw-600">Profile Settings</h3>
                  <p className="text-muted">Manage your personal information and preferences</p>
                </div>
                
                {message.text && (
                  <Alert 
                    variant={message.type} 
                    className="mb-4 d-flex align-items-center border-0"
                    onClose={() => setMessage({ type: '', text: '' })} 
                    dismissible
                  >
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-3 fs-5`}></i>
                    <div className="flex-grow-1">{message.text}</div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-600 mb-3 d-flex align-items-center">
                        <i className="bi bi-person-fill me-2 text-primary"></i>
                        Username
                      </Form.Label>
                      <div className="d-flex align-items-center flex-wrap">
                        <Form.Control
                          type="text"
                          value={user.username}
                          disabled
                          className="bg-white border-2 me-3 mb-2 mb-md-0"
                          style={{ maxWidth: '300px', fontSize: '1.1rem' }}
                        />
                        <Badge bg="secondary" className="px-3 py-2">
                          <i className="bi bi-lock-fill me-1"></i>
                          Cannot be changed
                        </Badge>
                      </div>
                    </Form.Group>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-600 mb-3 d-flex align-items-center">
                      <i className="bi bi-textarea-resize me-2 text-primary"></i>
                      Bio
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself... What are your interests? What books do you love?"
                      className="border-2"
                      style={{ resize: 'none', fontSize: '1rem' }}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <Form.Text className="text-muted">
                        Share a bit about yourself with the community
                      </Form.Text>
                      <small className="text-muted">
                        {formData.bio.length}/200
                      </small>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-5">
                    <Form.Label className="fw-600 mb-3 d-flex align-items-center">
                      <i className="bi bi-share me-2 text-primary"></i>
                      Social Links
                    </Form.Label>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-gradient-primary text-white border-0">
                        <i className="bi bi-instagram"></i>
                      </span>
                      <Form.Control
                        type="text"
                        name="instagram_url"
                        value={formData.instagram_url}
                        onChange={handleInputChange}
                        placeholder="Enter your Instagram username or full URL"
                        className="border-2 border-start-0"
                        style={{ fontSize: '1rem' }}
                      />
                    </div>
                    {formData.instagram_url && (
                      <div className="social-preview">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-link-45deg text-muted me-2"></i>
                          <span className="me-2 text-muted small">Preview:</span>
                          <a 
                            href={formData.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary fw-500 text-decoration-none"
                          >
                            {formData.instagram_url}
                          </a>
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  <div className="text-center pt-4 border-top">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={isLoading}
                      className="rounded-pill px-5 py-2 fw-600"
                      style={{ minWidth: '160px' }}
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
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mt-4">
              <Card.Body className="p-4">
                <h5 className="mb-4 fw-600 d-flex align-items-center">
                  <i className="bi bi-gear-fill me-2 text-primary"></i>
                  Account Actions
                </h5>
                <Stack gap={3}>
                  <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded-3 border">
                    <div>
                      <h6 className="mb-1 fw-600 d-flex align-items-center">
                        <i className="bi bi-key-fill me-2 text-warning"></i>
                        Change Password
                      </h6>
                      <p className="small text-muted mb-0">Update your account password for better security</p>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="rounded-pill px-4 fw-500"
                      href="/change-password"
                    >
                      Change
                    </Button>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-4 bg-light rounded-3 border">
                    <div>
                      <h6 className="mb-1 fw-600 d-flex align-items-center">
                        <i className="bi bi-trash-fill me-2 text-danger"></i>
                        Delete Account
                      </h6>
                      <p className="small text-muted mb-0">Permanently delete your account and all associated data</p>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="rounded-pill px-4 fw-500"
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
